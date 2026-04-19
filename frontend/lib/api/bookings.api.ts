// frontend/lib/api/bookings.api.ts

import { http } from "./http";
import type {
  BookingListResponse,
  BookingResponse,
  CreateBookingPayload,
} from "@/types/booking";

const BASE = "/bookings";

export const bookingsApi = {
  /**
   * Book a class schedule.
   * POST /api/v1/bookings
   */
  create(payload: CreateBookingPayload) {
    return http<BookingResponse>(`${BASE}/`, {
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