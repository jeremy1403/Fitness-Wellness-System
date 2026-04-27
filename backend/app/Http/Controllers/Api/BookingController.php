<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BookingController extends Controller
{
    public function __construct(
        private readonly BookingService $bookingService
    ) {}

    /**
     * Admin: list all bookings across all users.
     */
    public function index(): AnonymousResourceCollection
    {
        return BookingResource::collection(
            $this->bookingService->getAllBookings()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'class_schedule_id' => 'required|exists:class_schedules,id',
        ]);

        try {
            $result = $this->bookingService->createBooking(
                $request->user(),
                $request->class_schedule_id
            );

            $bookingData = new BookingResource(
                $result->booking->load('classSchedule.fitnessClass')
            );

            // ── Quota consumed: booking is fully confirmed ────────────────────
            if (!$result->requiresPayment) {
                return response()->json([
                    'status'  => 'confirmed',
                    'message' => 'Booked using your daily quota!',
                    'data'    => $bookingData,
                ], 201);
            }

            // ── Payment required: seat reserved, awaiting checkout ────────────
            return response()->json([
                'status'          => 'pending_payment',
                'message'         => 'Class booked! Please complete payment to confirm your spot.',
                'requires_payment' => true,
                'booking_id'      => $result->booking->id,
                'class_price'     => $result->classPrice,
                'data'            => $bookingData,
            ], 202);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function history(Request $request): JsonResponse
    {
        return response()->json([
            'data' => BookingResource::collection(
                $this->bookingService->getUserBookings($request->user())
            ),
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
                'data'    => new BookingResource($booking->load('classSchedule.fitnessClass')),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Admin: cancel any booking by ID.
     */
    public function adminCancel(int $id): JsonResponse
    {
        try {
            $booking = $this->bookingService->adminCancelBooking($id);

            return response()->json([
                'message' => 'Booking cancelled',
                'data'    => new BookingResource($booking->load('classSchedule.fitnessClass')),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Trainer/Admin: mark a booking as attended or no_show.
     * State Pattern enforces valid transitions.
     */
    public function updateAttendance(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:attended,no_show',
        ]);

        try {
            $booking = $this->bookingService->updateAttendance(
                $id,
                $request->status
            );

            return response()->json([
                'message' => 'Attendance updated',
                'data'    => new BookingResource($booking->load('classSchedule.fitnessClass')),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Trainer: get all bookings for a specific schedule.
     */
    public function scheduleBookings(int $scheduleId): JsonResponse
    {
        return response()->json([
            'data' => BookingResource::collection(
                $this->bookingService->getScheduleBookings($scheduleId)
            ),
        ]);
    }
}