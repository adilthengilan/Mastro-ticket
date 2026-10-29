<?php
declare(strict_types=1);

namespace Mastrotickets\Controllers;

use Mastrotickets\Config\Database;
use Mastrotickets\Http\Request;
use Mastrotickets\Http\Response;
use PDO;

class OrderController
{
    /**
     * GET /api/v1/orders/{id}
     */
    public function show(Request $request, string $id): void
    {
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM orders WHERE id = :id OR order_number = :num LIMIT 1');
        $stmt->execute(['id' => $id, 'num' => $id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            Response::notFound("Order '{$id}' not found.");
        }

        // Fetch issued tickets
        $ticketStmt = $db->prepare('SELECT * FROM issued_tickets WHERE order_id = :oid ORDER BY id ASC');
        $ticketStmt->execute(['oid' => $order['id']]);
        $tickets = $ticketStmt->fetchAll(PDO::FETCH_ASSOC);

        $formattedTickets = array_map(function ($t) {
            return [
                'id' => $t['id'],
                'ticketNumber' => $t['ticket_number'],
                'orderId' => $t['order_id'],
                'orderNumber' => $t['order_number'],
                'eventName' => $t['event_name'],
                'circuit' => $t['circuit'],
                'raceDay' => $t['race_day'],
                'category' => $t['category'],
                'section' => $t['section'],
                'row' => $t['row_num'],
                'seat' => $t['seat_num'],
                'attendeeName' => $t['attendee_name'],
                'barcode' => $t['barcode'],
                'qrCodeValue' => $t['qr_code_value'],
                'deliveryStatus' => $t['delivery_status'],
                'status' => $t['status'],
                'issuedAt' => $t['issued_at'],
                'downloadUrl' => $t['download_url'],
            ];
        }, $tickets);

        $result = [
            'id' => $order['id'],
            'orderNumber' => $order['order_number'],
            'customerId' => $order['customer_id'],
            'customerName' => $order['customer_name'],
            'customerEmail' => $order['customer_email'],
            'customerPhone' => $order['customer_phone'],
            'customerCountry' => $order['customer_country'],
            'billingAddress' => json_decode($order['billing_address'] ?? '{}', true),
            'items' => json_decode($order['items_json'] ?? '[]', true),
            'subtotal' => (float)$order['subtotal'],
            'serviceFee' => (float)$order['service_fee'],
            'tax' => (float)$order['tax'],
            'discount' => (float)$order['discount'],
            'discountCode' => $order['discount_code'],
            'total' => (float)$order['total'],
            'currency' => $order['currency'],
            'status' => $order['status'],
            'paymentId' => $order['payment_id'],
            'stripeSessionId' => $order['stripe_session_id'],
            'createdAt' => $order['created_at'],
            'confirmedAt' => $order['confirmed_at'],
            'tickets' => $formattedTickets,
        ];

        Response::success($result);
    }

    /**
     * GET /api/v1/orders/session/{sessionId}
     */
    public function bySession(Request $request, string $sessionId): void
    {
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT id FROM orders WHERE stripe_session_id = :sid LIMIT 1');
        $stmt->execute(['sid' => $sessionId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            Response::notFound("Order with Stripe session '{$sessionId}' not found or pending webhook.");
        }

        $this->show($request, $order['id']);
    }
}
