<?php
declare(strict_types=1);

namespace Mastrotickets\Services;

use Mastrotickets\Config\Database;
use Mastrotickets\Config\Env;
use PDO;
use Exception;

class StripeService
{
    private static function getSecretKey(): string
    {
        $key = Env::get('STRIPE_SECRET_KEY');
        if (empty($key)) {
            throw new Exception('STRIPE_SECRET_KEY is not configured in backend environment.');
        }
        return $key;
    }

    /**
     * Create a Stripe Checkout Session
     */
    public static function createCheckoutSession(array $params): array
    {
        $secretKey = self::getSecretKey();
        $currency = strtolower($params['currency'] ?? 'aed');
        $frontendUrl = rtrim(Env::get('FRONTEND_URL', 'https://mastrotickets.co'), '/');

        $lineItems = [];
        foreach ($params['items'] as $index => $item) {
            $unitAmount = (int)round(($item['unitPrice'] + ($item['fee'] ?? 0)) * 100);
            $lineItems["line_items[{$index}][price_data][currency]"] = $currency;
            $lineItems["line_items[{$index}][price_data][product_data][name]"] = $item['name'];
            $lineItems["line_items[{$index}][price_data][product_data][description]"] = "MastroTickets F1 Booking - {$item['name']}";
            $lineItems["line_items[{$index}][price_data][unit_amount]"] = $unitAmount;
            $lineItems["line_items[{$index}][quantity]"] = (int)$item['quantity'];
        }

        $payload = array_merge($lineItems, [
            'mode' => 'payment',
            'success_url' => "{$frontendUrl}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}",
            'cancel_url' => "{$frontendUrl}/checkout?status=cancelled",
            'customer_email' => $params['customerEmail'] ?? '',
            'client_reference_id' => $params['reservationId'] ?? '',
            'metadata[reservation_id]' => $params['reservationId'] ?? '',
            'metadata[reservation_ref]' => $params['reservationReference'] ?? '',
            'metadata[order_id]' => $params['orderId'] ?? '',
            'metadata[customer_name]' => $params['customerName'] ?? '',
            'metadata[customer_email]' => $params['customerEmail'] ?? '',
            'metadata[event_id]' => $params['eventId'] ?? '',
        ]);

        $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $secretKey,
                'Content-Type: application/x-www-form-urlencoded',
            ],
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("Stripe connection error: {$error}");
        }

        $result = json_decode($response, true);
        if ($httpCode >= 400 || empty($result['id'])) {
            $msg = $result['error']['message'] ?? 'Failed to initialize Stripe checkout session';
            throw new Exception("Stripe API error: {$msg}");
        }

        return [
            'sessionId' => $result['id'],
            'url' => $result['url'],
            'status' => $result['status'],
        ];
    }

    /**
     * Verify Stripe Webhook Signature
     */
    public static function verifyWebhookSignature(string $payload, string $sigHeader): bool
    {
        $webhookSecret = Env::get('STRIPE_WEBHOOK_SECRET');
        if (empty($webhookSecret)) {
            // If in local dev without secret, warn but verify if dummy
            return Env::get('APP_ENV') === 'development';
        }

        $items = explode(',', $sigHeader);
        $timestamp = null;
        $signatures = [];

        foreach ($items as $item) {
            $parts = explode('=', trim($item), 2);
            if (count($parts) === 2) {
                if ($parts[0] === 't') {
                    $timestamp = $parts[1];
                } elseif ($parts[0] === 'v1') {
                    $signatures[] = $parts[1];
                }
            }
        }

        if (!$timestamp || empty($signatures)) {
            return false;
        }

        // Check timestamp tolerance (5 minutes)
        if (abs(time() - (int)$timestamp) > 300) {
            return false;
        }

        $signedPayload = "{$timestamp}.{$payload}";
        $expectedSignature = hash_hmac('sha256', $signedPayload, $webhookSecret);

        foreach ($signatures as $signature) {
            if (hash_equals($expectedSignature, $signature)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Process checkout.session.completed event
     */
    public static function handleSessionCompleted(array $session): array
    {
        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            $sessionId = $session['id'];
            $metadata = $session['metadata'] ?? [];
            $reservationId = $metadata['reservation_id'] ?? '';
            $customerEmail = $session['customer_details']['email'] ?? $metadata['customer_email'] ?? '';
            $customerName = $session['customer_details']['name'] ?? $metadata['customer_name'] ?? 'MastroTickets Guest';
            $amountTotal = ((float)($session['amount_total'] ?? 0)) / 100;
            $currency = strtoupper($session['currency'] ?? 'AED');
            $paymentIntentId = $session['payment_intent'] ?? $sessionId;

            // Check if order already processed for this session
            $checkStmt = $db->prepare('SELECT id, order_number FROM orders WHERE stripe_session_id = :sid');
            $checkStmt->execute(['sid' => $sessionId]);
            $existingOrder = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingOrder) {
                $db->commit();
                return ['orderId' => $existingOrder['id'], 'orderNumber' => $existingOrder['order_number'], 'status' => 'already_processed'];
            }

            $orderId = 'ord_' . bin2hex(random_bytes(10));
            $orderNumber = TicketNumberGenerator::generateOrderNumber();

            // Fetch reservation items
            $resItemsStmt = $db->prepare('
                SELECT ri.*, tt.name as ticket_name, tt.category, tt.race_day, tt.section, e.name as event_name, e.circuit
                FROM reservation_items ri
                JOIN ticket_types tt ON ri.ticket_type_id = tt.id
                JOIN events e ON tt.event_id = e.id
                WHERE ri.reservation_id = :rid
            ');
            $resItemsStmt->execute(['rid' => $reservationId]);
            $items = $resItemsStmt->fetchAll(PDO::FETCH_ASSOC);

            // Insert order
            $orderStmt = $db->prepare('
                INSERT INTO orders (id, order_number, customer_id, customer_name, customer_email, customer_phone, customer_country, billing_address, items_json, subtotal, service_fee, tax, discount, total, currency, status, payment_id, stripe_session_id, created_at, confirmed_at)
                VALUES (:id, :num, :cid, :cname, :cemail, :cphone, :ccountry, :billing, :items, :sub, :fee, :tax, :disc, :total, :cur, :status, :pid, :sid, NOW(), NOW())
            ');
            $orderStmt->execute([
                'id' => $orderId,
                'num' => $orderNumber,
                'cid' => 'cust_' . bin2hex(random_bytes(6)),
                'cname' => $customerName,
                'cemail' => $customerEmail,
                'cphone' => $session['customer_details']['phone'] ?? '',
                'ccountry' => $session['customer_details']['address']['country'] ?? 'AE',
                'billing' => json_encode($session['customer_details']['address'] ?? []),
                'items' => json_encode($items),
                'sub' => $amountTotal,
                'fee' => 0.00,
                'tax' => 0.00,
                'disc' => 0.00,
                'total' => $amountTotal,
                'cur' => $currency,
                'status' => 'confirmed',
                'pid' => $paymentIntentId,
                'sid' => $sessionId,
            ]);

            // Issue tickets
            $issuedTickets = [];
            $ticketStmt = $db->prepare('
                INSERT INTO issued_tickets (id, ticket_number, order_id, order_number, event_name, circuit, race_day, category, section, attendee_name, barcode, qr_code_value, delivery_status, status, issued_at)
                VALUES (:id, :tnum, :oid, :onum, :ename, :circuit, :rday, :cat, :sec, :aname, :barcode, :qr, :delstat, :stat, NOW())
            ');

            foreach ($items as $item) {
                $qty = (int)$item['quantity'];
                for ($k = 0; $k < $qty; $k++) {
                    $ticketId = 'tkt_' . bin2hex(random_bytes(8));
                    $ticketNum = TicketNumberGenerator::generate('ABU26');
                    $barcode = 'BAR' . strtoupper(bin2hex(random_bytes(6)));
                    $qrVal = "https://mastrotickets.co/verify?ticket={$ticketNum}";

                    $ticketStmt->execute([
                        'id' => $ticketId,
                        'tnum' => $ticketNum,
                        'oid' => $orderId,
                        'onum' => $orderNumber,
                        'ename' => $item['event_name'],
                        'circuit' => $item['circuit'],
                        'rday' => $item['race_day'],
                        'cat' => $item['category'],
                        'sec' => $item['section'],
                        'aname' => $customerName,
                        'barcode' => $barcode,
                        'qr' => $qrVal,
                        'delstat' => 'issued',
                        'stat' => 'issued',
                    ]);

                    $issuedTickets[] = [
                        'ticketNumber' => $ticketNum,
                        'ticketName' => $item['ticket_name'],
                        'category' => $item['category'],
                        'section' => $item['section'],
                    ];
                }
            }

            // Update reservation status to confirmed
            if (!empty($reservationId)) {
                $upRes = $db->prepare("UPDATE reservations SET status = 'confirmed' WHERE id = :id");
                $upRes->execute(['id' => $reservationId]);
            }

            // Queue Order Confirmation & Ticket Delivery Email
            EmailService::queue(
                $customerEmail,
                $customerName,
                'ticket_delivery',
                "Your MastroTickets Booking is Confirmed - {$orderNumber}",
                [
                    'orderNumber' => $orderNumber,
                    'customerName' => $customerName,
                    'total' => "{$currency} " . number_format($amountTotal, 2),
                    'tickets' => $issuedTickets,
                ],
                $orderId
            );

            $db->commit();

            return [
                'orderId' => $orderId,
                'orderNumber' => $orderNumber,
                'customerEmail' => $customerEmail,
                'ticketsIssued' => count($issuedTickets),
            ];
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }
}
