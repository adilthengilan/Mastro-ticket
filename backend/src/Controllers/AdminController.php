<?php
declare(strict_types=1);

namespace Mastrotickets\Controllers;

use Mastrotickets\Config\Database;
use Mastrotickets\Http\Request;
use Mastrotickets\Http\Response;
use Mastrotickets\Middleware\AuthMiddleware;
use Mastrotickets\Services\EmailService;
use PDO;

class AdminController
{
    /**
     * POST /api/v1/admin/login
     */
    public function login(Request $request): void
    {
        $body = $request->getBody() ?? [];
        $email = strtolower(trim($body['email'] ?? ''));
        $password = (string)($body['password'] ?? '');

        if (empty($email) || empty($password)) {
            Response::validationError([
                'email' => empty($email) ? 'Email is required' : null,
                'password' => empty($password) ? 'Password is required' : null,
            ]);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, email, password_hash, name, role, is_active FROM admin_users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::unauthorized('Invalid email or password.');
        }

        if (!$user['is_active']) {
            Response::forbidden('Your administrative account has been deactivated.');
        }

        // Generate JWT
        $token = AuthMiddleware::generateJwt([
            'sub' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'],
        ], 86400 * 7); // 7 days

        // Record audit log
        $auditStmt = $db->prepare('
            INSERT INTO audit_logs (id, actor_id, actor_email, actor_role, action, target_record, timestamp, change_summary)
            VALUES (:id, :aid, :aemail, :arole, "ADMIN_LOGIN", "admin_users", NOW(), "Admin user logged in")
        ');
        $auditStmt->execute([
            'id' => 'aud_' . bin2hex(random_bytes(6)),
            'aid' => $user['id'],
            'aemail' => $user['email'],
            'arole' => $user['role'],
        ]);

        Response::success([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role'],
            ]
        ], 'Logged in successfully');
    }

    /**
     * GET /api/v1/admin/dashboard
     */
    public function dashboard(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $db = Database::getConnection();

        // Total Revenue in AED
        $revStmt = $db->query("SELECT COALESCE(SUM(total), 0) as total_rev FROM orders WHERE status IN ('paid', 'confirmed')");
        $totalRevenue = (float)$revStmt->fetchColumn();

        // Total Orders
        $orderCountStmt = $db->query("SELECT COUNT(*) FROM orders WHERE status IN ('paid', 'confirmed')");
        $totalOrders = (int)$orderCountStmt->fetchColumn();

        // Tickets Sold
        $ticketCountStmt = $db->query("SELECT COUNT(*) FROM issued_tickets WHERE status = 'issued'");
        $ticketsSold = (int)$ticketCountStmt->fetchColumn();

        // Active Holds
        $holdsStmt = $db->query("SELECT COUNT(*) FROM reservations WHERE status = 'active' AND expires_at > NOW()");
        $activeHolds = (int)$holdsStmt->fetchColumn();

        // Inventory status grouped by section
        $invStmt = $db->query('
            SELECT section, SUM(available_quantity) as total_available, SUM(capacity) as total_capacity
            FROM ticket_types
            GROUP BY section
        ');
        $inventoryBySection = $invStmt->fetchAll(PDO::FETCH_ASSOC);

        // Recent Orders
        $recentStmt = $db->query('
            SELECT id, order_number, customer_name, customer_email, total, currency, status, created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 10
        ');
        $recentOrders = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success([
            'totalRevenue' => $totalRevenue,
            'currency' => 'AED',
            'totalOrders' => $totalOrders,
            'ticketsSold' => $ticketsSold,
            'activeHolds' => $activeHolds,
            'inventoryBySection' => $inventoryBySection,
            'recentOrders' => $recentOrders,
        ]);
    }

    /**
     * GET /api/v1/admin/orders
     */
    public function orders(Request $request): void
    {
        AuthMiddleware::requireAdmin($request);
        $db = Database::getConnection();

        $page = max(1, (int)$request->getQuery('page', 1));
        $limit = min(50, max(1, (int)$request->getQuery('limit', 20)));
        $offset = ($page - 1) * $limit;
        $search = trim((string)$request->getQuery('search', ''));

        $query = 'SELECT * FROM orders';
        $countQuery = 'SELECT COUNT(*) FROM orders';
        $params = [];

        if (!empty($search)) {
            $clause = ' WHERE order_number LIKE :s OR customer_email LIKE :s OR customer_name LIKE :s';
            $query .= $clause;
            $countQuery .= $clause;
            $params['s'] = "%{$search}%";
        }

        $query .= ' ORDER BY created_at DESC LIMIT ' . $limit . ' OFFSET ' . $offset;

        $countStmt = $db->prepare($countQuery);
        $countStmt->execute($params);
        $totalCount = (int)$countStmt->fetchColumn();

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($orders, 'Orders retrieved', 200, [
            'page' => $page,
            'limit' => $limit,
            'total' => $totalCount,
            'totalPages' => ceil($totalCount / $limit),
        ]);
    }

    /**
     * POST /api/v1/admin/tickets/void
     */
    public function voidTicket(Request $request): void
    {
        $admin = AuthMiddleware::requireAdmin($request);
        $ticketNumber = trim((string)$request->get('ticketNumber', ''));
        $reason = trim((string)$request->get('reason', 'Administrative void'));

        if (empty($ticketNumber)) {
            Response::validationError(['ticketNumber' => 'Ticket number is required']);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE issued_tickets SET status = 'void', void_reason = :reason WHERE ticket_number = :tn");
        $stmt->execute(['reason' => $reason, 'tn' => $ticketNumber]);

        if ($stmt->rowCount() === 0) {
            Response::notFound("Ticket '{$ticketNumber}' not found.");
        }

        // Audit log
        $audit = $db->prepare('
            INSERT INTO audit_logs (id, actor_id, actor_email, actor_role, action, target_record, timestamp, change_summary)
            VALUES (:id, :aid, :aemail, :arole, "TICKET_VOIDED", :target, NOW(), :summary)
        ');
        $audit->execute([
            'id' => 'aud_' . bin2hex(random_bytes(6)),
            'aid' => $admin['id'],
            'aemail' => $admin['email'],
            'arole' => $admin['role'],
            'target' => $ticketNumber,
            'summary' => "Ticket voided. Reason: {$reason}",
        ]);

        Response::success(null, "Ticket {$ticketNumber} has been successfully voided.");
    }
}
