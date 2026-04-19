// frontend/types/booking.ts

export type BookingStatus = "booked" | "cancelled" | "attended" | "no_show";

export interface ClassScheduleSnapshot {
  id: number;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  status: string;
  fitness_class?: {
    id: number;
    title: string;
    description: string | null;
    duration_minutes: number;
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