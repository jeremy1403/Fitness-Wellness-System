"use client";

import { PromoCodeInput } from "@/components/ui/promo-code-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export default function CheckoutPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">Checkout</h1>
          <p className="text-muted-foreground mt-2">Complete your mock purchase details below.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card className="border-none shadow-xl shadow-teal-900/5 bg-white/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal-600" /> Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-lg font-medium p-4 border rounded-xl border-slate-100 bg-slate-50">
                <span>Premium Membership (1 Month)</span>
                <span>$99.00</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1 space-y-4">
           {/** The requested Promo Code Component rendering below */}
          <PromoCodeInput userId={1} />
        </div>
      </div>
    </div>
  );
}
