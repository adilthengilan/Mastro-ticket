<?php
declare(strict_types=1);

namespace Mastrotickets\Controllers;

use Mastrotickets\Config\Database;
use Mastrotickets\Http\Request;
use Mastrotickets\Http\Response;
use PDO;

class EventController
{
    public function index(Request $request): void
    {
        $db = Database::getConnection();
        $status = $request->getQuery('status', 'published');

        $stmt = $db->prepare('
            SELECT id, slug, name, official_title, circuit, location, country, country_code, flag,
                   dates, start_date, end_date, round, season, timezone, banner, description,
                   status, starting_price, featured, lap_distance, number_of_laps, race_distance
            FROM events
            WHERE status = :status OR :status = "all"
            ORDER BY featured DESC, start_date ASC
        ');
        $stmt->execute(['status' => $status]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format keys into camelCase matching frontend React models
        $formatted = array_map(function ($event) {
            return [
                'id' => $event['id'],
                'slug' => $event['slug'],
                'name' => $event['name'],
                'officialTitle' => $event['official_title'],
                'circuit' => $event['circuit'],
                'location' => $event['location'],
                'country' => $event['country'],
                'countryCode' => $event['country_code'],
                'flag' => $event['flag'],
                'dates' => $event['dates'],
                'startDate' => $event['start_date'],
                'endDate' => $event['end_date'],
                'round' => (int)$event['round'],
                'season' => (int)$event['season'],
                'timezone' => $event['timezone'],
                'banner' => $event['banner'],
                'description' => $event['description'],
                'status' => $event['status'],
                'startingPrice' => (float)$event['starting_price'],
                'featured' => (bool)$event['featured'],
                'lapDistance' => $event['lap_distance'],
                'numberOfLaps' => (int)$event['number_of_laps'],
                'raceDistance' => $event['race_distance'],
            ];
        }, $events);

        Response::success($formatted);
    }

    public function show(Request $request, string $id): void
    {
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM events WHERE id = :id OR slug = :slug LIMIT 1');
        $stmt->execute(['id' => $id, 'slug' => $id]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$event) {
            Response::notFound("Event '{$id}' not found.");
        }

        // Fetch ticket types for this event
        $ticketStmt = $db->prepare('SELECT * FROM ticket_types WHERE event_id = :eid ORDER BY price ASC');
        $ticketStmt->execute(['eid' => $event['id']]);
        $tickets = $ticketStmt->fetchAll(PDO::FETCH_ASSOC);

        $formattedTickets = array_map(function ($t) {
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

        $result = [
            'id' => $event['id'],
            'slug' => $event['slug'],
            'name' => $event['name'],
            'officialTitle' => $event['official_title'],
            'circuit' => $event['circuit'],
            'location' => $event['location'],
            'country' => $event['country'],
            'countryCode' => $event['country_code'],
            'flag' => $event['flag'],
            'dates' => $event['dates'],
            'startDate' => $event['start_date'],
            'endDate' => $event['end_date'],
            'round' => (int)$event['round'],
            'season' => (int)$event['season'],
            'timezone' => $event['timezone'],
            'banner' => $event['banner'],
            'description' => $event['description'],
            'status' => $event['status'],
            'startingPrice' => (float)$event['starting_price'],
            'featured' => (bool)$event['featured'],
            'tickets' => $formattedTickets,
        ];

        Response::success($result);
    }
}
