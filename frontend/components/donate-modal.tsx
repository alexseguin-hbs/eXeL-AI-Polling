"use client";

/**
 * Universal donate popup — "anyone can donate as they desire, anytime."
 *
 * A fixed-overlay modal (never embedded inline in page content) that anyone — logged in or
 * not — can open from the persistent navbar Donate button. Uses the anonymous
 * `/payments/divinity-donate` Checkout path (no auth, no session) and redirects to Stripe's
 * hosted page. Presets include $1.11; custom amount honored (min $0.50).
 */
import { useState } from "react";
import { Heart, X } from "lucide-react";
import { api } from "@/lib/api";
import { useLexicon } from "@/lib/lexicon-context";

const PRESETS_CENTS = [111, 333, 999, 2525]; // $1.11 · $3.33 · $9.99 · $25.25

export function DonateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLexicon();
  const [amount, setAmount] = useState(333);
  const [amountStr, setAmountStr] = useState("3.33"); // raw editable text (can be empty)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoDone, setDemoDone] = useState(false);

  if (!open) return null;

  const pickPreset = (cents: number) => {
    setAmount(cents);
    setAmountStr((cents / 100).toFixed(2));
    setError("");
  };

  const onAmountChange = (v: string) => {
    // Allow free typing incl. empty/partial ("", "1", "1."); only digits + one dot.
    if (v !== "" && !/^\d*\.?\d{0,2}$/.test(v)) return;
    setAmountStr(v);
    const n = parseFloat(v);
    setAmount(Number.isFinite(n) ? Math.round(n * 100) : 0);
    setError("");
  };

  const handleDonate = async () => {
    if (amount < 50) {
      setError(t("cube8.donation.minimum"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const here = typeof window !== "undefined" ? window.location.href : "";
      const result = await api.post<{ checkout_url?: string }>("/payments/divinity-donate", {
        amount_cents: amount,
        label: "eXeL AI Polling — Community Contribution",
        description: "Support the SoI Governance platform",
        success_url: here,
        cancel_url: here,
      });
      if (result?.checkout_url) {
        window.location.href = result.checkout_url; // real Stripe hosted Checkout
      } else {
        // Demo mode (no backend/Stripe) — acknowledge instead of erroring.
        setDemoDone(true);
        setLoading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("cube8.donate.title")}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label={t("cube8.donate.close")}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-1 flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("cube8.donate.title")}</h2>
        </div>

        {demoDone ? (
          <div className="py-4">
            <p className="text-sm text-foreground">{t("cube8.donate.demo_thanks")}</p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg border border-input px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              {t("cube8.donate.close")}
            </button>
          </div>
        ) : (
        <>
        <p className="mb-4 text-sm text-muted-foreground">{t("cube8.donate.subtitle")}</p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {PRESETS_CENTS.map((cents) => (
            <button
              key={cents}
              onClick={() => pickPreset(cents)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition ${
                amount === cents
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input hover:bg-accent"
              }`}
            >
              ${(cents / 100).toFixed(2)}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs text-muted-foreground">{t("cube8.donate.custom")}</label>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm">$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amountStr}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm tabular-nums"
          />
        </div>

        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        <button
          onClick={handleDonate}
          disabled={loading || amount < 50}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : `${t("cube8.donate.continue")} · $${(amount / 100).toFixed(2)}`}
        </button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">{t("cube8.donate.secure_note")}</p>
        </>
        )}
      </div>
    </div>
  );
}
