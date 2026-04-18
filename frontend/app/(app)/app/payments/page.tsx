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

  // Mock payment form fields
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [transferReference, setTransferReference] = useState("");

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
      const [paymentsRes, plansRes] = await Promise.all([
        membershipApi.myPayments(),
        membershipApi.getPlans(),
      ]);

      setPayments(paymentsRes.data);
      setPlans(plansRes.data);
    } catch {
      setMessage("Failed to load payment data.");
    } finally {
      setLoading(false);
    }
  }

  function validatePaymentDetails(): boolean {
    if (paymentMethod === "card_mock") {
      if (!cardName.trim()) {
        setMessage("Please enter the cardholder name.");
        return false;
      }
      if (!cardNumber.trim() || cardNumber.replace(/\s/g, "").length < 12) {
        setMessage("Please enter a valid card number.");
        return false;
      }
      if (!expiryDate.trim()) {
        setMessage("Please enter the card expiry date.");
        return false;
      }
      if (!cvv.trim() || cvv.length < 3) {
        setMessage("Please enter a valid CVV.");
        return false;
      }
    }

    if (paymentMethod === "transfer") {
      if (!bankName.trim()) {
        setMessage("Please enter the bank name.");
        return false;
      }
      if (!accountName.trim()) {
        setMessage("Please enter the account holder name.");
        return false;
      }
      if (!transferReference.trim()) {
        setMessage("Please enter the transfer reference number.");
        return false;
      }
    }

    return true;
  }

  async function handlePayNow() {
    if (!selectedPlan) {
      setMessage("Selected plan not found.");
      return;
    }

    if (!validatePaymentDetails()) {
      return;
    }

    setPaying(true);
    setMessage("");

    try {
      const subscribeRes = await membershipApi.subscribe(
        selectedPlan.id,
        paymentMethod
      );
      const membership = subscribeRes.data;

      await membershipApi.processPayment(
        membership.id,
        Number(selectedPlan.price),
        paymentMethod
      );

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
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Enter cardholder name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
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
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter bank name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Enter account holder name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Transfer Reference Number
                    </label>
                    <input
                      type="text"
                      value={transferReference}
                      onChange={(e) => setTransferReference(e.target.value)}
                      placeholder="Enter transfer reference"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Cash payment selected. Please proceed to the counter/front desk to complete payment.
                  This transaction will still be recorded in the system as a mock payment for demo purposes.
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={handlePayNow} disabled={paying}>
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

        {payments.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-500">No payments found.</p>
          </div>
        ) : (
          payments.map((payment) => (
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
                    Date: {new Date(payment.paid_at).toLocaleDateString()}
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
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
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