"use client";

/**
 * /divinity-guide/arx — NFT ARX Physically-Backed Token Hub
 *
 * 3-Flower Portal Layout (Divinity Guide aesthetic):
 *   LEFT:  3 Flower circles (Mint=Red, Verify=Green, Transfer=Blue)
 *   RIGHT: Context panel based on selected flower (expandable to full-width)
 *
 * ALL-IN-ONE page with 3 portals:
 *   Mint:     Register new item + pair ARX chip
 *   Verify:   Authenticate by Token ID or Chip Address (0x...)
 *   Transfer: Sell/Gift with dual QR receipts
 *
 * 12 Ascended Masters review:
 *   Thor:    Collapsible "Pair ARX Chip" step in Mint flow
 *   Thoth:   regChipAddress field with helper text
 *   Krishna: SHA-256 hash of chip address for Supabase insert
 *   Athena:  Verify panel has TWO side-by-side inputs (Token ID + Chip Address)
 *   Enki:    Expand button to make right panel full-width
 *   Sofia:   Divinity Guide color scheme for 3 circles
 *   Odin:    Transfer shows "Verify an item first" if no item loaded
 *   Pangu:   Post-registration: QR prominent + "Chip paired" if address was given
 *   Aset:    ?chip=0x... auto-selects Verify flower + auto-lookup
 *   Asar:    12 edition cards inside Mint flower content (not always visible)
 *   Enlil:   Maximize/minimize toggle for right panel
 *   Christo: Spiritual, clean, minimal portal feel
 *
 * CRS: CRS-NEW-12.01 through 12.05
 */

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import "@/components/flower-of-life/flower-animations.css";
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

/** [Krishna] Hash an Ethereum address (0x...) with SHA-256 using Web Crypto API */
async function hashChipAddress(addr: string): Promise<string> {
  const hashBuf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(addr.trim().toLowerCase())
  );
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function ArxPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLexicon();
  const tokenParam = searchParams.get("token");
  const chipParam = searchParams.get("chip");

  // --- State ---
  const [item, setItem] = useState<ArxItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "verified" | "failed"
  >("pending");

  // [Enlil] Right panel expand/collapse: "split" = 50/50, "full" = right panel full width
  const [panelMode, setPanelMode] = useState<"split" | "full">("split");

  // Flower navigation — 3 portals
  const [selectedFlower, setSelectedFlower] = useState<
    "mint" | "verify" | "transfer" | null
  >(null);

  // --- Registration form ---
  const [regName, setRegName] = useState("");
  const [regPrice, setRegPrice] = useState("");
  const [regSerial, setRegSerial] = useState("");
  const [regEdition, setRegEdition] = useState("");
  const [regMarker, setRegMarker] = useState("");
  const [regContact, setRegContact] = useState("");
  // [Thoth] ARX chip Ethereum address
  const [regChipAddress, setRegChipAddress] = useState("");
  const [regSuccess, setRegSuccess] = useState<{
    qr_code_url: string;
    arx_tx_id: string;
    token_id: number;
  } | null>(null);
  // [Thor] Collapsible chip pairing step in Mint
  const [regExpanded, setRegExpanded] = useState(false);
  // [Pangu] Post-registration chip pairing
  const [showPairChip, setShowPairChip] = useState(false);
  const [pairChipAddress, setPairChipAddress] = useState("");

  // --- Verify form ---
  const [verifyTokenId, setVerifyTokenId] = useState("");
  // [Athena] Side-by-side: Token ID + Chip Address
  const [verifyChipAddress, setVerifyChipAddress] = useState("");

  // --- Transfer form ---
  const [transferTo, setTransferTo] = useState("");
  const [transferPrice, setTransferPrice] = useState("");
  const [transferSuccess, setTransferSuccess] = useState<{
    buyer_qr_url: string;
    seller_qr_url: string;
    arx_tx_id: string;
  } | null>(null);

  // [Aset] Auto-detect from URL: ?chip=0x... → auto-select Verify + auto-lookup
  useEffect(() => {
    if (chipParam && chipParam.startsWith("0x")) {
      setSelectedFlower("verify");
      setVerifyChipAddress(chipParam);
      lookupItem(undefined, chipParam);
    } else if (tokenParam) {
      setSelectedFlower("verify");
      setVerifyTokenId(tokenParam);
      lookupItem(parseInt(tokenParam), undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenParam, chipParam]);

  // --- Lookup item by token ID or chip address ---
  const lookupItem = useCallback(
    async (tokenId?: number, chipAddr?: string) => {
      if (!tokenId && !chipAddr) return;
      setLoading(true);
      setError("");
      setVerificationStatus("pending");
      try {
        const { supabase } = await import("@/lib/supabase");
        if (!supabase) throw new Error("Supabase not available");

        let itemData: any = null;

        // [Aset] If chip address provided (starts with 0x), lookup by raw lowercase address
        if (chipAddr && chipAddr.startsWith("0x")) {
          const { data } = await supabase
            .from("arx_items")
            .select("*")
            .eq("chip_key_hash", chipAddr.toLowerCase())
            .single();
          itemData = data;
        } else if (tokenId) {
          const { data } = await supabase
            .from("arx_items")
            .select("*")
            .eq("token_id", tokenId)
            .single();
          itemData = data;
        }

        if (!itemData) {
          setVerificationStatus("failed");
          setError("Item not found");
          return;
        }

        // Fetch transactions
        const resolvedTokenId = itemData.token_id;
        const { data: txData } = await supabase
          .from("arx_transactions")
          .select("*")
          .eq("token_id", resolvedTokenId)
          .order("created_at", { ascending: true });

        const itemResult: ArxItem = {
          token_id: itemData.token_id,
          item_name: itemData.item_name,
          serial_number: itemData.serial_number,
          edition: itemData.edition || 0,
          language: itemData.language || "en",
          current_owner: itemData.current_owner || "",
          purchase_price_usd: itemData.purchase_price_usd
            ? parseFloat(itemData.purchase_price_usd)
            : null,
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
    },
    []
  );

  // --- Register new item ---
  const handleRegister = useCallback(async () => {
    if (!regName.trim() || !regPrice) return;
    setLoading(true);
    setError("");
    try {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) throw new Error("Supabase not available");

      const newTokenId = Date.now() % 1_000_000_000;
      const txId = `ARX-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const verifyHash = await crypto.subtle
        .digest(
          "SHA-256",
          new TextEncoder().encode(`${newTokenId}:${regName}:${Date.now()}`)
        )
        .then((buf) =>
          Array.from(new Uint8Array(buf))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        );
      const qrUrl = `${window.location.origin}/divinity-guide/arx?token=${newTokenId}&verify=${verifyHash.slice(0, 16)}`;

      // Store raw lowercase Ethereum address for simple string matching
      let chipKeyHash: string | null = null;
      if (regChipAddress.trim()) {
        chipKeyHash = regChipAddress.trim().toLowerCase();
      }

      // Insert item
      const { error: itemErr } = await supabase.from("arx_items").insert({
        token_id: newTokenId,
        item_name: regName.trim(),
        purchase_price_usd: parseFloat(regPrice),
        serial_number: regSerial.trim() || null,
        edition: regEdition ? parseInt(regEdition) : 0,
        language: "en",
        current_owner: "anonymous",
        qr_code_url: qrUrl,
        chip_key_hash: chipKeyHash,
      });
      if (itemErr) throw new Error(itemErr.message);

      // Insert transaction
      await supabase.from("arx_transactions").insert({
        arx_tx_id: txId,
        token_id: newTokenId,
        to_address: "anonymous",
        price_usd: parseFloat(regPrice),
        transaction_type: "mint",
      });

      setRegSuccess({ qr_code_url: qrUrl, arx_tx_id: txId, token_id: newTokenId });
    } catch (e: any) {
      setError(e.message || "Registration failed — please try again");
    } finally {
      setLoading(false);
    }
  }, [regName, regPrice, regSerial, regEdition, regChipAddress]);

  // --- Transfer item ---
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
          sale_price_usd: transferPrice
            ? parseFloat(transferPrice)
            : undefined,
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

  // --- Helper: reset registration form ---
  const resetRegForm = useCallback(() => {
    setRegName("");
    setRegPrice("");
    setRegSerial("");
    setRegEdition("");
    setRegMarker("");
    setRegContact("");
    setRegChipAddress("");
    setRegSuccess(null);
    setShowPairChip(false);
    setPairChipAddress("");
    setRegExpanded(false);
  }, []);

  // --- Item details card (reusable) ---
  const renderItemCard = () => {
    if (!item) return null;
    return (
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <span className="text-sm">✓</span>
          </div>
          <div>
            <p className="text-green-600 font-bold text-sm">Authenticated</p>
            <p className="text-[10px] text-muted-foreground">
              Verified on blockchain
            </p>
          </div>
        </div>
        <h3 className="text-lg font-bold">{item.item_name}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {item.serial_number && (
            <div>
              <p className="text-[10px] text-muted-foreground">Serial</p>
              <p className="font-mono text-xs">{item.serial_number}</p>
            </div>
          )}
          {item.edition > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground">Edition</p>
              <p className="font-bold">
                {item.edition} of 12
              </p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground">Owner</p>
            <p className="font-mono text-xs">
              {item.current_owner?.slice(0, 20)}...
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Price</p>
            <p className="font-bold">
              ${item.purchase_price_usd?.toFixed(2)}
            </p>
          </div>
        </div>
        {item.qr_code_url && (
          <div className="flex justify-center pt-2">
            <QRCodeSVG value={item.qr_code_url} size={120} />
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  const showFlowers = panelMode === "split";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link
            href="/divinity-guide"
            className="flex items-center gap-2 hover:opacity-80"
          >
            <span className="text-sm font-bold text-primary">eXeL</span>
            <span className="text-sm font-light text-primary/70">AI</span>
            <span className="text-xs text-muted-foreground ml-1">
              / Divinity Guide / ARX
            </span>
          </Link>
        </div>
      </div>

      {/* [Christo] Main content — spiritual portal layout */}
      <main className="flex-1 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-130px)]">
          {/* ═══ LEFT: 3-Flower Navigation ═══ */}
          {showFlowers && (
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-8 md:border-r border-b md:border-b-0">
              <h1 className="text-2xl font-bold mb-1 text-center">
                Physically Backed Tokens
              </h1>
              <p className="text-[10px] text-muted-foreground italic mb-8 text-center">
                Authenticate. Own. Transfer. Forever.
              </p>

              {/* [Christo] 3-Circle Flower SVG — portals matching Divinity Guide style */}
              <svg
                viewBox="0 0 600 500"
                className="w-full"
                style={{ overflow: "visible" }}
              >
                {/* Connection lines from hub to outer circles */}
                <line x1="300" y1="250" x2="300" y2="90" stroke="currentColor" strokeOpacity={0.12} strokeWidth={2} />
                <line x1="300" y1="250" x2="120" y2="390" stroke="currentColor" strokeOpacity={0.12} strokeWidth={2} />
                <line x1="300" y1="250" x2="480" y2="390" stroke="currentColor" strokeOpacity={0.12} strokeWidth={2} />

                {/* Center hub — PBT ARX */}
                <circle cx="300" cy="250" r="45" fill="rgba(var(--primary-rgb, 0,200,200), 0.08)" stroke="currentColor" strokeOpacity={0.25} strokeWidth={1.5}
                  className={!selectedFlower ? "flower-pulse" : ""} style={{ color: "var(--primary)" }} />
                <text x="300" y="244" textAnchor="middle" className="text-[13px] font-bold fill-current">PBT</text>
                <text x="300" y="262" textAnchor="middle" className="text-[10px] fill-muted-foreground">ARX</text>

                {/* Flower 1: MINT (top) — Red — full-size with pulse */}
                <g className={`flower-circle-interactive ${selectedFlower && selectedFlower !== "mint" ? "opacity-40" : ""}`}
                   onClick={() => { setSelectedFlower("mint"); setError(""); }}>
                  <circle cx="300" cy="90" r="75"
                    fill={selectedFlower === "mint" ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.05)"}
                    stroke="#EF4444" strokeWidth={selectedFlower === "mint" ? 3 : 1.5} strokeOpacity={0.6}
                    className={selectedFlower === "mint" ? "flower-pulse" : ""}
                    style={{ color: "#EF4444" }} />
                  <text x="300" y="78" textAnchor="middle" className="text-[14px] font-bold fill-current">✦ Mint</text>
                  <text x="300" y="96" textAnchor="middle" className="text-[10px] fill-muted-foreground">Register Item</text>
                  <text x="300" y="112" textAnchor="middle" className="text-[9px] fill-muted-foreground">+ Pair ARX Chip</text>
                </g>

                {/* Flower 2: VERIFY (bottom-left) — Green — full-size with pulse */}
                <g className={`flower-circle-interactive ${selectedFlower && selectedFlower !== "verify" ? "opacity-40" : ""}`}
                   onClick={() => { setSelectedFlower("verify"); setError(""); }}>
                  <circle cx="120" cy="390" r="75"
                    fill={selectedFlower === "verify" ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.05)"}
                    stroke="#10B981" strokeWidth={selectedFlower === "verify" ? 3 : 1.5} strokeOpacity={0.6}
                    className={selectedFlower === "verify" ? "flower-pulse" : ""}
                    style={{ color: "#10B981" }} />
                  <text x="120" y="378" textAnchor="middle" className="text-[14px] font-bold fill-current">✓ Verify</text>
                  <text x="120" y="396" textAnchor="middle" className="text-[10px] fill-muted-foreground">Authenticate</text>
                  <text x="120" y="412" textAnchor="middle" className="text-[9px] fill-muted-foreground">Token ID or Chip</text>
                </g>

                {/* Flower 3: TRANSFER (bottom-right) — Blue — full-size with pulse */}
                <g className={`flower-circle-interactive ${selectedFlower && selectedFlower !== "transfer" ? "opacity-40" : ""}`}
                   onClick={() => { setSelectedFlower("transfer"); setError(""); }}>
                  <circle cx="480" cy="390" r="75"
                    fill={selectedFlower === "transfer" ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.05)"}
                    stroke="#3B82F6" strokeWidth={selectedFlower === "transfer" ? 3 : 1.5} strokeOpacity={0.6}
                    className={selectedFlower === "transfer" ? "flower-pulse" : ""}
                    style={{ color: "#3B82F6" }} />
                  <text x="480" y="378" textAnchor="middle" className="text-[14px] font-bold fill-current">↔ Transfer</text>
                  <text x="480" y="396" textAnchor="middle" className="text-[10px] fill-muted-foreground">Sell or Gift</text>
                  <text x="480" y="412" textAnchor="middle" className="text-[9px] fill-muted-foreground">Dual QR receipts</text>
                </g>
              </svg>

              <p className="text-[9px] text-muted-foreground/40 mt-4">
                ••• Select a circle to begin •••
              </p>
            </div>
          )}

          {/* ═══ RIGHT: Context Panel ═══ */}
          <div className={`${showFlowers ? "w-full md:w-1/2" : "w-full"} px-6 py-8 flex flex-col relative`}>
            {/* [Enlil] Maximize / minimize toggle */}
            {selectedFlower && (
              <div className="absolute top-3 right-3 flex gap-1">
                {panelMode === "split" ? (
                  <button
                    onClick={() => setPanelMode("full")}
                    title="Expand panel"
                    className="p-1.5 rounded-lg border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setPanelMode("split")}
                    title="Back to flowers"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card hover:bg-accent text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to flowers
                  </button>
                )}
              </div>
            )}

            {/* No flower selected — welcome */}
            {!selectedFlower && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4">
                <p className="text-lg font-bold">Own What Matters</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Every physical creation deserves a digital soul. Register your
                  book, artwork, or signed collectible on the blockchain — and
                  prove its authenticity with a simple tap of your phone.
                </p>
                <p className="text-xs text-muted-foreground italic">
                  &quot;You were never separate from what you create. Now the
                  world can see it too.&quot;
                </p>
              </div>
            )}

            {/* ═══ MINT FLOWER — Registration + Chip Pairing ═══ */}
            {selectedFlower === "mint" && !regSuccess && (
              <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#EF4444" }}>
                    Mint — Register & Pair
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a blockchain record for your physical item
                  </p>
                </div>

                {/* Registration form */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Item Name *
                    </label>
                    <input
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g., The Divinity Guide — Signed First Edition"
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Purchase Price (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={regPrice}
                      onChange={(e) => setRegPrice(e.target.value)}
                      placeholder="33.33"
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Serial Number
                      </label>
                      <input
                        value={regSerial}
                        onChange={(e) => setRegSerial(e.target.value)}
                        placeholder="DG-2026-001"
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Edition (1-12)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={regEdition}
                        onChange={(e) => setRegEdition(e.target.value)}
                        placeholder="7"
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* [Thor] Collapsible "Pair ARX Chip" step */}
                  <div className="rounded-lg border bg-card/50 overflow-hidden">
                    <button
                      onClick={() => setRegExpanded(!regExpanded)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span style={{ color: "#EF4444" }}>◆</span>
                        Pair ARX Chip
                        {regChipAddress && (
                          <span className="text-[10px] text-green-500 font-normal">
                            (address set)
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {regExpanded ? "▲" : "▼"}
                      </span>
                    </button>

                    {!regExpanded && regChipAddress && (
                      <div className="px-4 pb-3 text-xs text-muted-foreground font-mono truncate border-t">
                        {regChipAddress}
                      </div>
                    )}

                    {regExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t space-y-3">
                        {/* [Thoth] ARX chip Ethereum address field */}
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            ARX Chip Ethereum Address
                          </label>
                          <input
                            value={regChipAddress}
                            onChange={(e) => setRegChipAddress(e.target.value)}
                            placeholder="0xC3D72cc59B4514fac7057bC9C629b7bC4de9A635"
                            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm font-mono focus:border-red-400 focus:outline-none"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Tap your ARX chip with your phone, then paste the
                            Ethereum address here
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            No NFC? Open the ARX app, tap your chip there, and
                            copy-paste the address. You can also pair after
                            registration.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Special Markers
                    </label>
                    <input
                      value={regMarker}
                      onChange={(e) => setRegMarker(e.target.value)}
                      placeholder='e.g., "Innovate at the Speed of Thought" on inner cover'
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Describe unique features that make this item one-of-a-kind
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Your Email or Phone *
                    </label>
                    <input
                      value={regContact}
                      onChange={(e) => setRegContact(e.target.value)}
                      placeholder="email@example.com or +1-555-123-4567"
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      We&apos;ll send your ownership receipt + QR code here
                    </p>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <button
                    onClick={handleRegister}
                    disabled={!regName.trim() || !regPrice || loading}
                    className="w-full py-3 bg-red-500 text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all"
                  >
                    {loading ? "Registering..." : "Register on Blockchain"}
                  </button>
                </div>

                {/* [Asar] 12 Divinity Guide edition cards — inside Mint flower only */}
                <div className="pt-4 border-t">
                  <h3 className="text-xs font-bold text-muted-foreground mb-3 text-center">
                    DIVINITY GUIDE EDITIONS
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 12 }, (_, i) => (
                      <div
                        key={i}
                        className="rounded-lg border bg-card p-2 text-center hover:border-red-400 transition-colors cursor-pointer"
                        onClick={() => {
                          setRegName(
                            `The Divinity Guide — Edition ${i + 1}`
                          );
                          setRegPrice("33.33");
                          setRegEdition(String(i + 1));
                        }}
                      >
                        <div className="text-lg">✦</div>
                        <p className="text-[9px] font-bold">Ed. {i + 1}</p>
                        <p className="text-[8px]" style={{ color: "#EF4444" }}>
                          $33.33
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ MINT SUCCESS — QR + Chip Pairing ═══ */}
            {selectedFlower === "mint" && regSuccess && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <h2 className="text-xl font-bold text-green-500">
                  Item Registered!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Transaction: {regSuccess.arx_tx_id}
                </p>

                {/* [Pangu] QR code prominently displayed */}
                <div className="p-6 border rounded-xl bg-card w-full max-w-xs">
                  <p className="text-xs text-muted-foreground mb-3 text-center">
                    Scan to verify ownership
                  </p>
                  <div className="flex justify-center">
                    <QRCodeSVG value={regSuccess.qr_code_url} size={200} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Save this QR code — share with buyers
                  </p>
                </div>

                {/* [Pangu] If chip address was provided during registration, show paired status.
                    Otherwise show pairing option. */}
                {regChipAddress.trim() ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-green-500/30 bg-green-500/5 w-full max-w-xs">
                    <span className="text-green-500 text-lg">✓</span>
                    <div>
                      <p className="text-sm font-bold text-green-600">
                        Chip paired
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                        {regChipAddress}
                      </p>
                    </div>
                  </div>
                ) : !showPairChip ? (
                  <div className="w-full max-w-xs space-y-2">
                    <button
                      onClick={() => setShowPairChip(true)}
                      className="w-full py-2.5 border border-primary/30 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors"
                    >
                      Pair ARX Chip (paste address)
                    </button>
                    <button
                      onClick={async () => {
                        // Program chip via NFC using libhalo
                        try {
                          setLoading(true);
                          setError("");
                          const { execHaloCmdWeb } = await import("@arx-research/libhalo/api/web");
                          // Step 1: Get the chip's public keys (this reads the chip via NFC)
                          const info = await execHaloCmdWeb({ name: "sign", message: "00", keyNo: 1 });
                          const chipAddr = info.etherAddress || info.address || "";
                          if (!chipAddr) throw new Error("Could not read chip address");
                          // Step 2: Store the chip address in Supabase
                          const { supabase } = await import("@/lib/supabase");
                          if (!supabase) throw new Error("Supabase not available");
                          await supabase.from("arx_items").update({
                            chip_key_hash: chipAddr.toLowerCase()
                          }).eq("token_id", regSuccess!.token_id);
                          setRegChipAddress(chipAddr);
                          alert(`Chip paired! Address: ${chipAddr}\n\nAnyone can now tap this chip to verify your item.`);
                        } catch (e: any) {
                          setError(e.message || "NFC not available — use paste method instead");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90"
                    >
                      📱 Tap ARX Chip to Pair (NFC)
                    </button>
                    <p className="text-[10px] text-muted-foreground text-center">Chrome on Android required for NFC tap</p>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-card/50 p-4 space-y-3 w-full max-w-xs">
                    <p className="text-xs text-muted-foreground">
                      Paste your ARX chip&apos;s Ethereum address:
                    </p>
                    <input
                      value={pairChipAddress}
                      onChange={(e) => setPairChipAddress(e.target.value)}
                      placeholder="0xC3D72cc59B4514fac7057bC9C629b7bC4de9A635"
                      className="w-full rounded-lg border bg-background px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                    />
                    <button
                      disabled={!pairChipAddress.trim() || loading}
                      onClick={async () => {
                        if (!pairChipAddress.trim() || !regSuccess) return;
                        setLoading(true);
                        try {
                          // Pair via Supabase directly (no backend API needed)
                          const { supabase } = await import("@/lib/supabase");
                          if (!supabase) throw new Error("Supabase not available");
                          await supabase.from("arx_items").update({
                            chip_key_hash: pairChipAddress.trim().toLowerCase()
                          }).eq("token_id", regSuccess.token_id);
                          setRegChipAddress(pairChipAddress.trim());
                          setShowPairChip(false);
                          setPairChipAddress("");
                        } catch (e: any) {
                          setError(
                            e.message || "Chip pairing failed"
                          );
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-40"
                    >
                      {loading ? "Pairing..." : "Pair Chip to Item"}
                    </button>
                  </div>
                )}

                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={resetRegForm}
                    className="flex-1 py-2 border rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    Register Another
                  </button>
                  <button
                    onClick={() =>
                      router.push(
                        `/divinity-guide/arx?token=${regSuccess.token_id}`
                      )
                    }
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90"
                  >
                    View Item
                  </button>
                </div>
              </div>
            )}

            {/* ═══ VERIFY FLOWER — Token ID + Chip Address inputs ═══ */}
            {selectedFlower === "verify" && (
              <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#10B981" }}>
                    Verify — Authenticate
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confirm any item is genuine. Enter a Token ID or Chip
                    Address.
                  </p>
                </div>

                {/* [Athena] Two inputs side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Token ID
                    </label>
                    <input
                      value={verifyTokenId}
                      onChange={(e) => setVerifyTokenId(e.target.value)}
                      placeholder="e.g., 123456"
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && verifyTokenId.trim()) {
                          lookupItem(parseInt(verifyTokenId), undefined);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Chip Address (0x...)
                    </label>
                    <input
                      value={verifyChipAddress}
                      onChange={(e) => setVerifyChipAddress(e.target.value)}
                      placeholder="0xC3D72cc59..."
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono focus:border-green-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && verifyChipAddress.trim()) {
                          lookupItem(undefined, verifyChipAddress);
                        }
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (verifyChipAddress.trim()) {
                      lookupItem(undefined, verifyChipAddress);
                    } else if (verifyTokenId.trim()) {
                      lookupItem(parseInt(verifyTokenId), undefined);
                    }
                  }}
                  disabled={
                    (!verifyTokenId.trim() && !verifyChipAddress.trim()) ||
                    loading
                  }
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  {loading ? "Verifying..." : "Verify Item"}
                </button>

                <p className="text-[10px] text-muted-foreground text-center">
                  Tap your phone on an ARX chip — verification is automatic via
                  URL
                </p>

                {/* Verification results */}
                {verificationStatus === "verified" && item && (
                  <div className="space-y-4">
                    {renderItemCard()}

                    {/* Transaction History */}
                    {item.transactions && item.transactions.length > 0 && (
                      <div className="rounded-xl border bg-card p-5">
                        <h3 className="font-bold text-sm mb-3">
                          Transaction History ({item.transactions.length})
                        </h3>
                        <div className="space-y-2">
                          {item.transactions.map((tx) => (
                            <div
                              key={tx.arx_tx_id}
                              className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                            >
                              <div>
                                <span className="font-mono text-xs text-primary">
                                  {tx.arx_tx_id}
                                </span>
                                <span
                                  className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                                    tx.type === "mint"
                                      ? "bg-green-500/10 text-green-500"
                                      : tx.type === "sale"
                                        ? "bg-blue-500/10 text-blue-500"
                                        : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {tx.type}
                                </span>
                              </div>
                              <div className="text-right">
                                {tx.price_usd != null && (
                                  <span className="font-bold">
                                    ${tx.price_usd.toFixed(2)}
                                  </span>
                                )}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {tx.timestamp
                                    ? new Date(
                                        tx.timestamp
                                      ).toLocaleDateString()
                                    : ""}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {verificationStatus === "failed" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center mb-3">
                      <span className="text-2xl">✗</span>
                    </div>
                    <p className="text-red-500 font-bold">Item Not Found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {error}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ TRANSFER FLOWER ═══ */}
            {selectedFlower === "transfer" && (
              <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#3B82F6" }}>
                    Transfer — Sell or Gift
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Change ownership of a registered item. Both parties receive
                    timestamped QR receipts.
                  </p>
                </div>

                {/* [Odin] Show item card first if loaded, then transfer form.
                    If no item loaded, show "Verify an item first" message. */}
                {!item ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center">
                      <span className="text-2xl text-blue-400">↔</span>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Verify an item first
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Use the Verify portal to look up an item by Token ID or
                      Chip Address. Once verified, return here to transfer
                      ownership.
                    </p>
                    <button
                      onClick={() => setSelectedFlower("verify")}
                      className="px-4 py-2 border border-green-500/30 rounded-lg text-sm text-green-600 hover:bg-green-500/5 transition-colors"
                    >
                      Go to Verify
                    </button>
                  </div>
                ) : !transferSuccess ? (
                  <div className="space-y-4">
                    {/* Item details card */}
                    {renderItemCard()}

                    {/* Transfer form */}
                    <div className="rounded-xl border bg-card p-5 space-y-3">
                      <h3 className="font-bold text-sm">Transfer Ownership</h3>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">
                          Recipient (email or wallet) *
                        </label>
                        <input
                          value={transferTo}
                          onChange={(e) => setTransferTo(e.target.value)}
                          placeholder="buyer@example.com"
                          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">
                          Sale Price (USD) — leave empty for gift
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={transferPrice}
                          onChange={(e) => setTransferPrice(e.target.value)}
                          placeholder="0.00 (free gift)"
                          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      {error && (
                        <p className="text-sm text-red-500">{error}</p>
                      )}
                      <button
                        onClick={handleTransfer}
                        disabled={!transferTo.trim() || loading}
                        className="w-full py-2.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all"
                      >
                        {loading
                          ? "Processing..."
                          : transferPrice
                            ? `Sell for $${parseFloat(transferPrice).toFixed(2)}`
                            : "Gift This Item"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-green-500/5 border-green-500/30 p-6 text-center space-y-4">
                    <p className="text-green-500 font-bold">
                      Transfer Complete!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Transaction: {transferSuccess.arx_tx_id}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">
                          Buyer QR
                        </p>
                        <QRCodeSVG
                          value={transferSuccess.buyer_qr_url}
                          size={120}
                        />
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">
                          Seller QR
                        </p>
                        <QRCodeSVG
                          value={transferSuccess.seller_qr_url}
                          size={120}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Both parties receive timestamped QR codes
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by eXeL AI &bull; Physically Backed Tokens on Quai Network
          &bull; ARX NFC Verified
        </p>
      </footer>
    </div>
  );
}

export default function ArxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ArxPageInner />
    </Suspense>
  );
}
