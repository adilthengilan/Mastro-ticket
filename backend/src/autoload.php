<?php
declare(strict_types=1);

/**
 * PSR-4 Autoloader for Mastrotickets namespace
 * Used both standalone and before/alongside Composer vendor/autoload.php
 */
spl_autoload_register(function ($class) {
    $prefix = 'Mastrotickets\\';
    $baseDir = __DIR__ . '/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

// Load vendor autoload if available
$vendorAutoload = dirname(__DIR__) . '/vendor/autoload.php';
if (file_exists($vendorAutoload)) {
    require_once $vendorAutoload;
}
