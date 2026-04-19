"use client";

import { useState, useEffect } from "react";
import { adminPromoApi, type PromoCode } from "@/lib/api/promo.api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Edit, Plus, Ticket } from "lucide-react";

export default function PromoCodesPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPromos = async () => {
    try {
      setIsLoading(true);
      const data = await adminPromoApi.getAll();
      setPromos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      await adminPromoApi.delete(id);
      fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">Promo Codes & Campaigns</h1>
          <p className="text-muted-foreground mt-2">Manage discount codes, view usage, and track active promos.</p>
        </div>
        <Button onClick={() => alert("Open create dialog modal (not fully implemented in this MVP snippet!)")} className="gap-2 shrink-0 bg-teal-600 hover:bg-teal-700 transition-all text-white">
          <Plus className="w-4 h-4" />
          Create Promo
        </Button>
      </div>

      <Card className="border-none shadow-xl shadow-teal-900/5 bg-white/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-teal-600" /> Active Campaigns
          </CardTitle>
          <CardDescription>All valid and inactive discount rules enforcing proxy validation limits.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex flex-col space-y-3">
              <Skeleton className="h-[40px] w-full rounded-xl" />
              <Skeleton className="h-[40px] w-full rounded-xl" />
              <Skeleton className="h-[40px] w-full rounded-xl" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage Limit</TableHead>
                    <TableHead>Times Used</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No promo codes found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    promos.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell className="font-mono font-semibold tracking-wide">{promo.code}</TableCell>
                        <TableCell>
                          {promo.discount_type === 'percentage' 
                            ? `${promo.discount_amount}%` 
                            : `$${promo.discount_amount}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={promo.is_active ? "default" : "destructive"} className={promo.is_active ? "bg-teal-500 hover:bg-teal-600" : ""}>
                            {promo.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{promo.max_uses ?? 'Unlimited'}</TableCell>
                        <TableCell className="font-semibold text-slate-700">{promo.times_used}</TableCell>
                        <TableCell>{promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : 'Never'}</TableCell>
                        <TableCell className="text-right space-x-2 flex justify-end">
                          <Button variant="ghost" size="icon" className="hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDelete(promo.id)} variant="ghost" size="icon" className="hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
