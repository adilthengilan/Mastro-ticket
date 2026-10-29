<?php
declare(strict_types=1);

namespace Mastrotickets\Controllers;

use Mastrotickets\Http\Request;
use Mastrotickets\Http\Response;
use Mastrotickets\Services\StripeService;

class WebhookController
{
    /**
     * POST /api/v1/webhooks/stripe
     */
    public function handleStripe(Request $request): void
    {
        $payload = $request->getRawBody();
        $sigHeader = $request->getHeader('stripe-signature') ?? '';

        if (empty($sigHeader)) {
            Response::error('Missing Stripe-Signature header', 400);
        }

        if (!StripeService::verifyWebhookSignature($payload, $sigHeader)) {
            Response::error('Invalid signature verification', 400);
        }

        $event = json_decode($payload, true);
        if (!$event || empty($event['type'])) {
            Response::error('Invalid JSON event payload', 400);
        }

        $eventType = $event['type'];

        try {
            switch ($eventType) {
                case 'checkout.session.completed':
                    $session = $event['data']['object'];
                    StripeService::handleSessionCompleted($session);
                    break;

                case 'payment_intent.payment_failed':
                    // Optionally log failed payment
                    break;

                default:
                    // Unhandled events acknowledged safely
                    break;
            }

            Response::json(['received' => true, 'event' => $eventType], 200);
        } catch (\Throwable $e) {
            // Log error internally and reply 500 so Stripe retries if needed
            Response::json(['received' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
