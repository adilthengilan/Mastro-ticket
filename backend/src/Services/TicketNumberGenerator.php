<?php
declare(strict_types=1);

namespace Mastrotickets\Services;

use Mastrotickets\Config\Database;
use PDO;

class TicketNumberGenerator
{
    /**
     * Generate an authoritative unique MastroTickets ticket identifier
     * e.g., MST-ABU26-7K8M9Q2P
     */
    public static function generate(string $circuitCode = 'ABU26'): string
    {
        $db = Database::getConnection();
        $cleanCode = strtoupper(preg_replace('/[^A-Z0-9]/', '', substr($circuitCode, 0, 8)));
        if (empty($cleanCode)) {
            $cleanCode = 'ABU26';
        }

        $chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded confusing chars 0, 1, I, O
        $maxAttempts = 10;

        for ($i = 0; $i < $maxAttempts; $i++) {
            $randomStr = '';
            for ($j = 0; $j < 8; $j++) {
                $randomStr .= $chars[random_int(0, strlen($chars) - 1)];
            }
            $ticketNumber = "MST-{$cleanCode}-{$randomStr}";

            // Verify collision resistance against database
            $stmt = $db->prepare('SELECT COUNT(*) FROM issued_tickets WHERE ticket_number = :tn');
            $stmt->execute(['tn' => $ticketNumber]);
            if ((int)$stmt->fetchColumn() === 0) {
                return $ticketNumber;
            }
        }

        // Fallback with high-entropy timestamp if repeated collision
        return 'MST-' . $cleanCode . '-' . strtoupper(bin2hex(random_bytes(4)));
    }

    /**
     * Generate Order Number
     * e.g., ORD-2026-928192
     */
    public static function generateOrderNumber(): string
    {
        $year = date('Y');
        $random = random_int(100000, 999999);
        return "ORD-{$year}-{$random}";
    }
}
