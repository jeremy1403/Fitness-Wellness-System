"use client";

import { useEffect, useState } from "react";
import { membershipApi, Payment } from "@/lib/api/membership.api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      const res = await membershipApi.myPayments();
      setPayments(res.data);
    } catch (err) {
      setMessage("Failed to load payment history.");
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Payment History
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View all your past payments and receipts.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-500">No payments found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {payments.map((payment) => (
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
          ))}
        </div>
      )}
    </div>
  );
}