import { http } from "./http";

// --- Types ---
export interface MembershipPlan {
  id: number;
  name: string;
  price: string;
  duration_days: number;
  booking_daily_limit: number;
  booking_advance_days: number;
  status: string;
}

export interface Membership {
  id: number;
  user_id: number;
  membership_plan_id: number;
  start_date: string;
  end_date: string;
  status: string;
  plan?: MembershipPlan;
}

export interface PaymentUser {
  id: number;
  name: string;
  email: string;
}

export interface Payment {
  id: number;
  membership_id: number;
  user_id: number;
  amount: string;
  method: string;
  status: string;
  paid_at: string;
  reference_no: string;
  membership?: Membership;
  user?: PaymentUser;
}

export interface SubscriptionStatus {
  is_active: boolean;
  membership: Membership | null;
}


export const membershipApi = {
  // Get all active plans (for members to browse)
  getPlans() {
    return http<{ message: string; data: MembershipPlan[] }>(
      "/plans",
      { baseUrl: "/api/memberships" }
    );
  },

  // Get current user's active membership
  myMembership() {
    return http<{ message: string; data: Membership | null }>(
      "/my",
      { baseUrl: "/api/memberships" }
    );
  },

  // Get current user's membership history
  myHistory() {
    return http<{ message: string; data: Membership[] }>(
      "/history",
      { baseUrl: "/api/memberships" }
    );
  },

  // Subscribe to a plan
  subscribe(planId: number, paymentMethod: string) {
    return http<{ message: string; data: Membership }>(
      "/subscribe",
      {
        method: "POST",
        body: { plan_id: planId, payment_method: paymentMethod },
        baseUrl: "/api/memberships",
      }
    );
  },

  // Cancel a membership
  cancel(membershipId: number) {
    return http<{ message: string; data: Membership }>(
      `/${membershipId}/cancel`,
      {
        method: "PUT",
        baseUrl: "/api/memberships",
      }
    );
  },

  // Get subscription status
  getStatus() {
    return http<{ message: string; data: SubscriptionStatus }>(
      "/status",
      { baseUrl: "/api/memberships" }
    );
  },

  // Get current user's payment history
  myPayments() {
    return http<{ message: string; data: Payment[] }>(
      "/payments/my",
      { baseUrl: "/api/memberships" }
    );
  },

  // Get a single payment by ID (receipt)
  getPayment(paymentId: number) {
    return http<{ message: string; data: Payment }>(
      `/payments/${paymentId}`,
      { baseUrl: "/api/memberships" }
    );
  },

  // Process a payment
  processPayment(membershipId: number, amount: number, method: string) {
    return http<{ message: string; data: Payment }>(
      "/payments/process",
      {
        method: "POST",
        body: { membership_id: membershipId, amount, method },
        baseUrl: "/api/memberships",
      }
    );
  },

  // Admin - get all plans
  getAllPlans() {
    return http<{ message: string; data: MembershipPlan[] }>(
      "/plans/all",
      { baseUrl: "/api/memberships" }
    );
  },

  // Admin - update membership status
  updateStatus(membershipId: number, status: string) {
    return http<{ message: string; data: Membership }>(
      `/${membershipId}/status`,
      {
        method: "PUT",
        body: { status },
        baseUrl: "/api/memberships",
      }
    );
  },

  // Admin - get all payments
  getAllPayments() {
    return http<{ message: string; data: Payment[] }>(
      "/payments/all",
      { baseUrl: "/api/memberships" }
    );
  },

  // Admin - mark a pending cash payment as paid
  markPaymentAsPaid(paymentId: number) {
    return http<{ message: string; data: Payment }>(
      `/payments/${paymentId}/mark-paid`,
      {
        method: "PUT",
        baseUrl: "/api/memberships",
      }
    );
  },

  // Admin - update plan status
  updatePlanStatus(planId: number, status: string) {
    return http<{ message: string; data: MembershipPlan }>(
      `/plans/${planId}/status`,
      {
        method: "PUT",
        body: { status },
        baseUrl: "/api/memberships",
      }
    );
  },

  // Admin - create plan
  createPlan(data: Omit<MembershipPlan, 'id'>) {
    return http<{ message: string; data: MembershipPlan }>(
      "/plans",
      {
        method: "POST",
        body: data,
        baseUrl: "/api/memberships",
      }
    );
  },

  // Admin - update plan
  updatePlan(planId: number, data: Omit<MembershipPlan, 'id'>) {
    return http<{ message: string; data: MembershipPlan }>(
      `/plans/${planId}`,
      {
        method: "PUT",
        body: data,
        baseUrl: "/api/memberships",
      }
    );
  },
};