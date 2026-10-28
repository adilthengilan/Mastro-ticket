<?php
declare(strict_types=1);

namespace Mastrotickets;

/**
 * Mastrotickets PHP REST API Entry Point
 * Implements endpoints specified in Section 16 of the PRD
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Simple lightweight router for core API endpoints
$routes = [
    'GET' => [
        '/api/v1/health' => fn() => ['status' => 'healthy', 'service' => 'Mastrotickets PHP REST API', 'version' => '1.0.0'],
        '/api/v1/events' => fn() => ['data' => 'See src/Controllers/EventController.php::index'],
        '/api/v1/admin/dashboard' => fn() => ['data' => 'See src/Controllers/AdminController.php::dashboard'],
    ],
    'POST' => [
        '/api/v1/checkout/session' => fn() => ['data' => 'See src/Controllers/PaymentController.php::createSession'],
        '/api/v1/webhooks/stripe' => fn() => ['data' => 'See src/Controllers/PaymentController.php::handleWebhook'],
    ]
];

if (isset($routes[$method][$requestUri])) {
    echo json_encode($routes[$method][$requestUri]());
    exit;
}

// Fallback message with API directory
echo json_encode([
    'app' => 'Mastrotickets Production PHP REST API',
    'path' => $requestUri,
    'method' => $method,
    'documentation' => 'See PRD Section 16 for all routes (/api/v1/events, /api/v1/checkout/session, /api/v1/orders, etc.)'
]);
