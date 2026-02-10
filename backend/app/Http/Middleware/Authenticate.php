<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * For a pure REST API, we never redirect — the exception handler returns JSON 401.
     */
    protected function redirectTo(Request $request): ?string
    {
        return null;
    }
}
