<?php
declare(strict_types=1);

namespace Mastrotickets;

require_once __DIR__ . '/../src/autoload.php';

use Mastrotickets\Config\Env;
use Mastrotickets\Controllers\AdminController;
use Mastrotickets\Controllers\CheckoutController;
use Mastrotickets\Controllers\EventController;
use Mastrotickets\Controllers\HealthController;
use Mastrotickets\Controllers\OrderController;
use Mastrotickets\Controllers\TicketController;
use Mastrotickets\Controllers\WebhookController;
use Mastrotickets\Http\Request;
use Mastrotickets\Http\Response;
use Mastrotickets\Middleware\CorsMiddleware;

// 1. Initialize Environment variables
Env::load(__DIR__ . '/../.env');

// 2. Global Exception Handling (Shield internal errors in production)
set_exception_handler(function (\Throwable $e) {
    $isDebug = Env::get('APP_DEBUG') === 'true';
    error_log("[MastroTickets Error] " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());

    Response::serverError(
        $isDebug ? $e->getMessage() : 'An unexpected error occurred while processing your request.'
    );
});

// 3. Process CORS & Preflight
CorsMiddleware::handle();

// 4. Request Dispatcher
$request = new Request();
$method = $request->getMethod();
$uri = $request->getUri();

// Normalize URI (remove trailing slash except root)
$cleanUri = rtrim($uri, '/');
if (empty($cleanUri)) {
    $cleanUri = '/';
}

// Router matching
try {
    // Health Check
    if ($method === 'GET' && ($cleanUri === '/api/v1/health' || $cleanUri === '/health')) {
        (new HealthController())->check($request);
    }

    // Events routes
    if ($method === 'GET' && $cleanUri === '/api/v1/events') {
        (new EventController())->index($request);
    }
    if ($method === 'GET' && preg_match('#^/api/v1/events/([a-zA-Z0-9\-_]+)$#', $cleanUri, $matches)) {
        (new EventController())->show($request, $matches[1]);
    }

    // Tickets routes
    if ($method === 'GET' && $cleanUri === '/api/v1/tickets') {
        (new TicketController())->index($request);
    }
    if ($method === 'GET' && preg_match('#^/api/v1/tickets/verify/([a-zA-Z0-9\-_]+)$#', $cleanUri, $matches)) {
        (new TicketController())->verify($request, $matches[1]);
    }

    // Checkout routes
    if ($method === 'POST' && $cleanUri === '/api/v1/checkout/session') {
        (new CheckoutController())->createSession($request);
    }
    if ($method === 'POST' && $cleanUri === '/api/v1/discounts/validate') {
        (new CheckoutController())->validateDiscount($request);
    }

    // Webhooks
    if ($method === 'POST' && $cleanUri === '/api/v1/webhooks/stripe') {
        (new WebhookController())->handleStripe($request);
    }

    // Orders routes
    if ($method === 'GET' && preg_match('#^/api/v1/orders/session/([a-zA-Z0-9\-_]+)$#', $cleanUri, $matches)) {
        (new OrderController())->bySession($request, $matches[1]);
    }
    if ($method === 'GET' && preg_match('#^/api/v1/orders/([a-zA-Z0-9\-_]+)$#', $cleanUri, $matches)) {
        (new OrderController())->show($request, $matches[1]);
    }

    // Admin routes
    if ($method === 'POST' && $cleanUri === '/api/v1/admin/login') {
        (new AdminController())->login($request);
    }
    if ($method === 'GET' && $cleanUri === '/api/v1/admin/dashboard') {
        (new AdminController())->dashboard($request);
    }
    if ($method === 'GET' && $cleanUri === '/api/v1/admin/orders') {
        (new AdminController())->orders($request);
    }
    if ($method === 'POST' && $cleanUri === '/api/v1/admin/tickets/void') {
        (new AdminController())->voidTicket($request);
    }

    // Catch-all 404
    Response::notFound("Endpoint {$method} {$cleanUri} does not exist on MastroTickets API.");
} catch (\Throwable $e) {
    Response::serverError($e->getMessage());
}
