<?php
declare(strict_types=1);

namespace Mastrotickets\Config;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Authoritative Database Connection Manager
 * Enforces prepared statements, utf8mb4 encoding, and exception handling
 */
class Database
{
    private static ?PDO $connection = null;

    public static function getConnection(): PDO
    {
        if (self::$connection !== null) {
            return self::$connection;
        }

        Env::load();

        $host = Env::get('DB_HOST', '127.0.0.1');
        $port = Env::getInt('DB_PORT', 3306);
        $dbname = Env::get('DB_DATABASE', 'mastrotickets_db');
        $user = Env::get('DB_USERNAME', 'root');
        $pass = Env::get('DB_PASSWORD', '');
        $charset = Env::get('DB_CHARSET', 'utf8mb4');

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_PERSISTENT => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE {$charset}_unicode_ci"
        ];

        try {
            self::$connection = new PDO($dsn, $user, $pass, $options);
            return self::$connection;
        } catch (PDOException $e) {
            // Never expose database passwords or internal traces to client
            $isDev = Env::getBool('APP_DEBUG', false);
            $msg = $isDev ? 'Database connection failure: ' . $e->getMessage() : 'Internal database service unavailable';
            throw new RuntimeException($msg, 500);
        }
    }

    public static function hasActiveConnection(): bool
    {
        try {
            self::getConnection()->query('SELECT 1');
            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }
}
