import { http } from "./http";

export type PromoCode = {
  id: number;
  code: string;
  discount_amount: number;
  discount_type: string;
  is_active: boolean;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
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
