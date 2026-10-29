<?php
declare(strict_types=1);

namespace Mastrotickets\Services;

use Mastrotickets\Config\Database;
use PDO;
use Exception;

class ReservationService
{
    /**
     * Create an atomic 10-minute hold reservation for items in cart
     */
    public static function createReservation(string $eventId, array $items, string $customerEmail = '', string $currency = 'AED'): array
    {
        $db = Database::getConnection();
        self::releaseExpiredReservations();

        $db->beginTransaction();
        try {
            $reservationId = 'res_' . bin2hex(random_bytes(10));
            $reservationRef = 'RES-' . strtoupper(bin2hex(random_bytes(4)));
            $expiresAt = date('Y-m-d H:i:s', time() + (10 * 60)); // 10 minutes

            $totalAmount = 0.00;
            $validatedItems = [];

            foreach ($items as $item) {
                $ticketTypeId = $item['ticketTypeId'] ?? $item['id'] ?? '';
                $quantity = (int)($item['quantity'] ?? 1);

                if ($quantity <= 0) {
                    throw new Exception("Invalid quantity for ticket ID {$ticketTypeId}");
                }

                // Lock ticket row for update to prevent race conditions
                $stmt = $db->prepare('SELECT id, event_id, name, price, fee, available_quantity, status FROM ticket_types WHERE id = :id FOR UPDATE');
                $stmt->execute(['id' => $ticketTypeId]);
                $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$ticket) {
                    throw new Exception("Ticket type {$ticketTypeId} not found");
                }

                if ($ticket['status'] === 'sold_out' || $ticket['available_quantity'] < $quantity) {
                    throw new Exception("Insufficient ticket inventory for {$ticket['name']}. Available: {$ticket['available_quantity']}");
                }

                $unitPrice = (float)$ticket['price'];
                $unitFee = (float)$ticket['fee'];
                $itemTotal = ($unitPrice + $unitFee) * $quantity;
                $totalAmount += $itemTotal;

                // Decrement inventory
                $newStock = $ticket['available_quantity'] - $quantity;
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
                    'prev' => $ticket['available_quantity'],
                    'new' => $newStock,
                    'ref' => $reservationRef,
                    'notes' => "10-minute hold for {$customerEmail}",
                ]);

                $validatedItems[] = [
                    'ticketTypeId' => $ticketTypeId,
                    'name' => $ticket['name'],
                    'quantity' => $quantity,
                    'unitPrice' => $unitPrice,
                    'fee' => $unitFee,
                    'totalPrice' => $itemTotal,
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
            ];
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Release all expired active reservations back into inventory
     */
    public static function releaseExpiredReservations(): int
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, reservation_reference FROM reservations WHERE status = 'active' AND expires_at < NOW()");
        $stmt->execute();
        $expired = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $releasedCount = 0;
        foreach ($expired as $res) {
            $db->beginTransaction();
            try {
                $itemStmt = $db->prepare('SELECT ticket_type_id, quantity FROM reservation_items WHERE reservation_id = :rid');
                $itemStmt->execute(['rid' => $res['id']]);
                $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($items as $item) {
                    $stockStmt = $db->prepare('SELECT available_quantity, name FROM ticket_types WHERE id = :id FOR UPDATE');
                    $stockStmt->execute(['id' => $item['ticket_type_id']]);
                    $ticket = $stockStmt->fetch(PDO::FETCH_ASSOC);

                    if ($ticket) {
                        $newStock = $ticket['available_quantity'] + (int)$item['quantity'];
                        $update = $db->prepare("UPDATE ticket_types SET available_quantity = :qty, status = 'available' WHERE id = :id");
                        $update->execute(['qty' => $newStock, 'id' => $item['ticket_type_id']]);

                        $ledger = $db->prepare('
                            INSERT INTO inventory_ledger (id, timestamp, type, ticket_type_id, ticket_name, quantity_delta, previous_stock, new_stock, reference_id, notes)
                            VALUES (:id, NOW(), :type, :ttid, :name, :delta, :prev, :new, :ref, :notes)
                        ');
                        $ledger->execute([
                            'id' => 'led_' . bin2hex(random_bytes(8)),
                            'type' => 'RESERVATION_EXPIRED_RELEASED',
                            'ttid' => $item['ticket_type_id'],
                            'name' => $ticket['name'],
                            'delta' => (int)$item['quantity'],
                            'prev' => $ticket['available_quantity'],
                            'new' => $newStock,
                            'ref' => $res['reservation_reference'],
                            'notes' => 'Auto-released after 10-minute hold expiry',
                        ]);
                    }
                }

                $upRes = $db->prepare("UPDATE reservations SET status = 'expired' WHERE id = :id");
                $upRes->execute(['id' => $res['id']]);
                $db->commit();
                $releasedCount++;
            } catch (\Throwable $e) {
                $db->rollBack();
            }
        }

        return $releasedCount;
    }
}
