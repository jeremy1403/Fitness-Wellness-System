<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Consumer
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $response instanceof JsonResponse) {
            return $response;
        }

        $status = $response->getStatusCode();
        $requestStatus = match (true) {
            $status >= 200 && $status < 400 => 'Success',
            $status >= 400 && $status < 500 => 'Fail',
            default => 'Error',
        };

        $original = $response->getData(true);
        $original = is_array($original) ? $original : ['data' => $original];

        $response->setData([
            'request_status' => $requestStatus,
            'timestamp' => now()->toIso8601String(),
            ...$original,
        ]);

        return $response;
    }
}
