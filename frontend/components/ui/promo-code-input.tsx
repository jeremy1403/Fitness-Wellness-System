"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Ticket, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { promoValidateApi } from "@/lib/api/promo.api";

type PromoCodeInputProps = {
  userId?: number;
  onApplySuccess?: (discountType: string, discountAmount: number) => void;
};

export function PromoCodeInput({ userId, onApplySuccess }: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ message: string; isRateLimit: boolean } | null>(null);
  const [successDetails, setSuccessDetails] = useState<{ discount_type: string; discount_amount: number } | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;

    setIsSubmitting(true);
    setErrorDetails(null);
    setSuccessDetails(null);

    try {
      const result = await promoValidateApi.validate(code, userId);
      setSuccessDetails(result.details);
      if (onApplySuccess) onApplySuccess(result.details.discount_type, result.details.discount_amount);
    } catch (err: any) {
      // Handle the Rate Limiting dynamically (Status 429) implemented by our robust Proxy Pattern!
      if (err?.status === 429) {
        setErrorDetails({
          message: "Too many attempts! Security Rate-Limiter triggered. Please wait before trying again.",
          isRateLimit: true,
        });
      } else if (err?.status === 400 || err?.message) {
        setErrorDetails({
          message: err?.errors?.code?.[0] || err?.message || "Invalid Promo Code.",
          isRateLimit: false,
        });
      } else {
        setErrorDetails({
          message: "Failed to apply code. Please try again later.",
          isRateLimit: false,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-3 p-4 bg-slate-50/50 backdrop-blur rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
      <div className="space-y-1">
        <Label htmlFor="promo" className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Ticket className="w-3.5 h-3.5" /> Apply Discount
        </Label>
        <div className="flex gap-2 items-center">
          <Input
            id="promo"
            placeholder="e.g. SUMMER10"
            value={code}
            onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setErrorDetails(null); 
                setSuccessDetails(null);
            }}
            className="rounded-xl border-slate-200 focus-visible:ring-teal-500 h-11"
            disabled={isSubmitting || successDetails !== null}
          />
          <Button 
            onClick={handleApply} 
            disabled={!code || isSubmitting || successDetails !== null}
            className="h-11 rounded-xl bg-slate-900 hover:bg-teal-600 text-white transition-colors px-6"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
          </Button>
        </div>
      </div>

      {/** Feedback State: Success */}
      {successDetails && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 animate-in fade-in zoom-in duration-300 font-medium p-2 bg-emerald-50 rounded-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>Valid! Disount applied: {successDetails.discount_type === 'percentage' ? `${successDetails.discount_amount}%` : `$${successDetails.discount_amount}`}</span>
        </div>
      )}

      {/** Feedback State: Error / Rate Limiting */}
      {errorDetails && (
        <div className={`flex items-start gap-2 text-sm animate-in slide-in-from-top-2 duration-200 p-2.5 rounded-lg ${errorDetails.isRateLimit ? 'text-amber-700 bg-amber-50 border-amber-100 border' : 'text-rose-600 bg-rose-50'}`}>
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="font-medium leading-tight">{errorDetails.message}</span>
        </div>
      )}
    </div>
  );
}
