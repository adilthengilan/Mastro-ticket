<?php
declare(strict_types=1);

namespace Mastrotickets\Services;

use Mastrotickets\Config\Database;
use Mastrotickets\Config\Env;
use PDO;

class EmailService
{
    /**
     * Queue an email into the email_jobs table and dispatch via Resend
     */
    public static function queue(
        string $recipientEmail,
        string $recipientName,
        string $template,
        string $subject,
        array $templateData = [],
        ?string $orderId = null
    ): string {
        $db = Database::getConnection();
        $jobId = 'em_' . bin2hex(random_bytes(8));

        $htmlBody = self::renderTemplate($template, $recipientName, $templateData);

        $stmt = $db->prepare('
            INSERT INTO email_jobs (id, order_id, recipient_email, recipient_name, template, subject, body_text, status, sent_at, retry_count)
            VALUES (:id, :oid, :remail, :rname, :tpl, :subj, :body, :status, NOW(), 0)
        ');

        $apiKey = Env::get('RESEND_API_KEY');
        $fromEmail = Env::get('MAIL_FROM_ADDRESS', 'tickets@mastrotickets.co');
        $fromName = Env::get('MAIL_FROM_NAME', 'MastroTickets Official');

        $status = 'pending';
        $errorReason = null;

        if (!empty($apiKey) && !str_starts_with($apiKey, 're_your_')) {
            // Send via Resend REST API
            $sent = self::sendViaResend($apiKey, "{$fromName} <{$fromEmail}>", $recipientEmail, $subject, $htmlBody);
            if ($sent['success']) {
                $status = 'delivered';
            } else {
                $status = 'failed';
                $errorReason = $sent['error'];
            }
        } else {
            // Development or placeholder key mode: simulated delivery
            $status = 'delivered';
        }

        $stmt->execute([
            'id' => $jobId,
            'oid' => $orderId,
            'remail' => $recipientEmail,
            'rname' => $recipientName,
            'tpl' => $template,
            'subj' => $subject,
            'body' => $htmlBody,
            'status' => $status,
        ]);

        return $jobId;
    }

    private static function sendViaResend(string $apiKey, string $from, string $to, string $subject, string $html): array
    {
        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'from' => $from,
                'to' => [$to],
                'subject' => $subject,
                'html' => $html,
            ]),
            CURLOPT_TIMEOUT => 15,
        ]);

        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            return ['success' => false, 'error' => $err];
        }

        $json = json_decode($res, true);
        if ($code >= 400) {
            return ['success' => false, 'error' => $json['message'] ?? 'Failed to send Resend email'];
        }

        return ['success' => true, 'id' => $json['id'] ?? ''];
    }

    private static function renderTemplate(string $template, string $name, array $data): string
    {
        $orderNumber = $data['orderNumber'] ?? '';
        $total = $data['total'] ?? '';
        $ticketsHtml = '';

        if (!empty($data['tickets']) && is_array($data['tickets'])) {
            $ticketsHtml = '<div style="margin: 20px 0; background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">';
            $ticketsHtml .= '<h3 style="color: #0B1F3A; margin-top: 0;">Issued Tickets:</h3><ul style="padding-left: 20px; color: #334155;">';
            foreach ($data['tickets'] as $t) {
                $ticketsHtml .= "<li><strong>{$t['ticketNumber']}</strong> - {$t['ticketName']} ({$t['category']} / {$t['section']})</li>";
            }
            $ticketsHtml .= '</ul></div>';
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0B1F3A; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">MASTROTICKETS</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">OFFICIAL FORMULA 1 TICKETING & EXPERIENCES</p>
        </div>
        <div style="padding: 32px 24px; color: #1e293b;">
            <h2 style="color: #0B1F3A; margin-top: 0;">Booking Confirmation</h2>
            <p>Dear {$name},</p>
            <p>Thank you for choosing MastroTickets. Your Formula 1 booking <strong>{$orderNumber}</strong> has been confirmed and paid in full.</p>
            {$ticketsHtml}
            <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                <p style="margin: 0; color: #166534; font-weight: 600;">Total Paid: {$total}</p>
                <p style="margin: 4px 0 0 0; color: #166534; font-size: 13px;">Your e-tickets are ready in your MastroTickets customer portal.</p>
            </div>
            <div style="margin-top: 32px; text-align: center;">
                <a href="https://mastrotickets.co" style="display: inline-block; background-color: #0B1F3A; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600;">Access My Tickets</a>
            </div>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">&copy; 2026 MastroTickets. All rights reserved. Yas Marina Circuit, Abu Dhabi, UAE.</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
