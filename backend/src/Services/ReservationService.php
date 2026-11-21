<?php
declare(strict_types=1);

namespace Mastrotickets\Services;

use Mastrotickets\Config\Database;
use PDO;
use Exception;

class ReservationService
{
    public const ERR_INSUFFICIENT_INVENTORY = 409;
    public const ERR_VALIDATION = 422;

    /**
     * Normalize and consolidate requested items by ticketTypeId, sorted to prevent DB lock deadlocks
     */
    private static function normalizeItems(array $items): array
    {
        $consolidated = [];
        foreach ($items as $item) {
            $ticketTypeId = (string)($item['ticketTypeId'] ?? $item['id'] ?? '');
            $quantity = (int)($item['quantity'] ?? 0);

            if ($ticketTypeId === '' || $quantity <= 0) {
                throw new Exception("Invalid ticket selection or quantity for ticket ID {$ticketTypeId}", self::ERR_VALIDATION);
            }

            if (!isset($consolidated[$ticketTypeId])) {
                $consolidated[$ticketTypeId] = [
                    'ticketTypeId' => $ticketTypeId,
                    'quantity' => 0,
                    'seatDetails' => $item['seatDetails'] ?? null,
                ];
            }
            $consolidated[$ticketTypeId]['quantity'] += $quantity;
        }

        if (empty($consolidated)) {
            throw new Exception('At least one ticket item is required to create a reservation.', self::ERR_VALIDATION);
        }

        ksort($consolidated);
        return array_values($consolidated);
    }

    /**
     * Create an atomic 10-minute hold reservation for items in cart.
     * Supports optional idempotencyKey so retries/double-clicks never deduct inventory twice.
     */
    public static function createReservation(
        string $eventId,
        array $items,
        string $customerEmail = '',
        string $currency = 'USD',
        ?string $idempotencyKey = null
    ): array {
        $db = Database::getConnection();
        self::releaseExpiredReservations();

        $normalizedItems = self::normalizeItems($items);

        // Deterministic reference when idempotencyKey is provided
        $reservationRef = $idempotencyKey
            ? 'RES-IDEM-' . strtoupper(substr(hash('sha256', $idempotencyKey), 0, 14))
            : 'RES-' . strtoupper(bin2hex(random_bytes(4)));

        $db->beginTransaction();
        try {
            // Check idempotency inside transaction so duplicate concurrent calls return the same active hold
            if ($idempotencyKey) {
                $existingStmt = $db->prepare("SELECT * FROM reservations WHERE reservation_reference = :ref LIMIT 1 FOR UPDATE");
                $existingStmt->execute(['ref' => $reservationRef]);
                $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);

                if ($existing && $existing['status'] === 'active' && strtotime($existing['expires_at']) > time()) {
                    $existingItems = self::loadReservationItems($db, $existing['id']);
                    $db->commit();
                    return [
                        'reservationId' => $existing['id'],
                        'reservationReference' => $existing['reservation_reference'],
                        'expiresAt' => $existing['expires_at'],
                        'total' => (float)$existing['total'],
                        'currency' => $existing['currency'],
                        'items' => $existingItems,
                        'reused' => true,
                    ];
                }
                // If previous idempotent attempt expired/released, generate a fresh unique reference
                if ($existing) {
                    $reservationRef = 'RES-' . strtoupper(bin2hex(random_bytes(4)));
                }
            }

            $reservationId = 'res_' . bin2hex(random_bytes(10));
            $expiresAt = date('Y-m-d H:i:s', time() + (10 * 60)); // 10 minutes

            $totalAmount = 0.00;
            $validatedItems = [];

            foreach ($normalizedItems as $item) {
                $ticketTypeId = $item['ticketTypeId'];
                $quantity = $item['quantity'];

                // Lock ticket row for update in deterministic sorted order to prevent overselling & deadlocks
                $stmt = $db->prepare('SELECT id, event_id, name, price, fee, available_quantity, max_per_order, status FROM ticket_types WHERE id = :id FOR UPDATE');
                $stmt->execute(['id' => $ticketTypeId]);
                $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$ticket) {
                    throw new Exception("Ticket category {$ticketTypeId} not found.", self::ERR_VALIDATION);
                }

                $maxPerOrder = max(1, (int)($ticket['max_per_order'] ?? 8));
                if ($quantity > $maxPerOrder) {
                    throw new Exception(
                        "Maximum {$maxPerOrder} tickets allowed per order for {$ticket['name']}.",
                        self::ERR_VALIDATION
                    );
                }

                $available = (int)$ticket['available_quantity'];
                if ($ticket['status'] === 'sold_out' || $available < $quantity) {
                    throw new Exception(
                        "Insufficient ticket inventory for {$ticket['name']}. Available: {$available}, requested: {$quantity}.",
                        self::ERR_INSUFFICIENT_INVENTORY
                    );
                }

                $unitPrice = (float)$ticket['price'];
                $unitFee = (float)$ticket['fee'];
                $itemTotal = ($unitPrice + $unitFee) * $quantity;
                $totalAmount += $itemTotal;

                // Atomically decrement inventory
                $newStock = $available - $quantity;
                $newStatus = $newStock <= 0 ? 'sold_out' : ($newStock <= 10 ? 'low_inventory' : 'available');

                $updateStmt = $db->prepare('UPDATE ticket_types SET available_quantity = :qty, status = :status WHERE id = :id');
                $updateStmt->execute([
                    'qty' => $newStock,
                    'status' => $newStatus,
                    'id' => $ticketTypeId,
                ]);

                // Record inventory mutation ledger
                $ledgerStmt = $db->prepare('
                    INSERT INTO inventory_ledger (id, timestamp, type, ticket_type_id, ticket_name, quantity_delta, previous_stock, new_stock, reference_id, notes)
                    VALUES (:id, NOW(), :type, :ttid, :name, :delta, :prev, :new, :ref, :notes)
                ');
                $ledgerStmt->execute([
                    'id' => 'led_' . bin2hex(random_bytes(8)),
                    'type' => 'RESERVATION_CREATED',
                    'ttid' => $ticketTypeId,
                    'name' => $ticket['name'],
                    'delta' => -$quantity,
                    'prev' => $available,
                    'new' => $newStock,
                    'ref' => $reservationRef,
                    'notes' => "10-minute atomic hold ({$quantity} tickets) for " . ($customerEmail ?: 'guest'),
                ]);

                $validatedItems[] = [
                    'ticketTypeId' => $ticketTypeId,
                    'name' => $ticket['name'],
                    'quantity' => $quantity,
                    'unitPrice' => $unitPrice,
                    'fee' => $unitFee,
                    'totalPrice' => $itemTotal,
                    'availableAfterHold' => $newStock,
                    'seatDetails' => $item['seatDetails'] ?? null,
                ];
            }

            // Insert reservation
            $resStmt = $db->prepare('
                INSERT INTO reservations (id, reservation_reference, customer_email, event_id, total, currency, status, created_at, expires_at)
                VALUES (:id, :ref, :email, :eid, :total, :cur, :status, NOW(), :exp)
            ');
            $resStmt->execute([
                'id' => $reservationId,
                'ref' => $reservationRef,
                'email' => $customerEmail,
                'eid' => $eventId,
                'total' => $totalAmount,
                'cur' => $currency,
                'status' => 'active',
                'exp' => $expiresAt,
            ]);

            // Insert reservation items
            $itemStmt = $db->prepare('
                INSERT INTO reservation_items (id, reservation_id, ticket_type_id, quantity, unit_price, fee, total_price, seat_details)
                VALUES (:id, :rid, :ttid, :qty, :up, :fee, :tp, :sd)
            ');
            foreach ($validatedItems as $vItem) {
                $itemStmt->execute([
                    'id' => 'ri_' . bin2hex(random_bytes(8)),
                    'rid' => $reservationId,
                    'ttid' => $vItem['ticketTypeId'],
                    'qty' => $vItem['quantity'],
                    'up' => $vItem['unitPrice'],
                    'fee' => $vItem['fee'],
                    'tp' => $vItem['totalPrice'],
                    'sd' => $vItem['seatDetails'] ? json_encode($vItem['seatDetails']) : null,
                ]);
            }

            $db->commit();

            return [
                'reservationId' => $reservationId,
                'reservationReference' => $reservationRef,
                'expiresAt' => $expiresAt,
                'total' => $totalAmount,
                'currency' => $currency,
                'items' => $validatedItems,
                'reused' => false,
            ];
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Validate and reuse an existing active, unexpired reservation if its items/quantities match exactly.
     * Prevents double inventory deduction between category reservation and payment checkout.
     */
    public static function getValidActiveReservation(string $reservationId, array $items, string $customerEmail = ''): ?array
    {
        if (empty($reservationId)) {
            return null;
        }

        $db = Database::getConnection();
        self::releaseExpiredReservations();

        $normalizedRequested = self::normalizeItems($items);

        $db->beginTransaction();
        try {
            $stmt = $db->prepare("SELECT * FROM reservations WHERE id = :id LIMIT 1 FOR UPDATE");
            $stmt->execute(['id' => $reservationId]);
            $res = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$res || $res['status'] !== 'active' || strtotime($res['expires_at']) <= time()) {
                $db->commit();
                return null;
            }

            $existingItems = self::loadReservationItems($db, $reservationId);
            $existingMap = [];
            foreach ($existingItems as $ei) {
                $existingMap[$ei['ticketTypeId']] = ($existingMap[$ei['ticketTypeId']] ?? 0) + (int)$ei['quantity'];
            }

            $requestedMap = [];
            foreach ($normalizedRequested as $ri) {
                $requestedMap[$ri['ticketTypeId']] = ($requestedMap[$ri['ticketTypeId']] ?? 0) + (int)$ri['quantity'];
            }

            ksort($existingMap);
            ksort($requestedMap);

            if ($existingMap !== $requestedMap) {
                $db->commit();
                return null;
            }

            // Refresh customer email on hold if it was blank during pre-checkout
            if (!empty($customerEmail) && empty($res['customer_email'])) {
                $upd = $db->prepare('UPDATE reservations SET customer_email = :email WHERE id = :id');
                $upd->execute(['email' => $customerEmail, 'id' => $reservationId]);
            }

            $db->commit();

            return [
                'reservationId' => $res['id'],
                'reservationReference' => $res['reservation_reference'],
                'expiresAt' => $res['expires_at'],
                'total' => (float)$res['total'],
                'currency' => $res['currency'],
                'items' => $existingItems,
                'reused' => true,
            ];
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            return null;
        }
    }

    /**
     * Load formatted items for an existing reservation
     */
    private static function loadReservationItems(PDO $db, string $reservationId): array
    {
        $stmt = $db->prepare('
            SELECT ri.ticket_type_id, ri.quantity, ri.unit_price, ri.fee, ri.total_price, tt.name
            FROM reservation_items ri
            JOIN ticket_types tt ON ri.ticket_type_id = tt.id
            WHERE ri.reservation_id = :rid
        ');
        $stmt->execute(['rid' => $reservationId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(function ($row) {
            $unitPrice = (float)$row['unit_price'];
            $fee = (float)$row['fee'];
            $qty = (int)$row['quantity'];
            return [
                'ticketTypeId' => $row['ticket_type_id'],
                'name' => $row['name'],
                'quantity' => $qty,
                'unitPrice' => $unitPrice,
                'fee' => $fee,
                'totalPrice' => isset($row['total_price']) ? (float)$row['total_price'] : ($unitPrice + $fee) * $qty,
            ];
        }, $rows);
    }

    /**
     * Atomically and idempotently release a specific active reservation back into inventory.
     * Used on cancellation, quantity/category change, expiry, or payment failure.
     */
    public static function releaseReservation(string $reservationId, string $reason = 'released'): bool
    {
        if (empty($reservationId)) {
            return false;
        }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $resStmt = $db->prepare("SELECT id, reservation_reference, status FROM reservations WHERE id = :id LIMIT 1 FOR UPDATE");
            $resStmt->execute(['id' => $reservationId]);
            $res = $resStmt->fetch(PDO::FETCH_ASSOC);

            if (!$res || $res['status'] !== 'active') {
                $db->commit();
                return false;
            }

            $itemStmt = $db->prepare('SELECT ticket_type_id, quantity FROM reservation_items WHERE reservation_id = :rid ORDER BY ticket_type_id ASC');
            $itemStmt->execute(['rid' => $res['id']]);
            $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($items as $item) {
                $stockStmt = $db->prepare('SELECT available_quantity, name FROM ticket_types WHERE id = :id FOR UPDATE');
                $stockStmt->execute(['id' => $item['ticket_type_id']]);
                $ticket = $stockStmt->fetch(PDO::FETCH_ASSOC);

                if ($ticket) {
                    $prevStock = (int)$ticket['available_quantity'];
                    $restoredQty = (int)$item['quantity'];
                    $newStock = $prevStock + $restoredQty;
                    $newStatus = $newStock <= 0 ? 'sold_out' : ($newStock <= 10 ? 'low_inventory' : 'available');

                    $update = $db->prepare('UPDATE ticket_types SET available_quantity = :qty, status = :status WHERE id = :id');
                    $update->execute([
                        'qty' => $newStock,
                        'status' => $newStatus,
                        'id' => $item['ticket_type_id'],
                    ]);

                    $ledger = $db->prepare('
                        INSERT INTO inventory_ledger (id, timestamp, type, ticket_type_id, ticket_name, quantity_delta, previous_stock, new_stock, reference_id, notes)
                        VALUES (:id, NOW(), :type, :ttid, :name, :delta, :prev, :new, :ref, :notes)
                    ');
                    $ledger->execute([
                        'id' => 'led_' . bin2hex(random_bytes(8)),
                        'type' => 'RESERVATION_EXPIRED_RELEASED',
                        'ttid' => $item['ticket_type_id'],
                        'name' => $ticket['name'],
                        'delta' => $restoredQty,
                        'prev' => $prevStock,
                        'new' => $newStock,
                        'ref' => $res['reservation_reference'],
                        'notes' => "Inventory released ({$reason})",
                    ]);
                }
            }

            $finalStatus = $reason === 'expired' ? 'expired' : 'released';
            $upRes = $db->prepare('UPDATE reservations SET status = :status WHERE id = :id');
            $upRes->execute(['status' => $finalStatus, 'id' => $res['id']]);

            $db->commit();
            return true;
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Release all expired active reservations back into inventory
     */
    public static function releaseExpiredReservations(): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id FROM reservations WHERE status = 'active' AND expires_at < NOW()");
        $stmt->execute();
        $expired = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $releasedCount = 0;
        foreach ($expired as $res) {
            try {
                if (self::releaseReservation($res['id'], 'expired')) {
                    $releasedCount++;
                }
            } catch (\Throwable $e) {
                // Continue releasing other expired holds
            }
        }

        return $releasedCount;
    }
}
