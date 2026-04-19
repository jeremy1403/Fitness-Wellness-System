"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  membershipApi,
  MembershipPlan,
  Payment,
} from "@/lib/api/membership.api";
import { userPromoApi, PromoCode } from "@/lib/api/promo.api";
import { useAuth } from "@/lib/auth/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Ticket,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Tag,
  X,
  Loader2,
} from "lucide-react";

type PaymentMethod = "cash" | "transfer" | "card_mock";

// ── Discount state shape ─────────────────────────────────────────────────────
interface AppliedPromo {
  code: string;
  discountType: "percentage" | "flat";
  discountAmount: number;
  /** Populated only when a percentage promo hits its cap */
  maxDiscountAmount: number | null;
  promo_code_id: number;
}

export default function PaymentsPage() {
  const router = useRouter();

  const [planIdParam, setPlanIdParam] = useState<string | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card_mock");
  const [cashReceipt, setCashReceipt] = useState<string>("");
  const [hasBlockingMembership, setHasBlockingMembership] = useState(false);

  // Card fields
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  // Transfer fields
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [transferReference, setTransferReference] = useState("");

  const [fieldErrors, setFieldErrors] = useState({
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    bankName: "",
    accountName: "",
    transferReference: "",
  });

  // ── Promo / Voucher state ──────────────────────────────────────────────────
  const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [showVoucherPicker, setShowVoucherPicker] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  const { user } = useAuth();

  const selectedPlan = useMemo(() => {
    if (!planIdParam) return null;
    const planId = Number(planIdParam);
    if (Number.isNaN(planId)) return null;
    return plans.find((plan) => plan.id === planId) ?? null;
  }, [planIdParam, plans]);

  // ── Computed price values ──────────────────────────────────────────────────
  const originalPrice = selectedPlan ? Number(selectedPlan.price) : 0;

  const { discountValue, isCapped } = useMemo(() => {
    if (!appliedPromo || originalPrice === 0) return { discountValue: 0, isCapped: false };
    if (appliedPromo.discountType === "percentage") {
      const calculated = (originalPrice * appliedPromo.discountAmount) / 100;
      if (
        appliedPromo.maxDiscountAmount !== null &&
        calculated > appliedPromo.maxDiscountAmount
      ) {
        return { discountValue: appliedPromo.maxDiscountAmount, isCapped: true };
      }
      return { discountValue: calculated, isCapped: false };
    }
    // Flat
    return {
      discountValue: Math.min(appliedPromo.discountAmount, originalPrice),
      isCapped: false,
    };
  }, [appliedPromo, originalPrice]);

  const finalPrice = Math.max(0, originalPrice - discountValue);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPlanIdParam(params.get("plan_id"));
    fetchData();
    fetchAvailablePromos();
  }, []);

  // ── STEP 1: Auto-apply cached active promo on mount ────────────────────
  useEffect(() => {
    if (!user?.id || appliedPromo) return;
    userPromoApi.getActive(user.id).then((res) => {
      const active = res.active_promo;
      if (!active?.code || !active?.details) return;
      // Silently inject the cached promo without a network validate round-trip
      setAppliedPromo({
        code:               active.code,
        discountType:       active.details.discount_type as "percentage" | "flat",
        discountAmount:     active.details.discount_amount,
        maxDiscountAmount:  active.details.max_discount_amount ?? null,
        promo_code_id:      active.details.promo_code_id,
      });
    }).catch(() => {/* non-blocking */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function fetchData() {
    try {
      const [paymentsRes, plansRes, membershipRes, historyRes] =
        await Promise.all([
          membershipApi.myPayments(),
          membershipApi.getPlans(),
          membershipApi.myMembership(),
          membershipApi.myHistory(),
        ]);

      setPayments(paymentsRes.data);
      setPlans(plansRes.data);

      const activeMembership = membershipRes.data;
      const pendingMembership = historyRes.data.find(
        (m) => m.status === "pending"
      );

      setHasBlockingMembership(!!activeMembership || !!pendingMembership);
    } catch {
      setMessage("Failed to load payment data.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailablePromos() {
    setPromosLoading(true);
    try {
      const promos = await userPromoApi.getAvailable();
      // Show only active, non-expired promos with uses remaining
      const now = new Date();
      setAvailablePromos(
        (Array.isArray(promos) ? promos : (promos as any)?.data ?? []).filter(
          (p: PromoCode) =>
            p.is_active &&
            (p.expires_at === null || new Date(p.expires_at) > now) &&
            (p.max_uses === null || p.times_used < p.max_uses)
        )
      );
    } catch {
      // non-blocking — user can still type manually
    } finally {
      setPromosLoading(false);
    }
  }

  async function handleApplyCode(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setPromoValidating(true);
    setPromoError(null);

    try {
      const result = await userPromoApi.apply(trimmed, 0); // user_id resolved server-side via auth
      setAppliedPromo({
        code: trimmed,
        discountType: result.details.discount_type as "percentage" | "flat",
        discountAmount: result.details.discount_amount,
        maxDiscountAmount: result.details.max_discount_amount ?? null,
        promo_code_id: result.details.promo_code_id,
      });
      setShowVoucherPicker(false);
      setManualCode("");
    } catch (err: any) {
      setPromoError(
        err?.errors?.code?.[0] ||
          err?.message ||
          "Invalid or unavailable promo code."
      );
    } finally {
      setPromoValidating(false);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoError(null);
    setManualCode("");
  }

  function clearFieldErrors() {
    setFieldErrors({
      cardName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      bankName: "",
      accountName: "",
      transferReference: "",
    });
  }

  function validatePaymentDetails(): boolean {
    const errors = {
      cardName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      bankName: "",
      accountName: "",
      transferReference: "",
    };

    if (paymentMethod === "card_mock") {
      const cleanedCardNumber = cardNumber.replace(/\s/g, "");
      if (!cardName.trim() || cardName.trim().length < 3)
        errors.cardName = "Please enter a valid cardholder name.";
      if (!/^\d{12,19}$/.test(cleanedCardNumber))
        errors.cardNumber = "Card number must contain 12 to 19 digits.";
      if (!/^\d{2}\/\d{2}$/.test(expiryDate.trim()))
        errors.expiryDate = "Expiry date must be in MM/YY format.";
      if (!/^\d{3,4}$/.test(cvv.trim()))
        errors.cvv = "CVV must be 3 or 4 digits.";
    }

    if (paymentMethod === "transfer") {
      if (!bankName.trim() || bankName.trim().length < 2)
        errors.bankName = "Please enter a valid bank name.";
      if (!accountName.trim() || accountName.trim().length < 3)
        errors.accountName = "Please enter a valid account holder name.";
      if (!/^[A-Za-z0-9\-\/]{6,20}$/.test(transferReference.trim()))
        errors.transferReference =
          "Reference must be 6–20 characters (letters, numbers, - or / only).";
    }

    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  }

  async function handlePayNow() {
    if (!selectedPlan) {
      setMessage("Selected plan not found.");
      return;
    }
    if (hasBlockingMembership) {
      setMessage(
        "You already have an active or pending membership. Please wait until it is approved, cancelled, or expired before choosing another package."
      );
      return;
    }

    clearFieldErrors();
    if (!validatePaymentDetails()) return;

    setPaying(true);
    setMessage("");
    setCashReceipt("");

    try {
      const subscribeRes = await membershipApi.subscribe(
        selectedPlan.id,
        paymentMethod
      );
      const membership = subscribeRes.data;

      const paymentRes = await membershipApi.processPayment(
        membership.id,
        originalPrice,           // Always send original plan price; backend applies discount
        paymentMethod,
        appliedPromo?.code ?? undefined
      );

      const payment = paymentRes.data;

      if (payment.method === "cash" && payment.status === "pending") {
        setCashReceipt(payment.reference_no);
        setMessage(
          `Cash payment recorded successfully. Your receipt code is ${payment.reference_no}. Please proceed to the counter and wait for admin confirmation.`
        );
        await fetchData();
        return;
      }

      router.push("/app/membership?success=payment");
    } catch (err: any) {
      setMessage(
        err?.data?.message || err?.message || "Payment failed. Please try again."
      );
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete your checkout or view your payment history.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {hasBlockingMembership && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You already have an active or pending membership. You cannot choose
          another package right now.
        </div>
      )}

      {cashReceipt && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          <p className="font-semibold">Cash Payment Pending Confirmation</p>
          <p className="mt-1">
            Receipt Code:{" "}
            <span className="font-mono font-semibold">{cashReceipt}</span>
          </p>
          <p className="mt-1">
            Please show this code to the admin/front desk. Your membership will
            be activated after payment is confirmed.
          </p>
        </div>
      )}

      {planIdParam && (
        <Card className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
          {!selectedPlan ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Checkout</h2>
              <p className="text-sm text-red-600">
                The selected plan could not be found.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Checkout
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Review your selected membership plan before payment.
                </p>
              </div>

              {/* ── Plan Details Grid ─────────────────────────────────────── */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Plan Name</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {selectedPlan.name}
                  </p>
                </div>

                {/* ── Price Box: dynamic, shows discount ───────────────── */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Price</p>
                  {appliedPromo ? (
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm text-slate-400 line-through">
                        RM {originalPrice.toFixed(2)}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-xl font-bold text-emerald-600">
                          RM {finalPrice.toFixed(2)}
                        </p>
                        <span className="text-xs font-medium text-emerald-500">
                          −RM {discountValue.toFixed(2)}
                          {isCapped && (
                            <span className="ml-1 text-amber-500">
                              (Capped at max limit)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-slate-900">
                      RM {originalPrice.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Duration</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {selectedPlan.duration_days} days
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Daily Booking Limit</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {selectedPlan.booking_daily_limit} bookings/day
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                  <p className="text-sm text-slate-500">Advance Booking</p>
                  <p className="text-lg font-semibold text-slate-900">
                    Up to {selectedPlan.booking_advance_days} days ahead
                  </p>
                </div>
              </div>

              {/* ── Voucher / Promo Code Section ──────────────────────────── */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Ticket className="h-4 w-4 text-teal-500" />
                    Promo / Voucher Code
                  </label>
                  {!appliedPromo && (
                    <button
                      type="button"
                      onClick={() => setShowVoucherPicker((v) => !v)}
                      className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      {showVoucherPicker ? "Hide" : "Browse vouchers"}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${showVoucherPicker ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>

                {/* Applied promo badge */}
                {appliedPromo ? (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-700">
                          {appliedPromo.code}
                        </p>
                        <p className="text-xs text-emerald-600">
                          {appliedPromo.discountType === "percentage"
                            ? `${appliedPromo.discountAmount}% off`
                            : `RM ${appliedPromo.discountAmount} off`}
                          {appliedPromo.maxDiscountAmount !== null && (
                            <span className="ml-1 text-amber-600">
                              · capped at RM {appliedPromo.maxDiscountAmount}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      aria-label="Remove promo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Voucher picker dropdown */}
                    {showVoucherPicker && (
                      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-100 overflow-hidden">
                        {promosLoading ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading vouchers…
                          </div>
                        ) : availablePromos.length === 0 ? (
                          <p className="py-4 text-center text-sm text-slate-400">
                            No vouchers available right now.
                          </p>
                        ) : (
                          availablePromos.map((promo) => {
                            const alreadyUsed = !!promo.is_already_used;
                            return (
                              <button
                                key={promo.id}
                                type="button"
                                onClick={() => !alreadyUsed && handleApplyCode(promo.code)}
                                disabled={promoValidating || alreadyUsed}
                                className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors group ${
                                  alreadyUsed
                                    ? "opacity-50 cursor-not-allowed bg-slate-50"
                                    : "hover:bg-white"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Tag className={`h-4 w-4 shrink-0 ${alreadyUsed ? "text-slate-300" : "text-teal-400"}`} />
                                  <div>
                                    <p className={`text-sm font-semibold font-mono ${
                                      alreadyUsed ? "text-slate-400 line-through" : "text-slate-800"
                                    }`}>
                                      {promo.code}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {promo.discount_type === "percentage"
                                        ? `${promo.discount_amount}% off`
                                        : `RM ${promo.discount_amount} off`}
                                      {promo.max_discount_amount !== null && (
                                        <span className="ml-1 text-amber-500">
                                          · max RM {promo.max_discount_amount}
                                        </span>
                                      )}
                                      {promo.expires_at && (
                                        <span className="ml-1 text-slate-400">
                                          · exp{" "}
                                          {new Date(promo.expires_at).toLocaleDateString()}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <span className={`text-xs font-medium shrink-0 ml-2 ${
                                  alreadyUsed ? "text-slate-400" : "text-teal-600 group-hover:underline"
                                }`}>
                                  {alreadyUsed ? (
                                    "Already Redeemed ✓"
                                  ) : promoValidating ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    "Apply"
                                  )}
                                </span>
                              </button>
                            );
                          })

                        )}
                      </div>
                    )}

                    {/* Manual code entry */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => {
                          setManualCode(e.target.value.toUpperCase());
                          setPromoError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleApplyCode(manualCode);
                        }}
                        placeholder="e.g. SUMMER10"
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition"
                        disabled={promoValidating}
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCode(manualCode)}
                        disabled={!manualCode.trim() || promoValidating}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                      >
                        {promoValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>

                    {promoError && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {promoError}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Payment Method ────────────────────────────────────────── */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value as PaymentMethod);
                    setMessage("");
                    setCashReceipt("");
                    setCardName("");
                    setCardNumber("");
                    setExpiryDate("");
                    setCvv("");
                    setBankName("");
                    setAccountName("");
                    setTransferReference("");
                    clearFieldErrors();
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="card_mock">Card</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {paymentMethod === "card_mock" && (
                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => {
                        setCardName(e.target.value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          cardName: "",
                        }));
                      }}
                      placeholder="Enter cardholder name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    {fieldErrors.cardName && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.cardName}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => {
                        setCardNumber(e.target.value.replace(/[^\d\s]/g, ""));
                        setFieldErrors((prev) => ({
                          ...prev,
                          cardNumber: "",
                        }));
                      }}
                      placeholder="1234 5678 9012 3456"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    {fieldErrors.cardNumber && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.cardNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => {
                        setExpiryDate(e.target.value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          expiryDate: "",
                        }));
                      }}
                      placeholder="MM/YY"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    {fieldErrors.expiryDate && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.expiryDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => {
                        setCvv(e.target.value.replace(/\D/g, ""));
                        setFieldErrors((prev) => ({ ...prev, cvv: "" }));
                      }}
                      placeholder="123"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    {fieldErrors.cvv && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.cvv}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === "transfer" && (
                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => {
                        setBankName(e.target.value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          bankName: "",
                        }));
                      }}
                      placeholder="Enter bank name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    {fieldErrors.bankName && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.bankName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => {
                        setAccountName(e.target.value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          accountName: "",
                        }));
                      }}
                      placeholder="Enter account holder name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    {fieldErrors.accountName && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.accountName}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Transfer Reference Number
                    </label>
                    <input
                      type="text"
                      value={transferReference}
                      onChange={(e) => {
                        setTransferReference(
                          e.target.value
                            .replace(/[^a-zA-Z0-9\-\/\s]/g, "")
                            .replace(/\s+/g, " ")
                            .trimStart()
                        );
                        setFieldErrors((prev) => ({
                          ...prev,
                          transferReference: "",
                        }));
                      }}
                      placeholder="Enter transfer reference"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Example: TRX123456 or IBG-20260418
                    </p>
                    {fieldErrors.transferReference && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.transferReference}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Cash payment selected. A receipt code will be generated after
                  submission. Please present that code to the admin/front desk
                  for manual payment confirmation.
                </div>
              )}

              {/* ── Pay Now Button ────────────────────────────────────────── */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  id="pay-now-btn"
                  onClick={handlePayNow}
                  disabled={paying || hasBlockingMembership}
                  className="relative overflow-hidden"
                >
                  {paying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                    </span>
                  ) : appliedPromo ? (
                    <span className="flex items-center gap-2">
                      Pay Now — RM {finalPrice.toFixed(2)}
                      <span className="text-xs opacity-70 line-through">
                        RM {originalPrice.toFixed(2)}
                      </span>
                    </span>
                  ) : (
                    `Pay Now (RM ${originalPrice.toFixed(2)})`
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/app/membership")}
                  disabled={paying}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Payment History ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Payment History
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            View all your past payments and receipts.
          </p>
        </div>

        {payments.filter((p) => p.status !== "cancelled").length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-500">No payments found.</p>
          </div>
        ) : (
          payments
            .filter((p) => p.status !== "cancelled")
            .map((payment) => (
              <Card key={payment.id} className="p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {payment.membership?.plan?.name ?? "Membership Payment"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Ref: {payment.reference_no}
                    </p>
                    <p className="text-sm text-slate-500">
                      Date:{" "}
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString()
                        : "-"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Method: {payment.method}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold text-slate-900">
                      RM {payment.amount}
                    </p>
                    <Badge
                      className={
                        payment.status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : payment.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : payment.status === "cancelled"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-red-50 text-red-700"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}