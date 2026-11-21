<?php
declare(strict_types=1);

namespace Mastrotickets\Controllers;

use Mastrotickets\Config\Database;
use Mastrotickets\Config\Env;
use Mastrotickets\Http\Request;
use Mastrotickets\Http\Response;
use Mastrotickets\Middleware\AuthMiddleware;
use PDO;

/**
 * Customer Authentication & Secure Guest Order Linking Controller
 * Supports Email/Password and Google OAuth ID-token sign-in, plus verified guest-order claiming.
 */
class AuthController
{
    /**
     * POST /api/v1/auth/register
     */
    public function register(Request $request): void
    {
        $body = $request->getBody() ?? [];
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? '');
        $displayName = trim((string)($body['displayName'] ?? ''));
        $phone = trim((string)($body['phone'] ?? ''));
        $country = trim((string)($body['country'] ?? 'Hungary'));

        $errors = [];
        if (empty($displayName) || strlen($displayName) < 2) {
            $errors['displayName'] = 'Full name must be at least 2 characters.';
        }
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Please enter a valid email address.';
        }
        if (strlen($password) < 8) {
            $errors['password'] = 'Password must be at least 8 characters.';
        }
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        $db = Database::getConnection();
        $check = $db->prepare('SELECT id FROM customers WHERE LOWER(email) = :email LIMIT 1');
        $check->execute(['email' => $email]);
        if ($check->fetch()) {
            Response::error('An account with this email already exists. Please sign in instead.', 409);
        }

        $userId = 'usr_' . bin2hex(random_bytes(10));
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $db->prepare('
            INSERT INTO customers (id, email, email_verified, password_hash, display_name, phone, country, auth_provider, created_at)
            VALUES (:id, :email, 0, :hash, :name, :phone, :country, "password", NOW())
        ');
        $stmt->execute([
            'id' => $userId,
            'email' => $email,
            'hash' => $passwordHash,
            'name' => $displayName,
            'phone' => $phone,
            'country' => $country,
        ]);

        $token = AuthMiddleware::generateJwt([
            'sub' => $userId,
            'email' => $email,
            'name' => $displayName,
            'role' => 'customer',
            'email_verified' => false,
        ], 86400 * 7);

        Response::success([
            'token' => $token,
            'user' => [
                'uid' => $userId,
                'email' => $email,
                'displayName' => $displayName,
                'phone' => $phone,
                'country' => $country,
                'role' => 'customer',
                'emailVerified' => false,
                'authProvider' => 'password',
            ],
            'claimedOrdersCount' => 0,
        ], 'Account created. Verify your email to link any previous guest bookings.', 201);
    }

    /**
     * POST /api/v1/auth/login
     */
    public function login(Request $request): void
    {
        $body = $request->getBody() ?? [];
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $password = (string)($body['password'] ?? '');

        if (empty($email) || empty($password)) {
            Response::validationError(['credentials' => 'Email and password are required.']);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM customers WHERE LOWER(email) = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || empty($user['password_hash']) || !password_verify($password, $user['password_hash'])) {
            Response::unauthorized('Invalid email or password.');
        }

        $emailVerified = (bool)$user['email_verified'];
        $claimedCount = 0;
        if ($emailVerified) {
            $claimedCount = $this->claimEligibleOrdersInternal($db, $user['id'], $user['email']);
        }

        $token = AuthMiddleware::generateJwt([
            'sub' => $user['id'],
            'email' => $user['email'],
            'name' => $user['display_name'],
            'role' => 'customer',
            'email_verified' => $emailVerified,
        ], 86400 * 7);

        Response::success([
            'token' => $token,
            'user' => [
                'uid' => $user['id'],
                'email' => $user['email'],
                'displayName' => $user['display_name'],
                'phone' => $user['phone'] ?? '',
                'country' => $user['country'] ?? 'Hungary',
                'role' => 'customer',
                'emailVerified' => $emailVerified,
                'authProvider' => $user['auth_provider'] ?? 'password',
            ],
            'claimedOrdersCount' => $claimedCount,
        ], 'Signed in successfully.');
    }

    /**
     * POST /api/v1/auth/google
     * Verifies Google ID token server-side and automatically claims eligible guest orders.
     */
    public function googleSignIn(Request $request): void
    {
        $body = $request->getBody() ?? [];
        $idToken = trim((string)($body['idToken'] ?? ''));

        if (empty($idToken)) {
            Response::validationError(['idToken' => 'Google ID token is required.']);
        }

        $ch = curl_init('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
        ]);
        $raw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$raw) {
            Response::unauthorized('Google token verification failed.');
        }

        $googleData = json_decode($raw, true);
        $expectedClientId = Env::get('GOOGLE_CLIENT_ID', '');
        if (!empty($expectedClientId) && ($googleData['aud'] ?? '') !== $expectedClientId) {
            Response::unauthorized('Google token audience mismatch.');
        }

        $email = strtolower(trim((string)($googleData['email'] ?? '')));
        $emailVerified = ($googleData['email_verified'] ?? 'false') === 'true' || $googleData['email_verified'] === true;
        $googleSub = (string)($googleData['sub'] ?? '');
        $displayName = trim((string)($googleData['name'] ?? explode('@', $email)[0]));

        if (empty($email) || !$emailVerified) {
            Response::unauthorized('Google account must have a verified email address.');
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM customers WHERE LOWER(email) = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $userId = 'usr_' . bin2hex(random_bytes(10));
            $insert = $db->prepare('
                INSERT INTO customers (id, email, email_verified, google_sub, display_name, country, auth_provider, created_at)
                VALUES (:id, :email, 1, :sub, :name, "Hungary", "google", NOW())
            ');
            $insert->execute([
                'id' => $userId,
                'email' => $email,
                'sub' => $googleSub,
                'name' => $displayName,
            ]);
            $user = [
                'id' => $userId,
                'email' => $email,
                'display_name' => $displayName,
                'phone' => '',
                'country' => 'Hungary',
                'auth_provider' => 'google',
            ];
        } else {
            $up = $db->prepare('UPDATE customers SET email_verified = 1, google_sub = COALESCE(google_sub, :sub) WHERE id = :id');
            $up->execute(['sub' => $googleSub, 'id' => $user['id']]);
        }

        $claimedCount = $this->claimEligibleOrdersInternal($db, $user['id'], $email);

        $token = AuthMiddleware::generateJwt([
            'sub' => $user['id'],
            'email' => $email,
            'name' => $user['display_name'],
            'role' => 'customer',
            'email_verified' => true,
        ], 86400 * 7);

        Response::success([
            'token' => $token,
            'user' => [
                'uid' => $user['id'],
                'email' => $email,
                'displayName' => $user['display_name'],
                'phone' => $user['phone'] ?? '',
                'country' => $user['country'] ?? 'Hungary',
                'role' => 'customer',
                'emailVerified' => true,
                'authProvider' => 'google',
            ],
            'claimedOrdersCount' => $claimedCount,
        ], 'Signed in with Google successfully.');
    }

    /**
     * POST /api/v1/auth/claim-guest-orders
     * Secure server-side claiming of guest orders for an authenticated, email-verified user.
     */
    public function claimGuestOrders(Request $request): void
    {
        $authUser = AuthMiddleware::authenticate($request);
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT id, email, email_verified FROM customers WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $authUser['id']]);
        $customer = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$customer) {
            Response::notFound('Customer account not found.');
        }

        if (!(bool)$customer['email_verified']) {
            Response::forbidden('Your email address must be verified before linking previous guest orders.');
        }

        $claimedCount = $this->claimEligibleOrdersInternal($db, $customer['id'], $customer['email']);

        Response::success([
            'claimedOrdersCount' => $claimedCount,
        ], $claimedCount > 0
            ? "Linked {$claimedCount} previous guest order(s) to your account."
            : 'No eligible unlinked guest orders were found for your verified email.');
    }

    /**
     * GET /api/v1/orders/mine
     * Returns all orders belonging to the authenticated customer (including claimed guest orders).
     */
    public function myOrders(Request $request): void
    {
        $authUser = AuthMiddleware::authenticate($request);
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM orders WHERE customer_id = :uid ORDER BY created_at DESC LIMIT 100');
        $stmt->execute(['uid' => $authUser['id']]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($orders);
    }

    private function claimEligibleOrdersInternal(PDO $db, string $userId, string $verifiedEmail): int
    {
        $db->beginTransaction();
        try {
            $findStmt = $db->prepare('
                SELECT id, order_number
                FROM orders
                WHERE customer_id = "guest"
                  AND LOWER(customer_email) = LOWER(:email)
                  AND status IN ("paid", "confirmed", "partially_refunded", "refunded")
                FOR UPDATE
            ');
            $findStmt->execute(['email' => $verifiedEmail]);
            $eligible = $findStmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($eligible)) {
                $db->commit();
                return 0;
            }

            $updateStmt = $db->prepare('
                UPDATE orders
                SET customer_id = :uid, is_guest = 0, claimed_at = NOW()
                WHERE id = :oid AND customer_id = "guest"
            ');

            $claimedCount = 0;
            foreach ($eligible as $ord) {
                $updateStmt->execute(['uid' => $userId, 'oid' => $ord['id']]);
                $claimedCount += $updateStmt->rowCount();
            }

            if ($claimedCount > 0) {
                $audit = $db->prepare('
                    INSERT INTO audit_logs (id, actor_id, actor_email, actor_role, action, target_record, timestamp, change_summary)
                    VALUES (:id, :uid, :email, "customer", "GUEST_ORDERS_CLAIMED", :target, NOW(), :summary)
                ');
                $audit->execute([
                    'id' => 'aud_' . bin2hex(random_bytes(8)),
                    'uid' => $userId,
                    'email' => $verifiedEmail,
                    'target' => $userId,
                    'summary' => "Securely linked {$claimedCount} verified guest order(s) to customer account.",
                ]);
            }

            $db->commit();
            return $claimedCount;
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }
}
