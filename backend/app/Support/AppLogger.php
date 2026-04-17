<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

/**
 * Centralized logger for all modules.
 *
 * Provides structured logging with consistent context (module name, user ID)
 * so that log entries are easy to filter and trace across the application.
 *
 * Usage:
 *   AppLogger::info('auth', 'User logged in', ['user_id' => 1]);
 *   AppLogger::error('booking', 'Booking failed', ['schedule_id' => 5]);
 *   AppLogger::api('POST /api/v1/auth/login', 200, ['user_id' => 1]);
 */
class AppLogger
{
    /**
     * Valid module names for consistent tagging.
     */
    private const MODULES = ['auth', 'classes', 'booking', 'membership', 'payment', 'system'];

    public static function info(string $module, string $message, array $context = []): void
    {
        Log::info(self::format($module, $message), $context);
    }

    public static function warning(string $module, string $message, array $context = []): void
    {
        Log::warning(self::format($module, $message), $context);
    }

    public static function error(string $module, string $message, array $context = []): void
    {
        Log::error(self::format($module, $message), $context);
    }

    public static function debug(string $module, string $message, array $context = []): void
    {
        Log::debug(self::format($module, $message), $context);
    }

    /**
     * Log an API request/response to the dedicated api channel.
     */
    public static function api(string $endpoint, int $status, array $context = []): void
    {
        Log::channel('api')->info("[API] {$endpoint} -> {$status}", $context);
    }

    /**
     * Log a Provider-decorated request trace to storage/logs/provider.log and stderr.
     */
    public static function provider(string $action, string $requestId, string $timestamp): void
    {
        Log::channel('provider')->info("[PROVIDER] {$action}", [
            'request_id' => $requestId,
            'action' => $action,
            'timestamp' => $timestamp,
        ]);
    }

    /**
     * Format message with module prefix for easy grep/filtering.
     */
    private static function format(string $module, string $message): string
    {
        $tag = strtoupper($module);

        return "[{$tag}] {$message}";
    }
}
