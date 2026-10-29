<?php
declare(strict_types=1);

namespace Mastrotickets\Config;

/**
 * Environment configuration loader
 * Reads from getenv() or parses .env file outside public web root
 */
class Env
{
    private static array $cache = [];
    private static bool $loaded = false;

    public static function load(?string $path = null): void
    {
        if (self::$loaded) {
            return;
        }

        $envFile = $path ?? dirname(__DIR__, 2) . '/.env';
        if (file_exists($envFile) && is_readable($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || str_starts_with($line, '#')) {
                    continue;
                }

                if (str_contains($line, '=')) {
                    [$key, $val] = explode('=', $line, 2);
                    $key = trim($key);
                    $val = trim($val);
                    // Strip quotes
                    if (str_starts_with($val, '"') && str_ends_with($val, '"')) {
                        $val = substr($val, 1, -1);
                    } elseif (str_starts_with($val, "'") && str_ends_with($val, "'")) {
                        $val = substr($val, 1, -1);
                    }
                    self::$cache[$key] = $val;
                    if (!isset($_SERVER[$key])) {
                        $_SERVER[$key] = $val;
                    }
                    if (!isset($_ENV[$key])) {
                        $_ENV[$key] = $val;
                    }
                }
            }
        }

        self::$loaded = true;
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        self::load();
        $val = getenv($key);
        if ($val !== false && $val !== '') {
            return (string)$val;
        }
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
            return (string)$_ENV[$key];
        }
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
            return (string)$_SERVER[$key];
        }
        return self::$cache[$key] ?? $default;
    }

    public static function getBool(string $key, bool $default = false): bool
    {
        $val = strtolower((string)self::get($key, ''));
        if ($val === '') {
            return $default;
        }
        return in_array($val, ['true', '1', 'yes', 'on'], true);
    }

    public static function getInt(string $key, int $default = 0): int
    {
        $val = self::get($key);
        return $val !== null && is_numeric($val) ? (int)$val : $default;
    }
}
