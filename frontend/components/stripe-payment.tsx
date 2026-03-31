"use client";

import { useCallback, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { api } from "@/lib/api";
import { STRIPE_PUBLISHABLE_KEY, MODERATOR_MIN_FEE_CENTS } from "@/lib/constants";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentProps {
  sessionId: string;
  shortCode: string;
  pricingTier: "free" | "moderator_paid" | "cost_split";
  participantId?: string;
  isModerator?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CostEstimate {
  estimated_cost_cents: number;
  user_count: number;
  response_count: number;
}

// ---------------------------------------------------------------------------
// Moderator Checkout — redirects to Stripe Checkout page
// ---------------------------------------------------------------------------

export function ModeratorCheckout({
  sessionId,
  shortCode,
  onSuccess,
  onCancel,
}: PaymentProps) {
  const [amount, setAmount] = useState(MODERATOR_MIN_FEE_CENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.post<{ checkout_url: string }>(
        "/payments/moderator-checkout",
        {
          session_id: sessionId,
          amount_cents: Math.max(amount, MODERATOR_MIN_FEE_CENTS),
        }
      );
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
      <h3 className="font-semibold text-lg">Session Payment</h3>
      <p className="text-sm text-muted-foreground">
        Minimum $11.11 USD to create this session. Your participants join free.
      </p>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">$</span>
        <input
          type="number"
          min={11.11}
          step={0.01}
          value={(amount / 100).toFixed(2)}
          onChange={(e) => {
            const cents = Math.round(parseFloat(e.target.value || "0") * 100);
            setAmount(Math.max(cents, MODERATOR_MIN_FEE_CENTS));
          }}
          className="w-28 px-3 py-2 rounded-md border border-input bg-background text-sm"
        />
        <span className="text-sm text-muted-foreground">USD</span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Redirecting..." : `Pay $${(amount / 100).toFixed(2)}`}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-input text-sm hover:bg-accent"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cost Split — inline Payment Element
// ---------------------------------------------------------------------------

function CostSplitForm({
  onSuccess,
  amountCents,
}: {
  onSuccess?: () => void;
  amountCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setLoading(false);
    } else {
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Processing..." : `Pay $${(amountCents / 100).toFixed(2)}`}
      </button>
    </form>
  );
}

export function CostSplitPayment({
  sessionId,
  participantId,
  isModerator = false,
  onSuccess,
}: PaymentProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [amountCents, setAmountCents] = useState(0);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch estimate first
        const est = await api.get<CostEstimate>(
          `/sessions/${sessionId}/cost-estimate`
        );
        setEstimate(est);

        // Create payment intent
        const result = await api.post<{
          client_secret: string;
          amount_cents: number;
        }>("/payments/cost-split", {
          session_id: sessionId,
          participant_id: participantId,
          is_moderator: isModerator,
        });
        setClientSecret(result.client_secret);
        setAmountCents(result.amount_cents);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load payment");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [sessionId, participantId, isModerator]);

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading payment...
      </div>
    );
  }
  if (error) {
    return <div className="p-4 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
      <h3 className="font-semibold text-lg">
        {isModerator ? "Moderator Share (50%)" : "Your Share"}
      </h3>

      {estimate && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Estimated session cost: ${(estimate.estimated_cost_cents / 100).toFixed(2)}</p>
          <p>{estimate.user_count} participants, {estimate.response_count} responses</p>
          {!isModerator && (
            <p>Your share: 50% / {Math.max(estimate.user_count - 1, 1)} users</p>
          )}
        </div>
      )}

      {clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: "night" } }}
        >
          <CostSplitForm onSuccess={onSuccess} amountCents={amountCents} />
        </Elements>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donation Modal — shown after results delivery
// ---------------------------------------------------------------------------

export function DonationPrompt({
  sessionId,
  participantId,
  shortCode,
  onSuccess,
  onDismiss,
}: PaymentProps & { onDismiss?: () => void }) {
  const [amount, setAmount] = useState(500); // $5.00 default
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);

  useEffect(() => {
    api
      .get<CostEstimate>(`/sessions/${sessionId}/cost-estimate`)
      .then(setEstimate)
      .catch(() => {});
  }, [sessionId]);

  const handleDonate = async () => {
    if (amount < 50) {
      setError("Minimum donation is $0.50");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api.post<{ client_secret: string }>(
        "/payments/donate",
        {
          session_id: sessionId,
          participant_id: participantId || null,
          amount_cents: amount,
        }
      );
      setClientSecret(result.client_secret);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    }
  };

  if (clientSecret) {
    return (
      <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold text-lg">Complete Your Donation</h3>
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: "night" } }}
        >
          <CostSplitForm onSuccess={onSuccess} amountCents={amount} />
        </Elements>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
      <h3 className="font-semibold text-lg">Support This Session</h3>
      <p className="text-sm text-muted-foreground">
        Your results are ready! If this session was valuable, consider a
        donation to support the platform.
      </p>

      {estimate && (
        <p className="text-xs text-muted-foreground">
          Estimated session cost: ${(estimate.estimated_cost_cents / 100).toFixed(2)}
        </p>
      )}

      <div className="flex gap-2">
        {[200, 500, 1111, 2500].map((cents) => (
          <button
            key={cents}
            onClick={() => setAmount(cents)}
            className={`px-3 py-1.5 rounded-md border text-sm ${
              amount === cents
                ? "border-primary bg-primary/10 text-primary"
                : "border-input hover:bg-accent"
            }`}
          >
            ${(cents / 100).toFixed(2)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">$</span>
        <input
          type="number"
          min={0.5}
          step={0.5}
          value={(amount / 100).toFixed(2)}
          onChange={(e) => setAmount(Math.round(parseFloat(e.target.value || "0") * 100))}
          className="w-24 px-3 py-2 rounded-md border border-input bg-background text-sm"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleDonate}
          disabled={loading || amount < 50}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Loading..." : `Donate $${(amount / 100).toFixed(2)}`}
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-md border border-input text-sm hover:bg-accent"
          >
            Maybe Later
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pricing Tier Selector — shown during session creation
// ---------------------------------------------------------------------------

interface PricingTierSelectorProps {
  value: "free" | "moderator_paid" | "cost_split";
  onChange: (tier: "free" | "moderator_paid" | "cost_split") => void;
  feeAmountCents: number;
  onFeeChange: (cents: number) => void;
}

export function PricingTierSelector({
  value,
  onChange,
  feeAmountCents,
  onFeeChange,
}: PricingTierSelectorProps) {
  const tiers = [
    {
      id: "free" as const,
      name: "Free",
      price: "$0",
      desc: "Up to 19 participants",
      detail: "Donation prompt after results",
    },
    {
      id: "moderator_paid" as const,
      name: "Moderator Paid",
      price: "$11.11+",
      desc: "Unlimited participants",
      detail: "You pay upfront, participants join free",
    },
    {
      id: "cost_split" as const,
      name: "Cost Split",
      price: "50/50",
      desc: "Unlimited participants",
      detail: "50% you + 50% split among users",
    },
  ];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Pricing Tier</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tiers.map((tier) => (
          <button
            key={tier.id}
            type="button"
            onClick={() => onChange(tier.id)}
            className={`p-3 rounded-lg border text-left transition-all ${
              value === tier.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-input hover:border-primary/50"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="font-medium text-sm">{tier.name}</span>
              <span className="text-xs font-mono text-primary">{tier.price}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tier.desc}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">{tier.detail}</p>
          </button>
        ))}
      </div>

      {value === "moderator_paid" && (
        <div className="flex items-center gap-2 mt-2">
          <label className="text-sm text-muted-foreground">Amount: $</label>
          <input
            type="number"
            min={11.11}
            step={0.01}
            value={(feeAmountCents / 100).toFixed(2)}
            onChange={(e) => {
              const cents = Math.round(parseFloat(e.target.value || "0") * 100);
              onFeeChange(Math.max(cents, MODERATOR_MIN_FEE_CENTS));
            }}
            className="w-28 px-3 py-1.5 rounded-md border border-input bg-background text-sm"
          />
          <span className="text-xs text-muted-foreground">(min $11.11)</span>
        </div>
      )}
    </div>
  );
}
