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

        $templateData['recipientEmail'] = $templateData['recipientEmail'] ?? $recipientEmail;
        $htmlBody = self::renderTemplate($template, $recipientName, $templateData);

        $stmt = $db->prepare('
            INSERT INTO email_jobs (id, order_id, recipient_email, recipient_name, template, subject, body_text, status, sent_at, retry_count)
            VALUES (:id, :oid, :remail, :rname, :tpl, :subj, :body, :status, NOW(), 0)
        ');

        $apiKey = Env::get('RESEND_API_KEY');
        $fromEmail = Env::get('MAIL_FROM_ADDRESS', 'orders@mastrotickets.co');
        $fromName = Env::get('MAIL_FROM_NAME', 'MastroTickets');

        $status = 'pending';

        if (!empty($apiKey) && !str_starts_with($apiKey, 're_your_')) {
            $sent = self::sendViaResend($apiKey, "{$fromName} <{$fromEmail}>", $recipientEmail, $subject, $htmlBody);
            $status = $sent['success'] ? 'delivered' : 'failed';
        } else {
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

        $json = json_decode((string)$res, true);
        if ($code >= 400) {
            return ['success' => false, 'error' => $json['message'] ?? 'Failed to send Resend email'];
        }

        return ['success' => true, 'id' => $json['id'] ?? ''];
    }

    private static function esc(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }

    private static function renderTemplate(string $template, string $name, array $data): string
    {
        $safeName = self::esc($name ?: 'Customer');
        $orderNumber = self::esc((string)($data['orderNumber'] ?? ''));
        $recipientEmail = self::esc((string)($data['recipientEmail'] ?? ''));
        $eventName = self::esc((string)($data['eventName'] ?? 'Formula 1 Grand Prix Event'));
        $venue = self::esc((string)($data['venue'] ?? 'Hungaroring, Budapest'));
        $eventDate = self::esc((string)($data['eventDate'] ?? 'Date & Time to be Confirmed'));
        $section = self::esc((string)($data['section'] ?? 'Grandstand'));
        $row = self::esc((string)($data['row'] ?? ''));
        $listingNote = self::esc((string)($data['listingNote'] ?? ''));
        $ticketCount = (int)($data['ticketCount'] ?? (is_array($data['tickets'] ?? null) ? count($data['tickets']) : 1));
        $paymentMethod = self::esc((string)($data['paymentMethod'] ?? 'Card (Stripe)'));
        $total = self::esc((string)($data['total'] ?? ''));
        $year = date('Y');

        if ($template !== 'order_confirmation' && $template !== 'ticket_delivery') {
            $bodyMessage = nl2br(self::esc((string)($data['bodyText'] ?? 'Thank you for choosing MastroTickets.')));
            return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0;">
    <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background-color: #0B1F3A; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">MASTROTICKETS</h1>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">TRUSTED FORMULA 1 &amp; LIVE EVENT TICKETS</p>
        </div>
        <div style="padding: 28px 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
            <p style="margin-top: 0;">Dear {$safeName},</p>
            <p>{$bodyMessage}</p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">&copy; {$year} MastroTickets. All rights reserved. Hungaroring, Budapest, Hungary.</p>
        </div>
    </div>
</body>
</html>
HTML;
        }

        $ticketLine = "Section {$section}" . ($row !== '' ? ", Row {$row}" : ', Row') . ", ({$ticketCount} Ticket(s))";
        $listingNoteRow = $listingNote !== ''
            ? "<tr><td style=\"padding: 6px 0; color: #64748b; width: 150px; vertical-align: top;\">Listing Note(s):</td><td style=\"padding: 6px 0; color: #0f172a; font-weight: 500;\">{$listingNote}</td></tr>"
            : '';

        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 24px 12px; margin: 0; color: #0f172a;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <!-- Brand Header -->
        <div style="background-color: #0B1F3A; padding: 24px 28px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">MASTROTICKETS</h1>
            <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 12px; letter-spacing: 0.5px;">YOUR ORDER WITH ORDER ID {$orderNumber} IS CONFIRMED</p>
        </div>

        <div style="padding: 28px; font-size: 14px; line-height: 1.6; color: #1e293b;">
            <h2 style="color: #0B1F3A; margin: 0 0 12px 0; font-size: 20px; line-height: 1.3;">
                Congratulations! You&rsquo;re on your way to see {$eventName} at {$venue}!
            </h2>
            <p style="margin: 0 0 16px 0;">
                Thank you for buying tickets for <strong>{$eventName}</strong> using <strong>MastroTickets</strong>!
            </p>

            <!-- Mobile Ticket Transfer Box -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
                <p style="margin: 0 0 12px 0; font-weight: 600; color: #0B1F3A;">
                    The tickets you ordered will be delivered as a Mobile Ticket Transfer, a convenient and secure digital ticketing system:
                </p>
                <ol style="margin: 0 0 14px 0; padding-left: 20px; color: #334155;">
                    <li style="margin-bottom: 8px;">You will receive an email from either Ticketmaster or the team/venue when your tickets are available. If you don&rsquo;t see the email, check your spam folder for the phrase &ldquo;Your Ticket Transfer&rdquo;.</li>
                    <li style="margin-bottom: 8px;">Once you receive the email, create or log in to your account. Remember to use the same email you provided when purchasing your order.</li>
                    <li style="margin-bottom: 8px;">Follow the instructions provided to complete the transfer.</li>
                    <li style="margin-bottom: 8px;">Download the mobile app associated with Ticketmaster or the team/venue.</li>
                    <li>Present your mobile ticket to gain entry to your event.</li>
                </ol>
                <p style="margin: 0 0 10px 0; padding: 10px 12px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px;">
                    <strong>Your tickets will be transferred to:</strong> {$recipientEmail}
                </p>
                <p style="margin: 0; font-size: 12px; color: #475569;">
                    <strong>Note:</strong> In order to retrieve the tickets, you must create an account with Ticketmaster in the location of the country of the event. Please use the same email address that was used when purchasing the tickets on MastroTickets.
                </p>
            </div>

            <div style="text-align: center; margin: 22px 0;">
                <a href="https://mastrotickets.co/account" style="display: inline-block; background-color: #123B67; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 13px;">
                    Track Your Order at Any Time
                </a>
            </div>

            <!-- Timing & Policy -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 18px;">
                <h3 style="color: #0B1F3A; margin: 0 0 6px 0; font-size: 15px;">When will I receive my tickets?</h3>
                <p style="margin: 0 0 10px 0; color: #334155; font-size: 13px;">
                    We are already in touch with the seller to ensure tickets are delivered as early as possible. Please note, tickets for live events are often not released until 24 hours before the event.
                </p>
                <p style="margin: 0; color: #334155; font-size: 13px;">
                    All sales are final. More questions? Check out our <a href="https://mastrotickets.co/help" style="color: #123B67; font-weight: 600;">Frequently Asked Questions</a> page.
                </p>
            </div>

            <!-- Event Information -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 20px;">
                <h3 style="color: #0B1F3A; margin: 0 0 10px 0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.4px;">Event Information</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 150px; vertical-align: top;">Order ID:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace;">{$orderNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Event:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{$eventName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Ticket(s):</td>
                        <td style="padding: 6px 0; color: #0f172a;">{$ticketLine}</td>
                    </tr>
                    {$listingNoteRow}
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Venue:</td>
                        <td style="padding: 6px 0; color: #0f172a;">{$venue}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Date:</td>
                        <td style="padding: 6px 0; color: #0f172a;">{$eventDate} &middot; Date &amp; Time to be Confirmed</td>
                    </tr>
                </table>
            </div>

            <!-- Order Information -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 20px;">
                <h3 style="color: #0B1F3A; margin: 0 0 10px 0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.4px;">Order Information</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 150px;">Customer Name:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{$safeName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Payment Method:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">{$paymentMethod}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Number of Tickets:</td>
                        <td style="padding: 6px 0; color: #0f172a;">{$ticketCount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Total Charge:</td>
                        <td style="padding: 6px 0; color: #0B1F3A; font-weight: 700; font-size: 15px; font-family: monospace;">{$total}</td>
                    </tr>
                </table>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 22px; font-size: 12px; color: #475569;">
                <p style="margin: 0 0 10px 0;">
                    MastroTickets is a trusted ticket marketplace where you can find tickets for Formula 1 races, Concerts, Festivals, and Sports events. Check out the latest Grand Prix and live event tickets at <a href="https://mastrotickets.co" style="color: #123B67;">mastrotickets.co</a>.
                </p>
                <p style="margin: 0 0 10px 0;">
                    Please do not reply to this message, as this email address does not accept incoming email. If you have any further enquiries please visit our <a href="https://mastrotickets.co/help" style="color: #123B67;">Help Centre</a>.
                </p>
                <p style="margin: 0; font-weight: 600; color: #0B1F3A;">Thank you for using MastroTickets!</p>
            </div>
        </div>

        <!-- Legal & Address Footer -->
        <div style="background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; line-height: 1.6; color: #64748b;">
            <p style="margin: 0 0 8px 0; text-align: center;">
                Copyright &copy; {$year} MastroTickets. All rights reserved.
                &nbsp;|&nbsp;
                <a href="https://mastrotickets.co/help" style="color: #123B67; text-decoration: none;">Privacy Policy</a>
                &nbsp;|&nbsp;
                <a href="https://mastrotickets.co/account" style="color: #123B67; text-decoration: none;">My Account</a>
            </p>
            <p style="margin: 0 0 8px 0;">
                This email was sent by MastroTickets and may contain confidential or privileged information. If you are not the intended recipient, please delete the message, attachments, and notify the sender.
            </p>
            <p style="margin: 0 0 8px 0;">
                <strong>MastroTickets</strong> &middot; Address: Hungaroring, Budapest, Hungary. Note: this address is not the Customer Service address. Any postal mail sent to this address will take a minimum of 14 days to reply, so please use our <a href="https://mastrotickets.co/help" style="color: #123B67;">Help Centre</a> or email concierge@mastrotickets.co for a quicker response.
            </p>
            <p style="margin: 0;">
                The following applies to any buyer who purchases tickets from a seller where MastroTickets acts as the seller&rsquo;s payment agent under our user agreement: MastroTickets is a limited payment collection agent of the seller, and your payment to us satisfies your obligation to the seller, subject to our user agreement.
            </p>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
