// frontend/types/booking.ts

export type BookingStatus =
  | "booked"           // legacy — existing records only
  | "confirmed"        // quota-used or payment-confirmed
  | "pending_payment"  // seat reserved, awaiting checkout
  | "cancelled"
  | "attended"
  | "no_show";

export interface ClassScheduleSnapshot {
  id: number;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  status: string;
  trainer_name?: string;
  fitness_class?: {
    id: number;
    title: string;
    description: string | null;
    duration_minutes: number;
    price: number;
  };
}

export interface BookingUser {
  id: number;
  name: string;
  email: string;
}

export interface Booking {
  id: number;
  user_id: number;
  class_schedule_id: number;
  status: BookingStatus;
  booked_at: string;
  cancelled_at: string | null;
  is_quota_used: boolean;
  class_schedule?: ClassScheduleSnapshot;
  user?: BookingUser;
}

export interface BookingListResponse {
  data: Booking[];
}

export interface BookingResponse {
  message: string;
  data: Booking;
}

export interface CreateBookingPayload {
  class_schedule_id: number;
}

/**
 * The union response type from POST /api/v1/bookings.
 *
 * HTTP 201 → QuotaBookingResponse  (free slot consumed)
 * HTTP 202 → PendingPaymentBookingResponse  (payment required)
 *
 * Discriminate on `requires_payment`.
 */
export interface QuotaBookingResponse {
  status: "confirmed";
  message: string;
  requires_payment: false;
  data: Booking;
}

export interface PendingPaymentBookingResponse {
  status: "pending_payment";
  message: string;
  requires_payment: true;
  schedule_id: number;
  class_price: number;
  data: null;
}

export type BookingCreateResult =
  | QuotaBookingResponse
  | PendingPaymentBookingResponse;