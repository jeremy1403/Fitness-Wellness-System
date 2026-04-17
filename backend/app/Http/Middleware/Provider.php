<?php

namespace App\Http\Middleware;

use App\Support\AppLogger;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class Provider
{
    public function handle(Request $request, Closure $next, string $action = 'unknown'): Response
    {
        $requestId = (string) Str::uuid();
        $timestamp = now()->toIso8601String();

        $request->attributes->set('request_id', $requestId);
        $request->attributes->set('action', $action);

        AppLogger::provider($action, $requestId, $timestamp);

        return $next($request);
    }
}
