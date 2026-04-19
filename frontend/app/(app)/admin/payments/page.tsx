"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, Search } from "lucide-react";
import { membershipApi, Payment } from "@/lib/api/membership.api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const totalAmount = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount),
    0
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await membershipApi.getAllPayments();
      setPayments(res.data);
    } catch {
      setLoadError("Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleMarkAsPaid(paymentId: number) {
    setActionLoading(paymentId);
    setActionError(null);

    try {
      const res = await membershipApi.markPaymentAsPaid(paymentId);
      const updatedPayment = res.data;

      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === paymentId ? updatedPayment : payment
        )
      );
    } catch (err: any) {
      setActionError(
        err?.data?.message ||
          err?.message ||
          "Unable to mark payment as paid."
      );
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = payments.filter((p) => {
    const term = search.toLowerCase();
    return (
      (p.reference_no ?? "").toLowerCase().includes(term) ||
      (p.method ?? "").toLowerCase().includes(term) ||
      (p.status ?? "").toLowerCase().includes(term) ||
      (p.membership?.plan?.name ?? "").toLowerCase().includes(term) ||
      (p.user?.name ?? "").toLowerCase().includes(term) ||
      (p.user?.email ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage all payment transactions.
        </p>
      </div>

      {(loadError || actionError) && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{actionError ?? loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={loading}
            className="border-red-200 bg-white text-red-700 hover:bg-red-100"
          >
            {loading ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Payments</p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="text-2xl font-semibold text-slate-900">
                  {payments.length}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-slate-100 p-2.5 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="text-2xl font-semibold text-slate-900">
                  RM {totalAmount.toFixed(2)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-slate-100 p-2.5 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Paid</p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="text-2xl font-semibold text-slate-900">
                  {payments.filter((p) => p.status === "paid").length}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by reference, user, email, plan, method, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </div>

          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              {search ? "No payments match your search." : "No payments found."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((payment) => {
                  const isPendingCash =
                    payment.method === "cash" && payment.status === "pending";

                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium text-slate-900">
                        {payment.reference_no}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {payment.user?.name ?? "-"}
                          </span>
                          <span className="text-sm text-slate-500">
                            {payment.user?.email ?? "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {payment.membership?.plan?.name ?? "-"}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        RM {payment.amount}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {payment.method}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            payment.status === "paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : payment.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(payment.paid_at)}
                      </TableCell>
                      <TableCell>
                        {isPendingCash ? (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(payment.id)}
                            disabled={actionLoading === payment.id}
                          >
                            {actionLoading === payment.id
                              ? "Updating..."
                              : "Mark as Paid"}
                          </Button>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}