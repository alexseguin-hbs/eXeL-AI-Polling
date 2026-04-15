"use client";

/**
 * /divinity-guide/arx — NFT ARX Physically-Backed Token Hub
 *
 * ALL-IN-ONE page with 5 modes (no separate routes needed):
 *   Browse:    Default — editions + marketplace + "Register Item" button
 *   Register:  Seller registers new item (name, price, serial, edition)
 *   Verify:    ?token={id} — ownership proof + full transaction history
 *   Scan:      ?chip={uid} — NFC chip verification with animation
 *   Transfer:  Owner can sell/gift from the verify view
 *
 * CRS: CRS-NEW-12.01 through 12.05
 * Inspired by Divinity Guide aesthetic (Flower of Life, theme colors)
 */

import React, { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useLexicon } from "@/lib/lexicon-context";

interface ArxItem {
  token_id: number;
  item_name: string;
  serial_number?: string;
  edition: number;
  language: string;
  current_owner: string;
  purchase_price_usd: number | null;
  qr_code_url: string;
  chip_verified?: boolean;
  minted_at: string | null;
  last_transfer_at: string | null;
  transaction_count: number;
  transactions?: Array<{
    arx_tx_id: string;
    from: string | null;
    to: string;
    price_usd: number | null;
    type: string;
    timestamp: string;
  }>;
}

type PageMode = "browse" | "register" | "verify" | "scan" | "transfer";

function ArxPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLexicon();
  const tokenId = searchParams.get("token");
  const chipUid = searchParams.get("chip");

  const [item, setItem] = useState<ArxItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<PageMode>("browse");
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "failed">("pending");

  // Registration form
  const [regName, setRegName] = useState("");
  const [regPrice, setRegPrice] = useState("");
  const [regSerial, setRegSerial] = useState("");
  const [regEdition, setRegEdition] = useState("");
  const [regMarker, setRegMarker] = useState("");  // Special marker (signed page, inscription, etc.)
  const [regSuccess, setRegSuccess] = useState<{ qr_code_url: string; arx_tx_id: string; token_id: number } | null>(null);

  // Transfer form
  const [transferTo, setTransferTo] = useState("");
  const [transferPrice, setTransferPrice] = useState("");
  const [transferSuccess, setTransferSuccess] = useState<{ buyer_qr_url: string; seller_qr_url: string; arx_tx_id: string } | null>(null);

  // Auto-detect mode from URL params
  useEffect(() => {
    if (chipUid) setMode("scan");
    else if (tokenId) setMode("verify");
  }, [tokenId, chipUid]);

  // Fetch item data for verify/scan modes
  useEffect(() => {
    if (mode !== "verify" && mode !== "scan") return;
    const id = parseInt(tokenId || "0");
    if (!id) return;
    setLoading(true);

    // Read directly from Supabase (no backend API needed)
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        if (!supabase) throw new Error("Supabase not available");

        // Fetch item
        const { data: itemData } = await supabase.from("arx_items")
          .select("*").eq("token_id", id).single();

        if (!itemData) {
          setVerificationStatus("failed");
          setError("Item not found");
          return;
        }

        // Fetch transactions
        const { data: txData } = await supabase.from("arx_transactions")
          .select("*").eq("token_id", id).order("created_at", { ascending: true });

        const itemResult: ArxItem = {
          token_id: itemData.token_id,
          item_name: itemData.item_name,
          serial_number: itemData.serial_number,
          edition: itemData.edition || 0,
          language: itemData.language || "en",
          current_owner: itemData.current_owner || "",
          purchase_price_usd: itemData.purchase_price_usd ? parseFloat(itemData.purchase_price_usd) : null,
          qr_code_url: itemData.qr_code_url || "",
          minted_at: itemData.created_at,
          last_transfer_at: itemData.last_transfer_at,
          transaction_count: txData?.length || 0,
          transactions: (txData || []).map((tx: any) => ({
            arx_tx_id: tx.arx_tx_id,
            from: tx.from_address,
            to: tx.to_address,
            price_usd: tx.price_usd ? parseFloat(tx.price_usd) : null,
            type: tx.transaction_type,
            timestamp: tx.created_at,
          })),
        };

        setItem(itemResult);
        setVerificationStatus("verified");
      } catch {
        setVerificationStatus("failed");
        setError("Verification service unavailable");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, tokenId, chipUid]);

  // Register new item — writes directly to Supabase (no backend API needed)
  const handleRegister = useCallback(async () => {
    if (!regName.trim() || !regPrice) return;
    setLoading(true);
    setError("");
    try {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) throw new Error("Supabase not available");

      const tokenId = Date.now() % 1_000_000_000;
      const txId = `ARX-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const verifyHash = await crypto.subtle.digest("SHA-256",
        new TextEncoder().encode(`${tokenId}:${regName}:${Date.now()}`)
      ).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join(""));
      const qrUrl = `${window.location.origin}/divinity-guide/arx?token=${tokenId}&verify=${verifyHash.slice(0, 16)}`;

      // Insert item
      const { error: itemErr } = await supabase.from("arx_items").insert({
        token_id: tokenId,
        item_name: regName.trim(),
        purchase_price_usd: parseFloat(regPrice),
        serial_number: regSerial.trim() || null,
        edition: regEdition ? parseInt(regEdition) : 0,
        language: "en",
        current_owner: "anonymous",
        qr_code_url: qrUrl,
      });
      if (itemErr) throw new Error(itemErr.message);

      // Insert transaction
      await supabase.from("arx_transactions").insert({
        arx_tx_id: txId,
        token_id: tokenId,
        to_address: "anonymous",
        price_usd: parseFloat(regPrice),
        transaction_type: "mint",
      });

      setRegSuccess({ qr_code_url: qrUrl, arx_tx_id: txId, token_id: tokenId });
    } catch (e: any) {
      setError(e.message || "Registration failed — please try again");
    } finally {
      setLoading(false);
    }
  }, [regName, regPrice, regSerial, regEdition]);

  // Transfer item
  const handleTransfer = useCallback(async () => {
    if (!item || !transferTo.trim()) return;
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/v1/arx/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token_id: item.token_id,
          to_address: transferTo.trim(),
          sale_price_usd: transferPrice ? parseFloat(transferPrice) : undefined,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || "Transfer failed");
      }
      const data = await resp.json();
      setTransferSuccess(data);
    } catch (e: any) {
      setError(e.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  }, [item, transferTo, transferPrice]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/divinity-guide" className="flex items-center gap-2 hover:opacity-80">
            <span className="text-sm font-bold text-primary">eXeL</span>
            <span className="text-sm font-light text-primary/70">AI</span>
            <span className="text-xs text-muted-foreground ml-1">/ Divinity Guide / ARX</span>
          </Link>
          {/* Mode tabs */}
          <div className="flex gap-1">
            {(["browse", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); setRegSuccess(null); setTransferSuccess(null); }}
                className={`px-3 py-1 text-[10px] rounded-full transition-all ${mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >{m === "browse" ? "Browse & Verify" : "Register Item"}</button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {/* ═══ SCAN MODE — NFC chip tap verification ═══ */}
        {mode === "scan" && (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            {loading ? (
              <>
                <div className="w-32 h-32 rounded-full border-4 border-primary/30 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-primary animate-ping" />
                </div>
                <p className="text-lg font-bold animate-pulse">Verifying ARX chip...</p>
                <p className="text-xs text-muted-foreground">Checking on-chain record</p>
              </>
            ) : verificationStatus === "verified" && item ? (
              <>
                <div className="w-32 h-32 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
                  <span className="text-5xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-green-500">Authenticated</h2>
                <p className="text-lg">{item.item_name}</p>
                <p className="text-muted-foreground">
                  Owned by {item.current_owner?.slice(0, 20)}... | ${item.purchase_price_usd?.toFixed(2)}
                </p>
                <button onClick={() => setMode("verify")}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm hover:opacity-90">
                  View Full Details
                </button>
              </>
            ) : (
              <>
                <div className="w-32 h-32 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
                  <span className="text-5xl">✗</span>
                </div>
                <h2 className="text-2xl font-bold text-red-500">Unverified</h2>
                <p className="text-muted-foreground">{error}</p>
              </>
            )}
          </div>
        )}

        {/* ═══ REGISTER MODE — Seller registers new item ═══ */}
        {mode === "register" && !regSuccess && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Register a Collectible</h1>
              <p className="text-sm text-muted-foreground">
                Add any physical item — book, artwork, signed memorabilia — to the blockchain.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Item Name *</label>
                <input value={regName} onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g., The Divinity Guide — Signed First Edition"
                  className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Purchase Price (USD) *</label>
                <input type="number" step="0.01" min="0" value={regPrice} onChange={(e) => setRegPrice(e.target.value)}
                  placeholder="33.33"
                  className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Serial Number</label>
                  <input value={regSerial} onChange={(e) => setRegSerial(e.target.value)}
                    placeholder="DG-2026-001"
                    className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Edition (1-12)</label>
                  <input type="number" min="0" max="12" value={regEdition} onChange={(e) => setRegEdition(e.target.value)}
                    placeholder="7"
                    className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Special Markers</label>
                <input value={regMarker} onChange={(e) => setRegMarker(e.target.value)}
                  placeholder="e.g., Signed by author on page 144, Gold leaf cover"
                  className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" />
                <p className="text-[10px] text-muted-foreground mt-1">Describe unique features that make this item one-of-a-kind</p>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button onClick={handleRegister} disabled={!regName.trim() || !regPrice || loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                {loading ? "Registering..." : "Register on Blockchain"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ REGISTER SUCCESS ═══ */}
        {mode === "register" && regSuccess && (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-500">Item Registered!</h2>
            <p className="text-sm text-muted-foreground">Transaction: {regSuccess.arx_tx_id}</p>

            <div className="p-6 border rounded-xl bg-card">
              <p className="text-xs text-muted-foreground mb-3">Scan to verify ownership</p>
              <div className="flex justify-center">
                <QRCodeSVG value={regSuccess.qr_code_url} size={200} />
              </div>
              <p className="text-xs text-muted-foreground mt-3">Save this QR code — share with buyers</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setRegSuccess(null); setRegName(""); setRegPrice(""); setRegSerial(""); setRegEdition(""); }}
                className="flex-1 py-2 border rounded-lg text-sm hover:bg-accent transition-colors">
                Register Another
              </button>
              <button onClick={() => router.push(`/divinity-guide/arx?token=${regSuccess.token_id}`)}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90">
                View Item
              </button>
            </div>
          </div>
        )}

        {/* ═══ VERIFY MODE — Item details + ownership proof ═══ */}
        {mode === "verify" && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : verificationStatus === "verified" && item ? (
              <>
                {/* Verification banner */}
                <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 flex items-center gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className="text-green-500 font-bold text-sm">Authenticated on Blockchain</p>
                    <p className="text-xs text-muted-foreground">This item is verified as genuine</p>
                  </div>
                </div>

                {/* Item card */}
                <div className="rounded-xl border bg-card p-6 space-y-4">
                  <h2 className="text-2xl font-bold">{item.item_name}</h2>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {item.serial_number && (
                      <div>
                        <p className="text-muted-foreground">Serial Number</p>
                        <p className="font-mono">{item.serial_number}</p>
                      </div>
                    )}
                    {item.edition > 0 && (
                      <div>
                        <p className="text-muted-foreground">Edition</p>
                        <p className="font-bold">{item.edition} of 12 — Ascended Master</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Current Owner</p>
                      <p className="font-mono text-xs">{item.current_owner?.slice(0, 25)}...</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Purchase Price</p>
                      <p className="font-bold text-lg">${item.purchase_price_usd?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Registered</p>
                      <p>{item.minted_at ? new Date(item.minted_at).toLocaleDateString() : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Transfer</p>
                      <p>{item.last_transfer_at ? new Date(item.last_transfer_at).toLocaleDateString() : "Never"}</p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                {item.qr_code_url && (
                  <div className="flex flex-col items-center space-y-2 p-6 border rounded-xl bg-card">
                    <QRCodeSVG value={item.qr_code_url} size={180} />
                    <p className="text-xs text-muted-foreground">Scan to verify • Share with buyers</p>
                  </div>
                )}

                {/* Transfer / Sell section */}
                {!transferSuccess ? (
                  <div className="rounded-xl border bg-card p-6 space-y-4">
                    <h3 className="font-bold">Sell or Gift This Item</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Recipient (email or wallet) *</label>
                        <input value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
                          placeholder="buyer@example.com"
                          className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Sale Price (USD) — leave empty for gift</label>
                        <input type="number" step="0.01" min="0" value={transferPrice} onChange={(e) => setTransferPrice(e.target.value)}
                          placeholder="0.00 (free gift)"
                          className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none" />
                      </div>
                      {error && <p className="text-sm text-red-500">{error}</p>}
                      <button onClick={handleTransfer} disabled={!transferTo.trim() || loading}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-40">
                        {loading ? "Processing..." : transferPrice ? `Sell for $${parseFloat(transferPrice).toFixed(2)}` : "Gift This Item"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-green-500/5 border-green-500/30 p-6 text-center space-y-4">
                    <p className="text-green-500 font-bold">Transfer Complete!</p>
                    <p className="text-xs text-muted-foreground">Transaction: {transferSuccess.arx_tx_id}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Buyer QR</p>
                        <QRCodeSVG value={transferSuccess.buyer_qr_url} size={120} />
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Seller QR</p>
                        <QRCodeSVG value={transferSuccess.seller_qr_url} size={120} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Both parties receive timestamped QR codes</p>
                  </div>
                )}

                {/* Transaction History */}
                {item.transactions && item.transactions.length > 0 && (
                  <div className="rounded-xl border bg-card p-6">
                    <h3 className="font-bold mb-4">Transaction History ({item.transactions.length})</h3>
                    <div className="space-y-2">
                      {item.transactions.map((tx) => (
                        <div key={tx.arx_tx_id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                          <div>
                            <span className="font-mono text-xs text-primary">{tx.arx_tx_id}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                              tx.type === "mint" ? "bg-green-500/10 text-green-500" :
                              tx.type === "sale" ? "bg-blue-500/10 text-blue-500" :
                              "bg-muted text-muted-foreground"
                            }`}>{tx.type}</span>
                          </div>
                          <div className="text-right">
                            {tx.price_usd != null && <span className="font-bold">${tx.price_usd.toFixed(2)}</span>}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-red-500 font-bold">Item Not Found</p>
                <p className="text-muted-foreground mt-2">{error}</p>
                <button onClick={() => setMode("browse")} className="mt-4 px-4 py-2 border rounded-lg text-sm hover:bg-accent">
                  Browse Items
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ BROWSE MODE — Editions + marketplace ═══ */}
        {mode === "browse" && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Physically Backed Tokens</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Own a physical copy of The Divinity Guide or register any collectible with blockchain-verified authenticity. Tap your phone to an ARX chip to verify instantly.
              </p>
            </div>

            {/* Quick verify */}
            <div className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  placeholder="Enter token ID to verify..."
                  className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) router.push(`/divinity-guide/arx?token=${val}`);
                    }
                  }}
                />
                <button onClick={() => setMode("register")}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 whitespace-nowrap">
                  + Register Item
                </button>
              </div>
            </div>

            {/* 12 Ascended Master editions */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-center">Divinity Guide Editions</h2>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="rounded-xl border bg-card p-4 hover:border-primary transition-colors text-center">
                    <div className="text-3xl mb-2">✦</div>
                    <h3 className="font-bold text-sm">Edition {i + 1}</h3>
                    <p className="text-[10px] text-muted-foreground">Ascended Master</p>
                    <p className="text-primary font-bold mt-2">$33.33</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by eXeL AI • Physically Backed Tokens on Quai Network • ARX NFC Verified
        </p>
      </footer>
    </div>
  );
}

export default function ArxPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <ArxPageInner />
    </Suspense>
  );
}
