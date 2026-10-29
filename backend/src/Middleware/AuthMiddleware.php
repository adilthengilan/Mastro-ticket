<?php
declare(strict_types=1);

namespace Mastrotickets\Middleware;

use Mastrotickets\Config\Database;
use Mastrotickets\Config\Env;
use Mastrotickets\Http\Request;
use Mastrotickets\Http\Response;
use PDO;

class AuthMiddleware
{
    public static function authenticate(Request $request): array
    {
        $token = $request->getBearerToken();

        if (!$token) {
            Response::unauthorized('Authentication token is required.');
        }

        // 1. Direct admin API key check for server-to-server or root emergency access
        $adminSecret = Env::get('ADMIN_API_KEY');
        if (!empty($adminSecret) && hash_equals($adminSecret, $token)) {
            return [
                'id' => 'root-admin',
                'email' => 'admin@mastrotickets.co',
                'name' => 'System Administrator',
                'role' => 'admin',
                'is_admin' => true,
            ];
        }

        // 2. JWT validation
        $payload = self::verifyJwt($token);
        if (!$payload) {
            Response::unauthorized('Invalid or expired authentication token.');
        }

        // 3. Optional DB verification if user id exists
        if (isset($payload['sub'])) {
            try {
                $db = Database::getConnection();
                $stmt = $db->prepare('SELECT id, email, name, role, is_active FROM admin_users WHERE id = :id LIMIT 1');
                $stmt->execute(['id' => $payload['sub']]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user) {
                    if (!$user['is_active']) {
                        Response::forbidden('User account is deactivated.');
                    }
                    return [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'role' => $user['role'],
                        'is_admin' => $user['role'] === 'admin',
                    ];
                }
            } catch (\Throwable $e) {
                // If DB check fails, fallback to payload if valid
            }
        }

        return [
            'id' => $payload['sub'] ?? 'unknown',
            'email' => $payload['email'] ?? '',
            'name' => $payload['name'] ?? '',
            'role' => $payload['role'] ?? 'customer',
            'is_admin' => ($payload['role'] ?? '') === 'admin',
        ];
    }

    public static function requireAdmin(Request $request): array
    {
        $user = self::authenticate($request);
        if (!$user['is_admin']) {
            Response::forbidden('Access restricted to administrators only.');
        }
        return $user;
    }

    public static function generateJwt(array $payload, int $ttlSeconds = 86400): string
    {
        $secret = Env::get('JWT_SECRET', 'mastro-production-secret-token-change-in-env');
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        $now = time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + $ttlSeconds;

        $base64Header = self::base64UrlEncode($header);
        $base64Payload = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac('sha256', "{$base64Header}.{$base64Payload}", $secret, true);
        $base64Signature = self::base64UrlEncode($signature);

        return "{$base64Header}.{$base64Payload}.{$base64Signature}";
    }

    public static function verifyJwt(string $token): ?array
    {
        $secret = Env::get('JWT_SECRET', 'mastro-production-secret-token-change-in-env');
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        [$base64Header, $base64Payload, $base64Signature] = $parts;

        $signature = self::base64UrlDecode($base64Signature);
        $expectedSignature = hash_hmac('sha256', "{$base64Header}.{$base64Payload}", $secret, true);

        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($base64Payload), true);
        if (!is_array($payload)) {
            return null;
        }

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null; // Expired
        }

        return $payload;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
