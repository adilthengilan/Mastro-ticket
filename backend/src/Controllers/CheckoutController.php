<?php
declare(strict_types=1);

namespace Mastrotickets\Controllers;

use Mastrotickets\Config\Database;
use Mastrotickets\Http\Request;
use Mastrotickets\Http\Response;
use Mastrotickets\Services\ReservationService;
use Mastrotickets\Services\StripeService;
use PDO;
use Exception;

class CheckoutController
{
    /**
     * POST /api/v1/checkout/session
     */
    public function createSession(Request $request): void
    {
        $body = $request->getBody() ?? [];

        $eventId = $body['eventId'] ?? '';
        $items = $body['items'] ?? [];
        $customerEmail = trim($body['customerEmail'] ?? '');
        $customerName = trim($body['customerName'] ?? 'Guest Customer');
        $discountCode = trim($body['discountCode'] ?? '');

        if (empty($eventId)) {
            Response::validationError(['eventId' => 'Event ID is required']);
        }

        if (empty($items) || !is_array($items)) {
            Response::validationError(['items' => 'Cart items are required and must be an array']);
        }

        if (empty($customerEmail) || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
            Response::validationError(['customerEmail' => 'A valid customer email is required']);
        }

        try {
            // 1. Create atomic 10-minute hold reservation in DB
            $reservation = ReservationService::createReservation($eventId, $items, $customerEmail, 'AED');

            // 2. Validate discount if provided
            $discountAmount = 0.00;
            if (!empty($discountCode)) {
                $db = Database::getConnection();
                $discStmt = $db->prepare('SELECT * FROM discounts WHERE code = :code AND active = 1 LIMIT 1');
                $discStmt->execute(['code' => strtoupper($discountCode)]);
                $disc = $discStmt->fetch(PDO::FETCH_ASSOC);

                if ($disc && strtotime($disc['valid_until']) > time() && $reservation['total'] >= (float)$disc['min_spend']) {
                    if ($disc['discount_percent'] > 0) {
                        $discountAmount = round(($reservation['total'] * ((float)$disc['discount_percent'] / 100)), 2);
                    } elseif ($disc['discount_amount'] > 0) {
                        $discountAmount = (float)$disc['discount_amount'];
                    }
                }
            }

            $finalTotal = max(1.00, $reservation['total'] - $discountAmount);

            // 3. Create Stripe Checkout Session
            $stripeSession = StripeService::createCheckoutSession([
                'currency' => 'AED',
                'items' => $reservation['items'],
                'customerEmail' => $customerEmail,
                'customerName' => $customerName,
                'reservationId' => $reservation['reservationId'],
                'reservationReference' => $reservation['reservationReference'],
                'eventId' => $eventId,
                'total' => $finalTotal,
            ]);

            Response::success([
                'sessionId' => $stripeSession['sessionId'],
                'checkoutUrl' => $stripeSession['url'],
                'reservationId' => $reservation['reservationId'],
                'reservationReference' => $reservation['reservationReference'],
                'expiresAt' => $reservation['expiresAt'],
                'subtotal' => $reservation['total'],
                'discount' => $discountAmount,
                'total' => $finalTotal,
                'currency' => 'AED',
            ], 'Checkout session created successfully');
        } catch (\Throwable $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    /**
     * POST /api/v1/discounts/validate
     */
    public function validateDiscount(Request $request): void
    {
        $code = strtoupper(trim($request->get('code', '')));
        $subtotal = (float)$request->get('subtotal', 0);

        if (empty($code)) {
            Response::validationError(['code' => 'Discount code is required']);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM discounts WHERE code = :code AND active = 1 LIMIT 1');
        $stmt->execute(['code' => $code]);
        $discount = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$discount) {
            Response::error('Invalid or expired discount code', 404);
        }

        if (strtotime($discount['valid_until']) < time()) {
            Response::error('This promotion code has expired', 422);
        }

        if ($discount['max_usage'] > 0 && $discount['used_count'] >= $discount['max_usage']) {
            Response::error('This discount code has reached maximum redemptions', 422);
        }

        if ($subtotal < (float)$discount['min_spend']) {
            Response::error("Minimum order spend of AED {$discount['min_spend']} required for this code", 422);
        }

        $calcDiscount = 0.00;
        if ((float)$discount['discount_percent'] > 0) {
            $calcDiscount = round(($subtotal * ((float)$discount['discount_percent'] / 100)), 2);
        } else {
            $calcDiscount = (float)$discount['discount_amount'];
        }

        Response::success([
            'code' => $discount['code'],
            'discountPercent' => (float)$discount['discount_percent'],
            'discountAmount' => $calcDiscount,
            'subtotal' => $subtotal,
            'newTotal' => max(0, $subtotal - $calcDiscount),
            'currency' => 'AED',
        ], 'Discount code applied successfully');
    }
}
