import { http } from "./http";

export type PromoCode = {
  id: number;
  trainer_id: number | null;
  code: string;
  discount_amount: number;
  discount_type: string;
  max_discount_amount: number | null;
  is_new_user_only: boolean;
  is_active: boolean;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplyPromoResult = {
  message: string;
  code: string;
  details: {
    discount_type: string;
    discount_amount: number;
    max_discount_amount: number | null;
    is_new_user_only: boolean;
    promo_code_id: number;
  };
};

export const adminPromoApi = {
  getAll: () => http<PromoCode[]>("/admin/promo-codes", { method: "GET" }),
  create: (data: Partial<PromoCode>) => http<PromoCode>("/admin/promo-codes", { method: "POST", body: data }),
  update: (id: number, data: Partial<PromoCode>) => http<PromoCode>(`/admin/promo-codes/${id}`, { method: "PUT", body: data }),
  delete: (id: number) => http(`/admin/promo-codes/${id}`, { method: "DELETE" }),
};

export const promoValidateApi = {
  validate: (code: string, user_id?: number) =>
    http<{ valid: boolean; message: string; details: any }>("/promo/validate", { method: "POST", body: { code, user_id } }),
};

export const userPromoApi = {
  getAvailable: () => http<PromoCode[]>("/promos/available", { method: "GET" }),
  apply: (code: string, user_id: number) =>
    http<ApplyPromoResult>("/promo/apply", { method: "POST", body: { code, user_id } }),
  getActive: (user_id: number) =>
    http<{ active_promo: { code: string; details: any } | null; message: string }>(
      `/promo/my-active?user_id=${user_id}`,
      { method: "GET" }
    ),
};

export type KpiData = {
  total_redemptions: number;
  total_savings: number;
  kpi_score: number;
  kpi_tier: {
    label: string;
    color: string;
    next_at: number | null;
    progress: number;
  };
};

export const trainerPromoApi = {
  getMyPromos: (user_id: number) =>
    http<{ codes: PromoCode[]; kpi: KpiData }>(`/trainer/promos?user_id=${user_id}`, { method: "GET" }),
  create: (user_id: number, data: Partial<PromoCode>) =>
    http<PromoCode>("/trainer/promos", { method: "POST", body: { ...data, user_id } }),
  update: (id: number, user_id: number, data: Partial<PromoCode>) =>
    http<PromoCode>(`/trainer/promos/${id}`, { method: "PUT", body: { ...data, user_id } }),
  delete: (id: number, user_id: number) =>
    http(`/trainer/promos/${id}?user_id=${user_id}`, { method: "DELETE" }),
};

