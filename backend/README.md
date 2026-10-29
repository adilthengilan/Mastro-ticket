# MastroTickets PHP REST API — Deployment & Production Guide

This directory contains the production-ready PHP backend for **MastroTickets** (`mastrotickets.co`), hosted on Hostinger VPS (Ubuntu 22.04 / 24.04 with Apache 2.4 and PHP 8.2+).

---

## 1. Directory Structure

```
backend/
├── .env.example                # Sanitized template for all server secrets
├── composer.json               # PHP dependencies (Stripe, Resend, Cloudinary, etc.)
├── database/
│   └── schema.sql              # MySQL/MariaDB database schema & F1 seed data
├── apache/
│   └── mastrotickets-api.conf  # Production Apache VirtualHost with SSL & Security
├── public/
│   ├── .htaccess               # URL rewrite, Bearer header passing, security headers
│   └── index.php               # Front controller & REST API router
└── src/
    ├── Config/
    │   ├── Database.php        # PDO singleton with prepared statements
    │   └── Env.php             # Secure environment loader
    ├── Controllers/
    │   ├── AdminController.php    # Admin authentication, stats, order voiding
    │   ├── CheckoutController.php # Stripe session creation & promo validation
    │   ├── EventController.php    # Events listing & details
    │   ├── HealthController.php   # /api/v1/health status endpoint
    │   ├── OrderController.php    # Customer order lookup & session retrieval
    │   ├── TicketController.php   # Ticket inventory & masked PII verification
    │   └── WebhookController.php  # Stripe webhook signature verification
    ├── Http/
    │   ├── Request.php         # Request wrapper (method, headers, JSON body)
    │   └── Response.php        # Consistent JSON response envelope
    ├── Middleware/
    │   ├── AuthMiddleware.php  # JWT & Admin key verification
    │   └── CorsMiddleware.php  # Origin validation & security headers
    ├── Services/
    │   ├── EmailService.php    # Resend email integration & outbox pattern
    │   ├── ReservationService.php # 10-minute hold concurrency & auto-release
    │   ├── StripeService.php   # Stripe Checkout sessions & order confirmation
    │   └── TicketNumberGenerator.php # Unique MST-ABU26-XXXXXXXX format
    └── autoload.php            # PSR-4 Autoloader
```

---

## 2. Server Requirements & Dependencies

- **OS**: Ubuntu Linux 22.04 LTS or 24.04 LTS
- **Web Server**: Apache 2.4+ (`mod_rewrite`, `mod_headers`, `mod_ssl`)
- **PHP**: PHP 8.2 or 8.3 with extensions:
  - `php8.2-mysql`
  - `php8.2-curl`
  - `php8.2-mbstring`
  - `php8.2-xml`
- **Database**: MySQL 8.0+ or MariaDB 10.6+

---

## 3. Hostinger VPS Setup Instructions

### Step 1: Clone or Copy Backend Files
Place the backend repository in `/var/www/mastrotickets/backend`:
```bash
sudo mkdir -p /var/www/mastrotickets
sudo chown -R www-data:www-data /var/www/mastrotickets
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` outside the public web root:
```bash
cd /var/www/mastrotickets/backend
cp .env.example .env
nano .env
```
Fill in your production credentials:
- `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `JWT_SECRET` (generate using `openssl rand -hex 32`)

Ensure file permissions prevent unauthorized reading:
```bash
chmod 600 .env
chown www-data:www-data .env
```

### Step 3: Import Database Schema
Log into MySQL and import `schema.sql`:
```bash
mysql -u your_database_user -p your_database_name < /var/www/mastrotickets/backend/database/schema.sql
```

### Step 4: Configure Apache VirtualHost
Copy the Apache configuration file:
```bash
sudo cp apache/mastrotickets-api.conf /etc/apache2/sites-available/mastrotickets-api.conf
sudo a2enmod rewrite headers ssl
sudo a2ensite mastrotickets-api.conf
sudo systemctl restart apache2
```

### Step 5: Obtain Free SSL Certificate with Certbot
```bash
sudo apt update && sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d api.mastrotickets.co
```

### Step 6: Configure Stripe Webhook
In your Stripe Dashboard:
1. Navigate to **Developers → Webhooks**.
2. Add endpoint: `https://api.mastrotickets.co/api/v1/webhooks/stripe`.
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
4. Copy the Signing Secret (`whsec_...`) into your backend `.env` as `STRIPE_WEBHOOK_SECRET`.

---

## 4. API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health & database status check |
| `GET` | `/api/v1/events` | Published Grand Prix events |
| `GET` | `/api/v1/events/{id}` | Event details with ticket tiers & pricing in AED |
| `GET` | `/api/v1/tickets` | Ticket inventory filterable by category and race day |
| `GET` | `/api/v1/tickets/verify/{ticketNumber}` | Public ticket verification with redacted customer PII |
| `POST` | `/api/v1/checkout/session` | Create atomic 10-minute hold & Stripe Checkout session |
| `POST` | `/api/v1/discounts/validate` | Authoritative promo code verification |
| `POST` | `/api/v1/webhooks/stripe` | Stripe signature verification & ticket issuing |
| `GET` | `/api/v1/orders/{id}` | Fetch confirmed order by ID or order number |
| `GET` | `/api/v1/orders/session/{sessionId}` | Fetch order by Stripe session ID |
| `POST` | `/api/v1/admin/login` | Secure admin login returning JWT |
| `GET` | `/api/v1/admin/dashboard` | Aggregated revenue (AED), orders, tickets sold |
| `GET` | `/api/v1/admin/orders` | Paginated orders with search |
| `POST` | `/api/v1/admin/tickets/void` | Administrative ticket voiding with audit log |
