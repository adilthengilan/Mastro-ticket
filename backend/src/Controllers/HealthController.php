<?php
declare(strict_types=1);

namespace Mastrotickets\Controllers;

use Mastrotickets\Config\Database;
use Mastrotickets\Config\Env;
use Mastrotickets\Http\Request;
use Mastrotickets\Http\Response;

class HealthController
{
    public function check(Request $request): void
    {
        $dbStatus = 'disconnected';
        $dbError = null;

        try {
            $db = Database::getConnection();
            $db->query('SELECT 1');
            $dbStatus = 'connected';
        } catch (\Throwable $e) {
            $dbError = Env::get('APP_ENV') === 'development' ? $e->getMessage() : 'Database unreachable';
        }

        Response::json([
            'status' => $dbStatus === 'connected' ? 'healthy' : 'degraded',
            'service' => 'Mastrotickets PHP REST API',
            'version' => '1.0.0',
            'environment' => Env::get('APP_ENV', 'production'),
            'timestamp' => date('c'),
            'checks' => [
                'database' => $dbStatus,
                'currency' => 'AED',
                'php_version' => PHP_VERSION,
            ],
            'notes' => $dbError ? ['db' => $dbError] : null,
        ], $dbStatus === 'connected' ? 200 : 503);
    }
}
