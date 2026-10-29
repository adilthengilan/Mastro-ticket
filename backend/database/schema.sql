-- ==============================================================================
-- MASTROTICKETS DATABASE SCHEMA (MySQL 8.0+ / MariaDB 10.5+)
-- Production Hostinger VPS Relational Database Definition
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Events Table
CREATE TABLE IF NOT EXISTS `events` (
  `id` VARCHAR(64) NOT NULL,
  `slug` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `official_title` VARCHAR(255) NOT NULL,
  `circuit` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `country` VARCHAR(128) NOT NULL,
  `country_code` VARCHAR(8) NOT NULL,
  `flag` VARCHAR(16) NOT NULL,
  `dates` VARCHAR(128) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `round` INT NOT NULL,
  `season` INT NOT NULL,
  `timezone` VARCHAR(64) NOT NULL,
  `banner` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
  `starting_price` DECIMAL(10,2) NOT NULL,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `lap_distance` VARCHAR(32) DEFAULT NULL,
  `number_of_laps` INT DEFAULT NULL,
  `race_distance` VARCHAR(32) DEFAULT NULL,
  `lap_record_time` VARCHAR(32) DEFAULT NULL,
  `lap_record_driver` VARCHAR(128) DEFAULT NULL,
  `lap_record_year` INT DEFAULT NULL,
  `schedule_json` LONGTEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_events_slug` (`slug`),
  KEY `idx_events_status_date` (`status`, `start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `slug` VARCHAR(64) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `badge_color` VARCHAR(32) DEFAULT '#0B1F3A',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Ticket Types (Inventory Catalog)
CREATE TABLE IF NOT EXISTS `ticket_types` (
  `id` VARCHAR(64) NOT NULL,
  `event_id` VARCHAR(64) NOT NULL,
  `category_slug` VARCHAR(64) NOT NULL,
  `race_day` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `section` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `original_price` DECIMAL(10,2) DEFAULT NULL,
  `fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `capacity` INT NOT NULL,
  `available_quantity` INT NOT NULL,
  `features_json` TEXT DEFAULT NULL,
  `is_assigned_seating` TINYINT(1) NOT NULL DEFAULT 0,
  `delivery_type` VARCHAR(64) NOT NULL DEFAULT 'instant_eticket',
  `status` ENUM('available', 'low_inventory', 'sold_out') NOT NULL DEFAULT 'available',
  `max_per_order` INT NOT NULL DEFAULT 6,
  `image_url` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ticket_event` (`event_id`),
  KEY `idx_ticket_category` (`category_slug`),
  CONSTRAINT `fk_ticket_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Discounts & Promo Codes
CREATE TABLE IF NOT EXISTS `discounts` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `discount_percent` INT DEFAULT NULL,
  `discount_amount` DECIMAL(10,2) DEFAULT NULL,
  `min_spend` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `max_usage` INT NOT NULL DEFAULT 1000,
  `used_count` INT NOT NULL DEFAULT 0,
  `valid_until` DATE NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_discounts_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Booking Reservations (10-minute pessimistic hold)
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` VARCHAR(64) NOT NULL,
  `reservation_reference` VARCHAR(64) NOT NULL,
  `event_id` VARCHAR(64) NOT NULL,
  `customer_email` VARCHAR(255) DEFAULT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `tax` DECIMAL(10,2) NOT NULL,
  `service_fee` DECIMAL(10,2) NOT NULL,
  `discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_code` VARCHAR(64) DEFAULT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'AED',
  `status` ENUM('active', 'confirmed', 'expired', 'released') NOT NULL DEFAULT 'active',
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_reservations_ref` (`reservation_reference`),
  KEY `idx_reservations_status_expires` (`status`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Reservation Line Items
CREATE TABLE IF NOT EXISTS `reservation_items` (
  `id` VARCHAR(64) NOT NULL,
  `reservation_id` VARCHAR(64) NOT NULL,
  `ticket_type_id` VARCHAR(64) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `fee` DECIMAL(10,2) NOT NULL,
  `seat_details_json` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_res_items_res` (`reservation_id`),
  CONSTRAINT `fk_res_items_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Orders (Authoritative Paid Records)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(64) NOT NULL,
  `order_number` VARCHAR(64) NOT NULL,
  `reservation_id` VARCHAR(64) DEFAULT NULL,
  `customer_id` VARCHAR(64) NOT NULL DEFAULT 'guest',
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(64) NOT NULL,
  `customer_country` VARCHAR(128) NOT NULL,
  `billing_street` VARCHAR(255) DEFAULT NULL,
  `billing_city` VARCHAR(128) DEFAULT NULL,
  `billing_postal_code` VARCHAR(32) DEFAULT NULL,
  `billing_country` VARCHAR(128) DEFAULT NULL,
  `billing_tax_id` VARCHAR(64) DEFAULT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `service_fee` DECIMAL(10,2) NOT NULL,
  `tax` DECIMAL(10,2) NOT NULL,
  `discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_code` VARCHAR(64) DEFAULT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'AED',
  `status` ENUM('draft', 'pending_payment', 'paid', 'confirmed', 'partially_refunded', 'refunded', 'cancelled', 'payment_failed', 'expired') NOT NULL DEFAULT 'confirmed',
  `payment_id` VARCHAR(128) DEFAULT NULL,
  `stripe_session_id` VARCHAR(128) DEFAULT NULL,
  `stripe_event_id` VARCHAR(128) DEFAULT NULL,
  `payment_method` VARCHAR(64) NOT NULL DEFAULT 'Credit Card (Stripe)',
  `card_last4` VARCHAR(8) DEFAULT '4242',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_orders_order_number` (`order_number`),
  UNIQUE KEY `idx_orders_stripe_session` (`stripe_session_id`),
  UNIQUE KEY `idx_orders_stripe_event` (`stripe_event_id`),
  KEY `idx_orders_customer_email` (`customer_email`),
  KEY `idx_orders_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Order Line Items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(64) NOT NULL,
  `ticket_type_id` VARCHAR(64) NOT NULL,
  `ticket_name` VARCHAR(255) NOT NULL,
  `event_id` VARCHAR(64) NOT NULL,
  `event_name` VARCHAR(255) NOT NULL,
  `circuit` VARCHAR(255) NOT NULL,
  `race_day` VARCHAR(64) NOT NULL,
  `section` VARCHAR(255) NOT NULL,
  `seat_details_json` TEXT DEFAULT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `fee` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Issued E-Tickets (Cryptographic & Barcode Verified Passes)
CREATE TABLE IF NOT EXISTS `issued_tickets` (
  `id` VARCHAR(64) NOT NULL,
  `ticket_number` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(64) NOT NULL,
  `order_number` VARCHAR(64) NOT NULL,
  `event_name` VARCHAR(255) NOT NULL,
  `circuit` VARCHAR(255) NOT NULL,
  `race_day` VARCHAR(64) NOT NULL,
  `category` VARCHAR(128) NOT NULL,
  `section` VARCHAR(255) NOT NULL,
  `row` VARCHAR(32) DEFAULT NULL,
  `seat` INT DEFAULT NULL,
  `attendee_name` VARCHAR(255) NOT NULL,
  `barcode` VARCHAR(64) NOT NULL,
  `qr_code_value` VARCHAR(255) NOT NULL,
  `delivery_status` ENUM('issued', 'delivered', 'ready_for_download') NOT NULL DEFAULT 'ready_for_download',
  `status` ENUM('issued', 'cancelled', 'refunded', 'void') NOT NULL DEFAULT 'issued',
  `void_reason` TEXT DEFAULT NULL,
  `issued_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tickets_number` (`ticket_number`),
  KEY `idx_tickets_order` (`order_id`),
  KEY `idx_tickets_status` (`status`),
  CONSTRAINT `fk_issued_tickets_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Inventory Ledger (Double-Entry Concurrency & Audit Record)
CREATE TABLE IF NOT EXISTS `inventory_ledger` (
  `id` VARCHAR(64) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` ENUM('RESERVATION_CREATED', 'PAYMENT_CONFIRMED_DEDUCTED', 'RESERVATION_EXPIRED_RELEASED', 'REFUND_RESTOCKED', 'ADMIN_VOIDED', 'ADMIN_ADJUSTED') NOT NULL,
  `ticket_type_id` VARCHAR(64) NOT NULL,
  `ticket_name` VARCHAR(255) NOT NULL,
  `quantity_delta` INT NOT NULL,
  `previous_stock` INT NOT NULL,
  `new_stock` INT NOT NULL,
  `reference_id` VARCHAR(64) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ledger_ticket` (`ticket_type_id`),
  KEY `idx_ledger_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Transactional Email Jobs (Outbox queue with Resend dispatch tracking)
CREATE TABLE IF NOT EXISTS `email_jobs` (
  `id` VARCHAR(64) NOT NULL,
  `order_id` VARCHAR(64) DEFAULT NULL,
  `recipient_email` VARCHAR(255) NOT NULL,
  `recipient_name` VARCHAR(255) NOT NULL,
  `template` VARCHAR(64) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_text` LONGTEXT DEFAULT NULL,
  `status` ENUM('delivered', 'pending', 'failed') NOT NULL DEFAULT 'delivered',
  `provider_message_id` VARCHAR(128) DEFAULT NULL,
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `error_reason` TEXT DEFAULT NULL,
  `retry_count` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_emails_order` (`order_id`),
  KEY `idx_emails_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Security Audit Logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(64) NOT NULL,
  `actor_id` VARCHAR(64) NOT NULL,
  `actor_email` VARCHAR(255) NOT NULL,
  `actor_role` VARCHAR(64) NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `target_record` VARCHAR(128) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `change_summary` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_actor` (`actor_id`),
  KEY `idx_audit_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Admin Users
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_admin_username` (`username`),
  UNIQUE KEY `idx_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- INITIAL SEED DATA
-- Authentic Grand Prix Events, Grandstand Categories & Default Admin
-- ==============================================================================

-- Seed Admin User (Default: mastrotickets / mastrotickets@123)
-- Hash generated via password_hash('mastrotickets@123', PASSWORD_BCRYPT)
INSERT INTO `admin_users` (`id`, `username`, `email`, `password_hash`, `role`)
VALUES ('usr-admin-1', 'mastrotickets', 'admin@mastrotickets.co', '$2y$10$0d0i5p66Q6U7mXf2o8Rk1OuU0kYx7Xf6Qn4N1n8Z5uV2r1Y4r7m6e', 'admin')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- Seed Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `badge_color`) VALUES
('cat-grandstand', 'Covered Grandstands', 'grandstand', 'Shaded circuit seating with views of Turns 1, 5 Hairpin, West Straight & Marina.', '#0B1F3A'),
('cat-ga', 'General Admission & Hill', 'general_admission', 'Open grass hill seating with panoramic views of Turns 2 to 7 and giant screens.', '#163A63'),
('cat-vip', 'VIP Hospitality & Paddock Club', 'vip_hospitality', 'Gourmet dining, open bar, pit lane walks, and superyacht viewing terraces.', '#123B67'),
('cat-bundle', 'Weekend 3-Day Bundles', 'weekend_bundle', 'All-inclusive weekend passes with Yasalam concerts & theme parks access.', '#15803D'),
('cat-concert', 'Yasalam After-Race Concerts', 'concert', 'Etihad Park Golden Circle upgrades and multi-night festival passes.', '#B45309')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed Events
INSERT INTO `events` (`id`, `slug`, `name`, `official_title`, `circuit`, `location`, `country`, `country_code`, `flag`, `dates`, `start_date`, `end_date`, `round`, `season`, `timezone`, `banner`, `description`, `status`, `starting_price`, `featured`, `lap_distance`, `number_of_laps`, `race_distance`, `lap_record_time`, `lap_record_driver`, `lap_record_year`) VALUES
('abu-dhabi-gp-2026', 'abu-dhabi-grand-prix-2026', 'Formula 1 Etihad Airways Abu Dhabi Grand Prix 2026', 'FORMULA 1 ETIHAD AIRWAYS ABU DHABI GRAND PRIX 2026', 'Yas Marina Circuit', 'Yas Island, Abu Dhabi', 'United Arab Emirates', 'AE', '🇦🇪', 'December 04 – 06, 2026', '2026-12-04', '2026-12-06', 24, 2026', 'GST (UTC+4)', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85', 'The spectacular twilight Formula 1 season finale! Watch the championship climax under the desert sunset as daylight transitions seamlessly to over 4,700 floodlights illuminating the marina, superyachts, and the iconic W Abu Dhabi hotel. Every 3-day ticket includes complimentary access to the world-renowned Yasalam After-Race Concerts at Etihad Park and free admission to Yas Island theme parks.', 'published', 1032.00, 1, '5.281 km', 58, '306.183 km', '1:26.103', 'Max Verstappen', 2021),
('hungarian-gp-2026', 'hungarian-grand-prix-2026', 'Formula 1 Hungarian Grand Prix 2026', 'FORMULA 1 MAGYAR NAGYDÍJ 2026', 'Hungaroring', 'Budapest', 'Hungary', 'HU', '🇭🇺', 'July 24 – 26, 2026', '2026-07-24', '2026-07-26', 13, 2026', 'CEST (UTC+2)', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=80', 'Experience summer racing outside Budapest with historic tight corners and vibrant trackside nightlife.', 'published', 575.00, 0, '4.381 km', 70, '306.630 km', '1:16.627', 'Lewis Hamilton', 2020),
('monaco-gp-2026', 'monaco-grand-prix-2026', 'Formula 1 Grand Prix de Monaco 2026', 'FORMULA 1 GRAND PRIX DE MONACO 2026', 'Circuit de Monaco', 'Monte Carlo', 'Monaco', 'MC', '🇲🇨', 'May 21 – 24, 2026', '2026-05-21', '2026-05-24', 8, 2026', 'CEST (UTC+2)', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80', 'The historic street circuit of the Principality of Monaco.', 'published', 1508.00, 0, '3.337 km', 78, '260.286 km', '1:12.909', 'Lewis Hamilton', 2021)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed Ticket Types (Prices in AED)
INSERT INTO `ticket_types` (`id`, `event_id`, `category_slug`, `race_day`, `name`, `section`, `description`, `price`, `original_price`, `fee`, `capacity`, `available_quantity`, `features_json`, `is_assigned_seating`, `delivery_type`, `status`, `max_per_order`, `image_url`) VALUES
('t-abu-main-wknd', 'abu-dhabi-gp-2026', 'grandstand', 'Weekend Pass', 'Main Grandstand (Covered)', 'Start/Finish Straight · Opposite F1 Team Garages', 'The prime vantage point at Yas Marina Circuit. Direct frontal view of the starting grid, team pit boxes, and podium ceremony.', 2342.00, 2580.00, 138.00, 4500, 142, '["3-Day admission (Fri, Sat & Sun)","Direct view of start/finish grid & podium","Overlooking team pit garages & pit stops","Numbered allocated covered seating","Access to Thursday Public Pit Lane Walk","Includes access to all 4 Yasalam After-Race Concerts","Complimentary Yas Island theme park access"]', 1, 'instant_eticket', 'available', 6, 'https://alpinef1-assets.dropt.app/Abu_Dhabi_GP_2025_Race_5f98d7412c.png'),
('t-abu-north-wknd', 'abu-dhabi-gp-2026', 'grandstand', 'Weekend Pass', 'North Grandstand (Covered)', 'Turn 5 Hairpin & Long Straight Entrance', 'Situated at the famous Turn 5 hairpin leading onto the longest straight in Formula 1.', 1905.00, 2100.00, 119.00, 5200, 88, '["3-Day admission (Fri, Sat & Sun)","Panoramic Turn 5 hairpin overtaking view","Overlooks entrance to 1.2km main straight","Covered shaded seating with big screens","Access to all 4 Yasalam After-Race Concerts","Free Yas Island theme park passes included"]', 1, 'instant_eticket', 'available', 6, 'https://www.timeoutabudhabi.com/cloud/timeoutabudhabi/2024/06/25/Abu-Dhabi-GP.jpg'),
('t-abu-west-wknd', 'abu-dhabi-gp-2026', 'grandstand', 'Weekend Pass', 'West Grandstand (Covered)', 'Turn 6 & 7 Heavy Braking Chicane', 'Positioned at the end of the 1.2km longest straight where F1 cars brake fiercely from 335 km/h.', 2024.00, NULL, 127.00, 4800, 64, '["3-Day admission (Fri, Sat & Sun)","Prime overtaking and out-braking action zone","Close view of chicane and Turn 8 acceleration","Direct walking distance to F1 Fanzone","Access to all 4 Yasalam After-Race Concerts","Includes Yas Island theme park access"]', 1, 'instant_eticket', 'low_inventory', 6, 'https://i0.wp.com/rumemagazine.com/wp-content/uploads/2025/05/Etihad-Park.webp'),
('t-abu-marina-wknd', 'abu-dhabi-gp-2026', 'grandstand', 'Weekend Pass', 'Marina Grandstand (Covered)', 'Turns 9 & 10 · Overlooking Yas Marina Superyachts', 'Perched directly above the support pit lane and Turns 9 & 10, overlooking illuminated multi-million dollar luxury yachts.', 2104.00, 2300.00, 138.00, 3900, 42, '["3-Day admission (Fri, Sat & Sun)","Spectacular views over Yas Marina & yachts","Overlooks support pits and marina chicane","Direct proximity to Yas Marina promenade dining","Access to all 4 Yasalam After-Race Concerts","Includes Yas Island theme park pass"]', 1, 'instant_eticket', 'low_inventory', 6, 'https://www.digitalstudiome.com/cloud/2021/08/11/sVVDjrSN-Jamiroquai-crowd.jpg'),
('t-abu-hill-wknd', 'abu-dhabi-gp-2026', 'general_admission', 'Weekend Pass', 'Abu Dhabi Hill (General Admission)', 'Open-Air Elevated Grass Banks (Turns 2 to 7)', 'An open-air grass bank offering relaxed viewing with giant LED screens and festival food stalls.', 1032.00, NULL, 75.00, 8000, 210, '["3-Day general admission (Fri, Sat & Sun)","Panoramic elevated views of sector 1 & 2","Giant video screens for live track commentary","Access to all 4 Yasalam After-Race Concerts","Theme park access included with 3-day pass"]', 0, 'instant_eticket', 'available', 8, 'https://alpinef1-assets.dropt.app/Abu_Dhabi_GP_2025_Race_5f98d7412c.png')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed Discounts
INSERT INTO `discounts` (`id`, `code`, `discount_percent`, `discount_amount`, `min_spend`, `max_usage`, `used_count`, `valid_until`, `active`) VALUES
('disc-1', 'ABUDHABI2026', 10, NULL, 900.00, 1000, 0, '2026-12-06', 1),
('disc-2', 'YASISLAND15', 15, NULL, 1500.00, 500, 0, '2026-12-01', 1),
('disc-3', 'VIP400', NULL, 400.00, 3000.00, 200, 0, '2026-12-06', 1)
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);
