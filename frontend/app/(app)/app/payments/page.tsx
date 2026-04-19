"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { membershipApi, MembershipPlan, Payment } from "@/lib/api/membership.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PaymentMethod = "cash" | "transfer" | "card_mock";

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

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

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

  const selectedPlan = useMemo(() => {
    if (!planIdParam) return null;
    const planId = Number(planIdParam);
    if (Number.isNaN(planId)) return null;
    return plans.find((plan) => plan.id === planId) ?? null;
  }, [planIdParam, plans]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPlanIdParam(params.get("plan_id"));
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [paymentsRes, plansRes, membershipRes, historyRes] = await Promise.all([
        membershipApi.myPayments(),
        membershipApi.getPlans(),
        membershipApi.myMembership(),
        membershipApi.myHistory(),
      ]);

      setPayments(paymentsRes.data);
      setPlans(plansRes.data);

      const activeMembership = membershipRes.data;
      const pendingMembership = historyRes.data.find((m) => m.status === "pending");

      setHasBlockingMembership(!!activeMembership || !!pendingMembership);
    } catch {
      setMessage("Failed to load payment data.");
    } finally {
      setLoading(false);
    }
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

      if (!cardName.trim() || cardName.trim().length < 3) {
        errors.cardName = "Please enter a valid cardholder name.";
      }

      if (!/^\d{12,19}$/.test(cleanedCardNumber)) {
        errors.cardNumber = "Card number must contain 12 to 19 digits.";
      }

      if (!/^\d{2}\/\d{2}$/.test(expiryDate.trim())) {
        errors.expiryDate = "Expiry date must be in MM/YY format.";
      }

      if (!/^\d{3,4}$/.test(cvv.trim())) {
        errors.cvv = "CVV must be 3 or 4 digits.";
      }
    }

    if (paymentMethod === "transfer") {
      if (!bankName.trim() || bankName.trim().length < 2) {
        errors.bankName = "Please enter a valid bank name.";
      }

      if (!accountName.trim() || accountName.trim().length < 3) {
        errors.accountName = "Please enter a valid account holder name.";
      }

      if (!/^[A-Za-z0-9\-\/]{6,20}$/.test(transferReference.trim())) {
        errors.transferReference =
          "Reference must be 6–20 characters (letters, numbers, - or / only).";
      }
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

    if (!validatePaymentDetails()) {
      return;
    }

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
        Number(selectedPlan.price),
        paymentMethod
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
        err?.data?.message ||
        err?.message ||
        "Payment failed. Please try again."
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
          You already have an active or pending membership. You cannot choose another package right now.
        </div>
      )}

      {cashReceipt && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          <p className="font-semibold">Cash Payment Pending Confirmation</p>
          <p className="mt-1">
            Receipt Code: <span className="font-mono font-semibold">{cashReceipt}</span>
          </p>
          <p className="mt-1">
            Please show this code to the admin/front desk. Your membership will be activated
            after payment is confirmed.
          </p>
        </div>
      )}

      {planIdParam && (
        <Card className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
          {!selectedPlan ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Checkout
              </h2>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Plan Name</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {selectedPlan.name}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Price</p>
                  <p className="text-lg font-semibold text-slate-900">
                    RM {selectedPlan.price}
                  </p>
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
                        setFieldErrors((prev) => ({ ...prev, cardName: "" }));
                      }}
                      placeholder="Enter cardholder name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    {fieldErrors.cardName && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.cardName}</p>
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
                        setFieldErrors((prev) => ({ ...prev, cardNumber: "" }));
                      }}
                      placeholder="1234 5678 9012 3456"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    {fieldErrors.cardNumber && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.cardNumber}</p>
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
                        setFieldErrors((prev) => ({ ...prev, expiryDate: "" }));
                      }}
                      placeholder="MM/YY"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    {fieldErrors.expiryDate && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.expiryDate}</p>
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
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.cvv}</p>
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
                        setFieldErrors((prev) => ({ ...prev, bankName: "" }));
                      }}
                      placeholder="Enter bank name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    {fieldErrors.bankName && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.bankName}</p>
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
                        setFieldErrors((prev) => ({ ...prev, accountName: "" }));
                      }}
                      placeholder="Enter account holder name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    {fieldErrors.accountName && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.accountName}</p>
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
                        setFieldErrors((prev) => ({ ...prev, transferReference: "" }));
                      }}
                      placeholder="Enter transfer reference"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Example: TRX123456 or IBG-20260418
                    </p>
                    {fieldErrors.transferReference && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.transferReference}</p>
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Cash payment selected. A receipt code will be generated after submission.
                  Please present that code to the admin/front desk for manual payment confirmation.
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={handlePayNow} disabled={paying || hasBlockingMembership}>
                  {paying ? "Processing..." : `Pay Now (RM ${selectedPlan.price})`}
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

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Payment History
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            View all your past payments and receipts.
          </p>
        </div>

        {payments.filter((payment) => payment.status !== "cancelled").length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-500">No payments found.</p>
          </div>
        ) : (
          payments
            .filter((payment) => payment.status !== "cancelled")
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
                      Date: {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "-"}
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