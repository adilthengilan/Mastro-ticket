<?php
declare(strict_types=1);

namespace Mastrotickets\Controllers;

use Mastrotickets\Config\Database;
use Mastrotickets\Http\Request;
use Mastrotickets\Http\Response;
use PDO;

/**
 * Public Privacy-Safe Live Purchase Feed Controller
 * Returns only anonymized, verified completed/confirmed purchases — never exposes PII or order IDs.
 */
class PurchaseFeedController
{
    /**
     * GET /api/v1/public/recent-purchases
     */
    public function recent(Request $request): void
    {
        $db = Database::getConnection();

        $stmt = $db->prepare('
            SELECT o.id, o.customer_name, o.confirmed_at, o.created_at,
                   (SELECT oi.ticket_name FROM order_items oi WHERE oi.order_id = o.id LIMIT 1) AS ticket_name,
                   (SELECT oi.event_name FROM order_items oi WHERE oi.order_id = o.id LIMIT 1) AS event_name
            FROM orders o
            WHERE o.status IN ("paid", "confirmed")
            ORDER BY COALESCE(o.confirmed_at, o.created_at) DESC
            LIMIT 20
        ');
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $feed = [];
        foreach ($rows as $idx => $row) {
            $anonymizedName = self::anonymizeName((string)($row['customer_name'] ?? 'Guest'));
            $ticketLabel = !empty($row['ticket_name'])
                ? (string)$row['ticket_name']
                : (!empty($row['event_name']) ? (string)$row['event_name'] . ' tickets' : 'F1 Grand Prix tickets');

            $feed[] = [
                'id' => 'feed_' . hash('sha256', $row['id'] . '|' . $idx),
                'anonymizedName' => $anonymizedName,
                'itemLabel' => $ticketLabel,
                'purchasedAt' => $row['confirmed_at'] ?? $row['created_at'],
                'isDemo' => false,
            ];
        }

        Response::success($feed, 'Recent completed purchases retrieved');
    }

    private static function anonymizeName(string $fullName): string
    {
        $clean = trim(preg_replace('/\s+/', ' ', $fullName) ?? '');
        if ($clean === '') {
            return 'F1 Fan';
        }
        $parts = explode(' ', $clean);
        $first = mb_substr($parts[0], 0, 18);
        if (count($parts) > 1) {
            $lastInitial = mb_strtoupper(mb_substr($parts[count($parts) - 1], 0, 1));
            return "{$first} {$lastInitial}.";
        }
        return $first;
    }
}
