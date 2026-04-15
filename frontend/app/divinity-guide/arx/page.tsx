"use client";

/**
 * /divinity-guide/arx — ARX Physically-Backed Token Registry
 *
 * Digital provenance tracking for unique physical items (art, collectibles,
 * signed works). Uses Flower of Life navigation matching /divinity-guide.
 *
 * 3-Flower Portal Layout:
 *   TOP:          Register (Red)   — Create a record for a new item + pair ARX chip
 *   BOTTOM-LEFT:  Verify (Green)   — Look up by Token ID or Chip Address
 *   BOTTOM-RIGHT: Transfer (Blue)  — Change ownership with dual QR receipts
 *   HUB (center): PBT ARX         — Portal hub
 *
 * CRS: CRS-NEW-12.01 through 12.07
 */

import React, { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import "@/components/flower-of-life/flower-animations.css";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useLexicon } from "@/lib/lexicon-context";
import { ThemeCircle } from "@/components/flower-of-life/theme-circle";
import { getHubPosition, getTheme2_3Positions } from "@/lib/flower-geometry";

interface ArxItem {
  token_id: number;
  item_name: string;
  serial_number?: string;
  identifiers: string;
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

// --- Portal definitions (matches Divinity Guide SECTIONS pattern) ---
const ARX_PORTALS = [
  {
    id: "mint" as const,
    label: "Register",
    subtitle: "New Item",
    color: { fill: "rgba(239, 68, 68, 0.15)", stroke: "#EF4444" },
  },
  {
    id: "verify" as const,
    label: "Verify",
    subtitle: "Look Up",
    color: { fill: "rgba(16, 185, 129, 0.15)", stroke: "#10B981" },
  },
  {
    id: "transfer" as const,
    label: "Transfer",
    subtitle: "Change Owner",
    color: { fill: "rgba(59, 130, 246, 0.15)", stroke: "#3B82F6" },
  },
];

function ArxPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLexicon();
  const tokenParam = searchParams.get("token");
  const chipParam = searchParams.get("chip");

  // --- Flower geometry (same as Divinity Guide) ---
  const hub = useMemo(() => getHubPosition(), []);
  const outerPositions = useMemo(() => getTheme2_3Positions(), []);

  // --- State ---
  const [item, setItem] = useState<ArxItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "verified" | "failed"
  >("pending");

  // [Enlil] Right panel expand/collapse
  const [panelMode, setPanelMode] = useState<"split" | "full">("split");

  // Flower navigation — 3 portals
  const [selectedFlower, setSelectedFlower] = useState<
    "mint" | "verify" | "transfer" | null
  >(null);

  // --- Registration form ---
  const [regName, setRegName] = useState("");
  const [regPrice, setRegPrice] = useState("");
  const [regSerial, setRegSerial] = useState("");
  const [regIdentifiers, setRegIdentifiers] = useState("");
  const [regMarker, setRegMarker] = useState("");
  const [regContact, setRegContact] = useState("");
  const [regChipAddress, setRegChipAddress] = useState("");
  const [regSuccess, setRegSuccess] = useState<{
    qr_code_url: string;
    arx_tx_id: string;
    token_id: number;
  } | null>(null);
  const [regExpanded, setRegExpanded] = useState(false);
  const [showPairChip, setShowPairChip] = useState(false);
  const [pairChipAddress, setPairChipAddress] = useState("");

  // --- Verify form ---
  const [verifyTokenId, setVerifyTokenId] = useState("");
  const [verifyChipAddress, setVerifyChipAddress] = useState("");

  // --- Transfer — just Token ID input, redirects to /arx/[tokenId] ---
  const [transferTo, setTransferTo] = useState("");

  // Chip reset removed (cfg_ndef disabled broadcast in prior testing)

  // Active portal (for highlight color)
  const activePortal = useMemo(
    () => ARX_PORTALS.find((p) => p.id === selectedFlower),
    [selectedFlower]
  );

  // [Aset] Auto-detect from URL: ?chip=0x... or ?token=
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
          identifiers: itemData.identifiers || itemData.edition?.toString() || "",
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
      const qrUrl = `${window.location.origin}/divinity-guide/arx/${newTokenId}`;

      let chipKeyHash: string | null = null;
      if (regChipAddress.trim()) {
        chipKeyHash = regChipAddress.trim().toLowerCase();
      }

      const { error: itemErr } = await supabase.from("arx_items").insert({
        token_id: newTokenId,
        item_name: regName.trim(),
        purchase_price_usd: parseFloat(regPrice),
        serial_number: regSerial.trim() || null,
        identifiers: regIdentifiers.trim() || null,
        language: "en",
        current_owner: regContact.trim() || "anonymous",
        qr_code_url: qrUrl,
        chip_key_hash: chipKeyHash,
      });
      if (itemErr) throw new Error(itemErr.message);

      await supabase.from("arx_transactions").insert({
        arx_tx_id: txId,
        token_id: newTokenId,
        to_address: regContact.trim() || "anonymous",
        price_usd: parseFloat(regPrice),
        transaction_type: "mint",
      });

      setRegSuccess({ qr_code_url: qrUrl, arx_tx_id: txId, token_id: newTokenId });
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }, [regName, regPrice, regSerial, regIdentifiers, regChipAddress, regContact]);

  // Transfer is now handled on /arx/[tokenId] page

  // --- Reset registration form ---
  const resetRegForm = useCallback(() => {
    setRegName("");
    setRegPrice("");
    setRegSerial("");
    setRegIdentifiers("");
    setRegMarker("");
    setRegContact("");
    setRegChipAddress("");
    setRegSuccess(null);
    setShowPairChip(false);
    setPairChipAddress("");
    setRegExpanded(false);
  }, []);

  // --- NFC: Read chip address via libhalo ---
  const handleNfcRead = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { execHaloCmdWeb } = await import("@arx-research/libhalo/api/web");
      const info = await execHaloCmdWeb(
        { name: "sign", message: "00", keyNo: 1 },
        {
          statusCallback: (s: string) => {
            if (s === "init") {
              alert("Hold your ARX chip to the top of your phone.\n\nKeep it still until the read completes.");
            }
          },
        }
      );
      const chipAddr = info.etherAddress || "";
      if (!chipAddr) throw new Error("Could not read chip address. Hold steady and try again.");
      return chipAddr;
    } catch (e: any) {
      setError(e.message || "NFC read failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // NOTE: cfg_ndef removed — it disabled chip NFC broadcast in prior testing.
  // Only safe operation is "sign" (read). No chip write commands.

  // --- Item details card (reusable) ---
  const renderItemCard = () => {
    if (!item) return null;
    return (
      <div className="rounded-xl border bg-card/80 backdrop-blur-sm p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/40 flex items-center justify-center">
            <span className="text-green-500 text-lg">✓</span>
          </div>
          <div>
            <p className="text-green-600 font-semibold text-sm">Verified</p>
            <p className="text-[10px] text-muted-foreground">Item found in registry</p>
          </div>
        </div>
        <h3 className="text-lg font-bold">{item.item_name}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {item.serial_number && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Serial</p>
              <p className="font-mono text-xs">{item.serial_number}</p>
            </div>
          )}
          {item.identifiers && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Identifiers</p>
              <p className="text-xs">{item.identifiers}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Owner</p>
            <p className="font-mono text-xs truncate">{item.current_owner}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Price</p>
            <p className="font-bold">${item.purchase_price_usd?.toFixed(2)}</p>
          </div>
          {item.minted_at && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Registered</p>
              <p className="text-xs">{new Date(item.minted_at).toLocaleDateString()}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Transactions</p>
            <p className="font-bold">{item.transaction_count}</p>
          </div>
        </div>
        {item.qr_code_url && (
          <div className="flex justify-center pt-3">
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* LEFT (desktop) / TOP (mobile): Flower Navigation — matches Divinity Guide exactly */}
        {showFlowers && (
          <div className="w-full md:w-1/2 md:border-r flex flex-col items-center justify-center px-6 py-6">
            {/* Top-left: eXeL AI → Divinity Guide home | Top-right: NFC Tools */}
            <div className="flex items-center justify-between w-full mb-1">
              <Link href="/divinity-guide" className="flex items-center gap-1.5 hover:opacity-80">
                <span className="text-sm font-bold text-primary">eXeL</span>
                <span className="text-sm font-light text-primary/70">AI</span>
              </Link>
              <Link href="/divinity-guide" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Divinity Guide
              </Link>
            </div>

            {/* Title — clickable, resets to flower home (same as Divinity Guide) */}
            <button
              onClick={() => { setSelectedFlower(null); setError(""); }}
              className="text-2xl font-bold mb-0.5 hover:opacity-80 text-primary"
            >
              Physically Backed Tokens
            </button>
            <p className="text-[10px] text-muted-foreground italic mb-2">
              Authenticate. Own. Transfer. Forever.
            </p>

            {/* Flower of Life SVG — using shared ThemeCircle + geometry */}
            <svg viewBox="0 0 600 500" className="w-full" style={{ overflow: "visible" }}>
              {/* Lines from hub to outer portals */}
              {!selectedFlower && outerPositions.map((pos, i) => (
                <line key={`l-${i}`}
                  x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
                  stroke={ARX_PORTALS[i].color.stroke} strokeOpacity={0.15} strokeWidth={2}
                />
              ))}
              {selectedFlower && outerPositions.map((pos, i) => (
                <line key={`sl-${i}`}
                  x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
                  stroke={activePortal?.color.stroke || "currentColor"} strokeOpacity={0.12} strokeWidth={1.5}
                />
              ))}

              {/* Hub circle — PBT ARX */}
              <ThemeCircle
                cx={hub.cx} cy={hub.cy} r={hub.r}
                theme={{ label: "PBT", count: 0, avgConfidence: 0, summary33: "ARX" }}
                fill={selectedFlower && activePortal ? activePortal.color.fill : "rgba(var(--primary), 0.15)"}
                stroke={selectedFlower && activePortal ? activePortal.color.stroke : "hsl(var(--primary))"}
                isHub
              />

              {/* 3 Outer Portals — Mint, Verify, Transfer */}
              {outerPositions.map((pos, i) => {
                const portal = ARX_PORTALS[i];
                const isSelected = selectedFlower === portal.id;
                const hasSelection = !!selectedFlower;
                return (
                  <ThemeCircle
                    key={portal.id}
                    cx={pos.cx} cy={pos.cy} r={pos.r}
                    theme={{
                      label: portal.label,
                      count: 0,
                      avgConfidence: 0,
                      summary33: portal.subtitle,
                    }}
                    fill={isSelected ? portal.color.stroke + "30" : portal.color.fill}
                    stroke={portal.color.stroke}
                    bloom bloomDelay={i * 200}
                    onClick={() => { setSelectedFlower(portal.id); setError(""); }}
                    className={`${isSelected ? "flower-pulse" : ""} ${hasSelection && !isSelected ? "opacity-40" : ""}`}
                  />
                );
              })}
            </svg>

            {/* Back button (when a portal is selected) */}
            {selectedFlower && (
              <button
                onClick={() => { setSelectedFlower(null); setError(""); }}
                className="mt-4 text-xs text-foreground hover:text-primary transition-colors"
              >
                ← All Portals
              </button>
            )}

            {!selectedFlower && (
              <p className="text-[9px] text-muted-foreground/40 mt-4">
                Select a circle to begin
              </p>
            )}

            {/* Footer — matches Divinity Guide exactly */}
            <div className="mt-auto pb-6 text-center">
              <br />
              <p className="text-[9px] text-muted-foreground/40">••• Physically Backed Tokens •••</p>
              <p className="text-[9px] text-muted-foreground/40">◬ · ♡ · 웃</p>
            </div>
          </div>
        )}

        {/* RIGHT (desktop) / BOTTOM (mobile): Context Panel */}
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
                      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setPanelMode("split")}
                    title="Back to flowers"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card hover:bg-accent text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back
                  </button>
                )}
              </div>
            )}

            {/* No flower selected — welcome */}
            {!selectedFlower && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 px-4">
                <p className="text-lg font-bold">Digital Provenance for Physical Items</p>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Register artwork, signed books, or collectibles with a
                  permanent digital record. Pair an ARX NFC chip for
                  tap-to-verify authenticity. Transfer ownership with
                  timestamped QR receipts for both parties.
                </p>
                <p className="text-xs text-muted-foreground/60 italic max-w-xs">
                  Select a portal on the left to get started.
                </p>
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* MINT PORTAL — Registration Form            */}
            {/* ═══════════════════════════════════════════ */}
            {selectedFlower === "mint" && !regSuccess && (
              <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#EF4444" }}>
                    Register Item
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a digital record for your physical item
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Item Name */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Item Name *</label>
                    <input
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Original artwork, signed book, collectible..."
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Price (USD) *</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={regPrice}
                      onChange={(e) => setRegPrice(e.target.value)}
                      placeholder="33.33"
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Serial + Identifiers — side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Serial Number</label>
                      <input
                        value={regSerial}
                        onChange={(e) => setRegSerial(e.target.value)}
                        placeholder="DG-2026-001"
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Identifiers</label>
                      <input
                        value={regIdentifiers}
                        onChange={(e) => setRegIdentifiers(e.target.value)}
                        placeholder="1/1, signed, proof"
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Description</label>
                    <input
                      value={regMarker}
                      onChange={(e) => setRegMarker(e.target.value)}
                      placeholder="Hand-signed, inscribed to Alex"
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Details that make this item unique
                    </p>
                  </div>

                  {/* Contact */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Owner Contact</label>
                    <input
                      value={regContact}
                      onChange={(e) => setRegContact(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* ARX Chip pairing — collapsible */}
                  <div className="rounded-lg border bg-card/50 overflow-hidden">
                    <button
                      onClick={() => setRegExpanded(!regExpanded)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span style={{ color: "#EF4444" }}>◆</span>
                        Link ARX NFC Chip
                        {regChipAddress && (
                          <span className="text-[10px] text-green-500 font-normal">(linked)</span>
                        )}
                      </span>
                      <span className="text-muted-foreground text-xs">{regExpanded ? "▲" : "▼"}</span>
                    </button>
                    {!regExpanded && regChipAddress && (
                      <div className="px-4 pb-3 text-xs text-muted-foreground font-mono truncate border-t">
                        {regChipAddress}
                      </div>
                    )}
                    {regExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t space-y-3">
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Paste the chip Ethereum address below, or tap &quot;Read NFC Chip&quot; after registration to auto-detect it.
                        </p>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Chip Address</label>
                          <input
                            value={regChipAddress}
                            onChange={(e) => setRegChipAddress(e.target.value)}
                            placeholder="0xC3D72cc59B4514fac..."
                            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm font-mono focus:border-red-400 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {error && <p className="text-sm text-red-500 bg-red-500/5 rounded-lg px-3 py-2">{error}</p>}

                  <button
                    onClick={handleRegister}
                    disabled={!regName.trim() || !regPrice || loading}
                    className="w-full py-3 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 disabled:opacity-40 transition-all"
                  >
                    {loading ? "Registering..." : "Register Item"}
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* MINT SUCCESS — QR + Chip Pairing           */}
            {/* ═══════════════════════════════════════════ */}
            {selectedFlower === "mint" && regSuccess && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
                  <span className="text-2xl text-green-500">✓</span>
                </div>
                <h2 className="text-xl font-bold text-green-500">Registration Complete</h2>
                <p className="text-sm text-muted-foreground font-mono">{regSuccess.arx_tx_id}</p>

                {/* QR code */}
                <div className="p-6 border rounded-xl bg-card/80 backdrop-blur-sm w-full max-w-xs">
                  <p className="text-xs text-muted-foreground mb-3 text-center">Scan to verify ownership</p>
                  <div className="flex justify-center">
                    <QRCodeSVG value={regSuccess.qr_code_url} size={180} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3 text-center">Save and share with buyers</p>
                </div>

                {/* Chip status */}
                {regChipAddress.trim() && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-green-500/30 bg-green-500/5 w-full max-w-xs">
                    <span className="text-green-500">✓</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-green-600">NFC chip paired</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{regChipAddress}</p>
                    </div>
                  </div>
                )}

                {/* NFC actions */}
                <div className="w-full max-w-xs space-y-2">
                  {/* Read + Program chip via NFC */}
                  <button
                    disabled={loading}
                    onClick={async () => {
                      const addr = await handleNfcRead();
                      if (!addr) return;
                      try {
                        setLoading(true);
                        const { supabase } = await import("@/lib/supabase");
                        if (!supabase) throw new Error("Supabase not available");
                        // Store chip address
                        await supabase.from("arx_items").update({
                          chip_key_hash: addr.toLowerCase()
                        }).eq("token_id", regSuccess!.token_id);
                        setRegChipAddress(addr);

                        // Program chip URL — tapping will open the item page
                        // Uses set_url_subdomain (NOT cfg_ndef which disables broadcast)
                        const { execHaloCmdWeb } = await import("@arx-research/libhalo/api/web");
                        const itemUrl = `https://exel-ai-polling.explore-096.workers.dev/divinity-guide/arx/${regSuccess!.token_id}`;
                        alert("Tap chip again to program the item URL.");
                        await execHaloCmdWeb(
                          { name: "set_url_subdomain", url: itemUrl },
                          { statusCallback: () => {} }
                        );
                        alert(`Chip paired and programmed!\n\nAddress: ${addr}\nTapping chip will open the item page.`);
                      } catch (e: any) {
                        setError(e.message || "Failed to pair chip");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all"
                  >
                    {loading ? "Reading..." : "Read + Program NFC Chip"}
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Reads the chip address, then programs it to open this item page when tapped
                  </p>

                  {/* Manual paste toggle */}
                  {!showPairChip ? (
                    <button
                      onClick={() => setShowPairChip(true)}
                      className="w-full py-2 border border-muted rounded-lg text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
                    >
                      Or paste address manually
                    </button>
                  ) : (
                    <div className="rounded-lg border bg-card/50 p-3 space-y-2">
                      <input
                        value={pairChipAddress}
                        onChange={(e) => setPairChipAddress(e.target.value)}
                        placeholder="0xC3D72cc59B4514fac..."
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                      />
                      <button
                        disabled={!pairChipAddress.trim() || loading}
                        onClick={async () => {
                          if (!pairChipAddress.trim() || !regSuccess) return;
                          setLoading(true);
                          try {
                            const { supabase } = await import("@/lib/supabase");
                            if (!supabase) throw new Error("Supabase not available");
                            await supabase.from("arx_items").update({
                              chip_key_hash: pairChipAddress.trim().toLowerCase()
                            }).eq("token_id", regSuccess.token_id);
                            setRegChipAddress(pairChipAddress.trim());
                            setShowPairChip(false);
                            setPairChipAddress("");
                          } catch (e: any) {
                            setError(e.message || "Chip pairing failed");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-40"
                      >
                        {loading ? "Linking..." : "Link Chip"}
                      </button>
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-red-500 bg-red-500/5 rounded-lg px-3 py-2 w-full max-w-xs">{error}</p>}

                {/* Navigation */}
                <div className="flex gap-3 w-full max-w-xs pt-2">
                  <button
                    onClick={resetRegForm}
                    className="flex-1 py-2.5 border rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    Register Another
                  </button>
                  <button
                    onClick={() => router.push(`/divinity-guide/arx/${regSuccess.token_id}`)}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90"
                  >
                    View Item
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* VERIFY PORTAL                              */}
            {/* ═══════════════════════════════════════════ */}
            {selectedFlower === "verify" && (
              <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#10B981" }}>Verify Item</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Look up an item by Token ID or NFC chip address
                  </p>
                </div>

                {/* [Athena] Two inputs side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Token ID</label>
                    <input
                      value={verifyTokenId}
                      onChange={(e) => setVerifyTokenId(e.target.value)}
                      placeholder="123456"
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && verifyTokenId.trim()) lookupItem(parseInt(verifyTokenId), undefined);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Chip Address</label>
                    <input
                      value={verifyChipAddress}
                      onChange={(e) => setVerifyChipAddress(e.target.value)}
                      placeholder="0xC3D72cc5..."
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono focus:border-green-500 focus:outline-none transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && verifyChipAddress.trim()) lookupItem(undefined, verifyChipAddress);
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (verifyChipAddress.trim()) lookupItem(undefined, verifyChipAddress);
                      else if (verifyTokenId.trim()) lookupItem(parseInt(verifyTokenId), undefined);
                    }}
                    disabled={(!verifyTokenId.trim() && !verifyChipAddress.trim()) || loading}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-40 transition-all"
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </button>
                  {/* NFC scan button */}
                  <button
                    disabled={loading}
                    onClick={async () => {
                      const addr = await handleNfcRead();
                      if (addr) {
                        setVerifyChipAddress(addr);
                        lookupItem(undefined, addr);
                      }
                    }}
                    className="px-4 py-2.5 border border-green-500/30 rounded-lg text-green-600 hover:bg-green-500/5 transition-colors"
                    title="Scan NFC chip"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/>
                    </svg>
                  </button>
                </div>

                {/* Verification results */}
                {verificationStatus === "verified" && item && (
                  <div className="space-y-4">
                    {renderItemCard()}

                    {/* Transaction History */}
                    {item.transactions && item.transactions.length > 0 && (
                      <div className="rounded-xl border bg-card/80 backdrop-blur-sm p-5">
                        <h3 className="font-bold text-sm mb-3">
                          Transaction History ({item.transactions.length})
                        </h3>
                        <div className="space-y-2">
                          {item.transactions.map((tx) => (
                            <div key={tx.arx_tx_id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-primary">{tx.arx_tx_id}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                  tx.type === "mint" ? "bg-green-500/10 text-green-500" :
                                  tx.type === "sale" ? "bg-blue-500/10 text-blue-500" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {tx.type}
                                </span>
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
                  </div>
                )}

                {verificationStatus === "failed" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center mb-3">
                      <span className="text-2xl text-red-400">✗</span>
                    </div>
                    <p className="text-red-500 font-bold">Not Found</p>
                    <p className="text-xs text-muted-foreground mt-1">{error || "No matching item"}</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* TRANSFER PORTAL — redirects to item page   */}
            {/* ═══════════════════════════════════════════ */}
            {selectedFlower === "transfer" && (
              <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#3B82F6" }}>Transfer Ownership</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the item Token ID to open its page, where the new owner can fill in their details.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Token ID *</label>
                    <input
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      placeholder="e.g. 123456789"
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && transferTo.trim()) {
                          router.push(`/divinity-guide/arx/${transferTo.trim()}`);
                        }
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Found on the item QR code or registration receipt
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (transferTo.trim()) router.push(`/divinity-guide/arx/${transferTo.trim()}`);
                    }}
                    disabled={!transferTo.trim()}
                    className="w-full py-2.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 disabled:opacity-40 transition-all"
                  >
                    Open Item Page
                  </button>
                </div>

                <div className="pt-4 border-t text-center space-y-3">
                  <p className="text-xs text-muted-foreground">
                    The item page shows full ownership history and lets the new
                    owner fill in their details to complete the transfer.
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Or share the item URL directly: /divinity-guide/arx/TOKEN_ID
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
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
