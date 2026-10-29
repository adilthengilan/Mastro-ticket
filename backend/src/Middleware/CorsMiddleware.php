<?php
declare(strict_types=1);

namespace Mastrotickets\Middleware;

use Mastrotickets\Config\Env;

class CorsMiddleware
{
    public static function handle(): void
    {
        $allowedOriginsStr = Env::get('CORS_ALLOWED_ORIGINS', 'https://mastrotickets.co,http://localhost:3000,http://localhost:5173');
        $allowedOrigins = array_map('trim', explode(',', $allowedOriginsStr));
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (!empty($origin) && (in_array($origin, $allowedOrigins, true) || Env::get('APP_ENV') === 'development')) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
        } elseif (empty($origin)) {
            // Non-browser request or same-origin
            header('Access-Control-Allow-Origin: *');
        } else {
            // Not in allowed list
            header("Access-Control-Allow-Origin: {$allowedOrigins[0]}");
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Idempotency-Key');
        header('Access-Control-Max-Age: 86400');

        // Security headers
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
