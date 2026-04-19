<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyHmacSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $signature = $request->header('X-Signature');
        $secret = config('app.external_api_secret', 'default_secret');

        // HMAC SHA-256 against raw request payload
        $computed = hash_hmac('sha256', $request->getContent(), $secret);

        if (!$signature || !hash_equals($computed, $signature)) {
            return response()->json(['message' => 'Integrity Check Failed: Invalid HMAC Signature'], 403);
        }

        return $next($request);
    }
}
