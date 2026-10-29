<?php
declare(strict_types=1);

namespace Mastrotickets\Http;

class Response
{
    public static function json(array|object $data, int $statusCode = 200, array $headers = []): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        foreach ($headers as $key => $value) {
            header("{$key}: {$value}");
        }

        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success(mixed $data = null, string $message = 'Success', int $statusCode = 200, array $meta = []): void
    {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];
        if (!empty($meta)) {
            $payload['meta'] = $meta;
        }

        self::json($payload, $statusCode);
    }

    public static function error(string $message, int $statusCode = 400, ?array $errors = null, ?string $errorCode = null): void
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];
        if ($errorCode !== null) {
            $payload['code'] = $errorCode;
        }
        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        self::json($payload, $statusCode);
    }

    public static function unauthorized(string $message = 'Unauthorized'): void
    {
        self::error($message, 401, null, 'UNAUTHORIZED');
    }

    public static function forbidden(string $message = 'Forbidden'): void
    {
        self::error($message, 403, null, 'FORBIDDEN');
    }

    public static function notFound(string $message = 'Resource not found'): void
    {
        self::error($message, 404, null, 'NOT_FOUND');
    }

    public static function validationError(array $errors, string $message = 'Validation failed'): void
    {
        self::error($message, 422, $errors, 'VALIDATION_FAILED');
    }

    public static function serverError(string $message = 'Internal server error'): void
    {
        self::error($message, 500, null, 'INTERNAL_SERVER_ERROR');
    }
}
