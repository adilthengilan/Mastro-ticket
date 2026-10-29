<?php
declare(strict_types=1);

namespace Mastrotickets\Controllers;

use Mastrotickets\Config\Database;
use Mastrotickets\Http\Request;
use Mastrotickets\Http\Response;
use PDO;

class TicketController
{
    public function index(Request $request): void
    {
        $db = Database::getConnection();
        $eventId = $request->getQuery('eventId');
        $category = $request->getQuery('category');
        $raceDay = $request->getQuery('raceDay');

        $query = 'SELECT * FROM ticket_types WHERE 1=1';
        $params = [];

        if (!empty($eventId)) {
            $query .= ' AND event_id = :eid';
            $params['eid'] = $eventId;
        }
        if (!empty($category)) {
            $query .= ' AND category = :cat';
            $params['cat'] = $category;
        }
        if (!empty($raceDay)) {
            $query .= ' AND race_day = :rday';
            $params['rday'] = $raceDay;
        }

        $query .= ' ORDER BY price ASC';
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formatted = array_map(function ($t) {
            return [
                'id' => $t['id'],
                'eventId' => $t['event_id'],
                'category' => $t['category'],
                'raceDay' => $t['race_day'],
                'name' => $t['name'],
                'section' => $t['section'],
                'description' => $t['description'],
                'price' => (float)$t['price'],
                'originalPrice' => $t['original_price'] ? (float)$t['original_price'] : null,
                'fee' => (float)$t['fee'],
                'capacity' => (int)$t['capacity'],
                'availableQuantity' => (int)$t['available_quantity'],
                'features' => json_decode($t['features_json'] ?? '[]', true),
                'isAssignedSeating' => (bool)$t['is_assigned_seating'],
                'deliveryType' => $t['delivery_type'],
                'status' => $t['status'],
                'maxPerOrder' => (int)$t['max_per_order'],
                'imageUrl' => $t['image_url'],
            ];
        }, $tickets);

        Response::success($formatted);
    }

    /**
     * Public Ticket Verification with strict PII masking
     */
    public function verify(Request $request, string $ticketNumber): void
    {
        $db = Database::getConnection();
        $cleanNumber = strtoupper(trim($ticketNumber));

        $stmt = $db->prepare('
            SELECT ticket_number, event_name, circuit, race_day, category, section, row_num, seat_num, attendee_name, status, issued_at, void_reason
            FROM issued_tickets
            WHERE ticket_number = :tn
            LIMIT 1
        ');
        $stmt->execute(['tn' => $cleanNumber]);
        $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$ticket) {
            Response::notFound("Ticket '{$cleanNumber}' was not found in the MastroTickets database.");
        }

        // PII Masking: e.g. "John Doe" -> "J*** D***"
        $rawName = $ticket['attendee_name'] ?? 'Guest Attendee';
        $nameParts = explode(' ', trim($rawName));
        $maskedParts = array_map(function ($part) {
            if (mb_strlen($part) <= 1) return '*';
            return mb_substr($part, 0, 1) . str_repeat('*', mb_strlen($part) - 1);
        }, $nameParts);
        $maskedName = implode(' ', $maskedParts);

        $isValid = ($ticket['status'] === 'issued');

        Response::success([
            'isValid' => $isValid,
            'ticketNumber' => $ticket['ticket_number'],
            'eventName' => $ticket['event_name'],
            'circuit' => $ticket['circuit'],
            'raceDay' => $ticket['race_day'],
            'category' => $ticket['category'],
            'section' => $ticket['section'],
            'row' => $ticket['row_num'],
            'seat' => $ticket['seat_num'],
            'attendee' => $maskedName,
            'status' => $ticket['status'],
            'issuedAt' => $ticket['issued_at'],
            'voidReason' => $isValid ? null : ($ticket['void_reason'] ?? 'Revoked by administrator'),
        ], $isValid ? 'Valid ticket verified.' : 'Ticket has been voided or cancelled.');
    }
}
