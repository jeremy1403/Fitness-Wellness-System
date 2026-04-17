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

  const totalAmount = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount),
    0
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await membershipApi.myPayments();
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

  const filtered = payments.filter(
    (p) =>
      p.reference_no.toLowerCase().includes(search.toLowerCase()) ||
      p.method.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage all payment transactions.
        </p>
      </div>

      {/* Error */}
      {loadError && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{loadError}</p>
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

      {/* Stats */}
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

      {/* Search + Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by reference or method..."
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
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium text-slate-900">
                      {payment.reference_no}
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
                            : "bg-red-50 text-red-700"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(payment.paid_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}