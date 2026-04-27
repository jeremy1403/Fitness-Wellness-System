// frontend/lib/api/bookings.api.ts

import { http } from "./http";
import type {
  BookingCreateResult,
  BookingListResponse,
  BookingResponse,
  CreateBookingPayload,
} from "@/types/booking";

const BASE = "/bookings";

export const bookingsApi = {
  /**
   * Book a class schedule.
   * POST /api/v1/bookings
   *
   * Returns a discriminated union based on HTTP status:
   *   201 → { status: 'confirmed',       requires_payment: false, data: Booking }
   *   202 → { status: 'pending_payment', requires_payment: true,  booking_id, class_price, data: Booking }
   *
   * The http() utility treats both 201 and 202 as success (res.ok).
   */
  create(payload: CreateBookingPayload) {
    return http<BookingCreateResult>(`${BASE}/`, {
      method: "POST",
      body: payload,
    });
  },

  /**
   * Get the authenticated user's booking history.
   * GET /api/v1/bookings/history
   */
  history() {
    return http<BookingListResponse>(`${BASE}/history`);
  },

  /**
   * Cancel a booking by ID.
   * POST /api/v1/bookings/:id/cancel
   */
  cancel(id: number) {
    return http<BookingResponse>(`${BASE}/${id}/cancel`, {
      method: "POST",
    });
  },

  /**
   * Trainer: get all bookings for a specific schedule.
   * GET /api/v1/bookings/schedule/:scheduleId
   */
  getScheduleBookings(scheduleId: number) {
    return http<BookingListResponse>(`${BASE}/schedule/${scheduleId}`);
  },

  /**
   * Trainer: mark a booking as attended or no_show.
   * State Pattern enforces valid transitions on the backend.
   * PATCH /api/v1/bookings/:id/attendance
   */
  updateAttendance(id: number, status: "attended" | "no_show") {
    return http<BookingResponse>(`${BASE}/${id}/attendance`, {
      method: "PATCH",
      body: { status },
    });
  },
};

// ─── Pay-Per-Class Checkout API ───────────────────────────────────────────────

export interface ClassPaymentPayload {
  schedule_id: number;
  amount: number;
  method: "cash" | "transfer" | "card_mock";
  promo_code?: string;
}

export interface ClassPaymentResponse {
  message: string;
  data: {
    id: number;
    booking_id: number;
    user_id: number;
    amount: string;
    method: string;
    status: string;
    reference_no: string;
    paid_at: string;
  };
}

export const classPaymentsApi = {
  /**
   * Pay for a pending_payment class booking.
   * POST /api/v1/payments/class
   *
   * On success, the backend atomically:
   *   1. Creates a Payment record linked to booking_id.
   *   2. Updates the Booking status from 'pending_payment' → 'confirmed'.
   */
  processClassPayment(payload: ClassPaymentPayload) {
    return http<ClassPaymentResponse>("/payments/class", {
      method: "POST",
      body: payload,
    });
  },
};