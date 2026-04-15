<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(
        private readonly BookingService $bookingService
    ) {}

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'class_schedule_id' => 'required|exists:class_schedules,id',
        ]);

        try {
            $booking = $this->bookingService->createBooking(
                $request->user(),
                $request->class_schedule_id
            );

            return response()->json([
                'message' => 'Booking successful',
                'data' => $booking,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function history(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->bookingService->getUserBookings($request->user()),
        ]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        try {
            $booking = $this->bookingService->cancelBooking(
                $request->user(),
                $id
            );

            return response()->json([
                'message' => 'Booking cancelled',
                'data' => $booking,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}