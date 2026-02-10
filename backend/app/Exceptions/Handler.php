<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Convert an authentication exception into a JSON response.
     */
    protected function unauthenticated($request, AuthenticationException $exception): JsonResponse
    {
        return response()->json([
            'message' => 'Unauthenticated.',
        ], 401);
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        if ($request->is('api/*') || $request->expectsJson()) {
            return $this->renderApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Render a consistent JSON error response for API requests.
     */
    protected function renderApiException(Request $request, Throwable $e): JsonResponse
    {
        if ($e instanceof AuthenticationException) {
            return $this->unauthenticated($request, $e);
        }

        if ($e instanceof ValidationException) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        }

        if ($e instanceof HttpExceptionInterface) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Error',
            ], $e->getStatusCode());
        }

        $status = 500;
        $response = [
            'message' => 'Internal Server Error',
        ];

        if (config('app.debug')) {
            $response['message'] = $e->getMessage();
            $response['exception'] = get_class($e);
            $response['trace'] = collect($e->getTrace())->take(5)->toArray();
        }

        return response()->json($response, $status);
    }
}
