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
import ItemView from "./item-view";
import { getHubPosition, getTheme2_3Positions } from "@/lib/flower-geometry";
import { fmtDate } from "./arx-utils";

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
  const [regPurchaseDate, setRegPurchaseDate] = useState("");
  const [regPurchaseTime, setRegPurchaseTime] = useState("");
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

  // --- Browse / Marketplace ---
  const [browseItems, setBrowseItems] = useState<Array<{ token_id: number; item_name: string; current_owner: string; purchase_price_usd: number | null; created_at: string }>>([]);
  const [browseSearch, setBrowseSearch] = useState("");
  const [browseLoading, setBrowseLoading] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [browseHasMore, setBrowseHasMore] = useState(false);

  // --- Transfer — just Token ID input, redirects to /arx/[tokenId] ---
  const [transferTo, setTransferTo] = useState("");

  // Chip reset removed (cfg_ndef disabled broadcast in prior testing)

  // Active portal (for highlight color)
  const activePortal = useMemo(
    () => ARX_PORTALS.find((p) => p.id === selectedFlower),
    [selectedFlower]
  );

  // [Aset] Auto-detect from URL: ?chip=0x... auto-verifies
  useEffect(() => {
    if (chipParam && chipParam.startsWith("0x")) {
      setSelectedFlower("verify");
      setVerifyChipAddress(chipParam);
      lookupItem(undefined, chipParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipParam]);

  // tokenParam handled in render below (after all hooks)

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

        const itemCols = "token_id, item_name, serial_number, identifiers, language, current_owner, purchase_price_usd, purchase_date, purchase_time, qr_code_url, chip_key_hash, created_at, last_transfer_at";
        if (chipAddr && chipAddr.startsWith("0x")) {
          const { data } = await supabase
            .from("arx_items")
            .select(itemCols)
            .eq("chip_key_hash", chipAddr.toLowerCase())
            .single();
          itemData = data;
        } else if (tokenId) {
          const { data } = await supabase
            .from("arx_items")
            .select(itemCols)
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
          .select("arx_tx_id, from_address, to_address, price_usd, transaction_type, created_at")
          .eq("token_id", resolvedTokenId)
          .order("created_at", { ascending: true });

        const itemResult: ArxItem = {
          token_id: itemData.token_id,
          item_name: itemData.item_name,
          serial_number: itemData.serial_number,
          identifiers: itemData.identifiers || "",
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

      // Check for duplicate serial number before registration
      if (regSerial.trim()) {
        const { data: existing } = await supabase
          .from("arx_items")
          .select("token_id")
          .eq("serial_number", regSerial.trim())
          .maybeSingle();
        if (existing) {
          throw new Error(`Serial number "${regSerial.trim()}" is already registered (Token #${existing.token_id}). Each item must have a unique serial.`);
        }
      }

      // Check for duplicate chip address before registration
      let chipKeyHash: string | null = null;
      if (regChipAddress.trim()) {
        chipKeyHash = regChipAddress.trim().toLowerCase();
        const { data: existingChip } = await supabase
          .from("arx_items")
          .select("token_id")
          .eq("chip_key_hash", chipKeyHash)
          .maybeSingle();
        if (existingChip) {
          throw new Error(`This chip is already paired to another item (Token #${existingChip.token_id}). Each chip can only be linked to one item.`);
        }
      }

      const newTokenId = Date.now() % 1_000_000_000;
      const txId = `ARX-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const qrUrl = `${window.location.origin}/divinity-guide/arx?token=${newTokenId}`;

      const { error: itemErr } = await supabase.from("arx_items").insert({
        token_id: newTokenId,
        item_name: regName.trim(),
        purchase_price_usd: parseFloat(regPrice),
        purchase_date: regPurchaseDate || new Date().toISOString().split("T")[0],
        purchase_time: regPurchaseTime ? `${regPurchaseTime} CST` : null,
        serial_number: regSerial.trim() || null,
        identifiers: [regIdentifiers.trim(), regMarker.trim()].filter(Boolean).join(" — ") || null,
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
  }, [regName, regPrice, regSerial, regIdentifiers, regMarker, regChipAddress, regContact, regPurchaseDate]);

  // Transfer is now handled on /arx/[tokenId] page

  // --- Browse registered items (paginated) ---
  const BROWSE_PAGE = 20;
  const handleBrowse = useCallback(async (append = false) => {
    setBrowseLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) return;
      const offset = append ? browseItems.length : 0;
      let query = supabase
        .from("arx_items")
        .select("token_id, item_name, current_owner, purchase_price_usd, created_at")
        .order("created_at", { ascending: false })
        .range(offset, offset + BROWSE_PAGE - 1);
      if (browseSearch.trim()) {
        query = query.ilike("item_name", `%${browseSearch.trim()}%`);
      }
      const { data } = await query;
      const results = data || [];
      setBrowseItems(append ? [...browseItems, ...results] : results);
      setBrowseHasMore(results.length === BROWSE_PAGE);
      setShowBrowse(true);
    } catch {
      if (!append) setBrowseItems([]);
    } finally {
      setBrowseLoading(false);
    }
  }, [browseSearch, browseItems]);

  // --- Reset registration form ---
  const resetRegForm = useCallback(() => {
    setRegName("");
    setRegPrice("");
    setRegSerial("");
    setRegIdentifiers("");
    setRegMarker("");
    setRegContact("");
    setRegPurchaseDate("");
    setRegPurchaseTime("");
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
              alert(t("cube12.arx.nfc_hold_chip"));
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

  // --- Hub NFC scan — reads chip, routes to item or offers registration ---
  const handleHubScan = useCallback(async () => {
    try {
      setError("");
      const { execHaloCmdWeb } = await import("@arx-research/libhalo/api/web");
      alert(t("cube12.arx.nfc_hold_chip"));
      const info = await execHaloCmdWeb(
        { name: "sign", message: "00", keyNo: 1 },
        { statusCallback: () => {} }
      );
      const chipAddr = info.etherAddress || "";
      if (!chipAddr) { setError(t("cube12.arx.nfc_read_failed")); return; }

      const { supabase } = await import("@/lib/supabase");
      if (!supabase) return;
      const { data } = await supabase
        .from("arx_items")
        .select("token_id, item_name")
        .eq("chip_key_hash", chipAddr.toLowerCase())
        .maybeSingle();

      if (data) {
        router.push(`/divinity-guide/arx?token=${data.token_id}`);
      } else {
        const action = confirm(
          `${t("cube12.arx.chip_address")}: ${chipAddr}\n\n${t("cube12.arx.chip_not_registered")}`
        );
        if (action) {
          setSelectedFlower("mint");
          setRegChipAddress(chipAddr);
        }
      }
    } catch (e: any) {
      setError(t("cube12.arx.nfc_scan_failed") + ": " + (e.message || ""));
    }
  }, [router, t, setSelectedFlower, setRegChipAddress]);

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
            <p className="text-green-600 font-semibold text-sm">{t("cube12.arx.verified")}</p>
            <p className="text-[10px] text-muted-foreground">{t("cube12.arx.item_found")}</p>
          </div>
        </div>
        <h3 className="text-lg font-bold">{item.item_name}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {item.serial_number && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("cube12.arx.serial_label")}</p>
              <p className="font-mono text-xs">{item.serial_number}</p>
            </div>
          )}
          {item.identifiers && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("cube12.arx.identifiers_label")}</p>
              <p className="text-xs">{item.identifiers}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("cube12.arx.current_owner")}</p>
            <p className="font-mono text-xs truncate">{item.current_owner}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("cube12.arx.last_price")}</p>
            <p className="font-bold">${item.purchase_price_usd?.toFixed(2)}</p>
          </div>
          {item.minted_at && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("cube12.arx.registered_date")}</p>
              <p className="text-xs">{fmtDate(item.minted_at)}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("cube12.arx.transfers")}</p>
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

  // If ?token=XXX is present, show standalone item view (provenance + transfer)
  if (tokenParam) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex items-center justify-between max-w-lg mx-auto px-6 pt-6">
          <Link href="/divinity-guide/arx" className="flex items-center gap-1.5 hover:opacity-80">
            <span className="text-sm font-bold text-primary">eXeL</span>
            <span className="text-sm font-light text-primary/70">AI</span>
          </Link>
          <Link href="/divinity-guide/arx" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            ← {t("cube12.arx.back_to_arx")}
          </Link>
        </div>
        <ItemView tokenId={tokenParam} />
      </div>
    );
  }

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
                {t("cube12.arx.divinity_guide")}
              </Link>
            </div>

            {/* Title — clickable, resets to flower home (same as Divinity Guide) */}
            <button
              onClick={() => { setSelectedFlower(null); setError(""); }}
              className="text-2xl font-bold mb-0.5 hover:opacity-80 text-primary"
            >
              {t("cube12.arx.title")}
            </button>
            <p className="text-[10px] text-muted-foreground italic mb-2">
              {t("cube12.arx.subtitle")}
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

              {/* Hub circle — Scan NFC (center of 3 portals) */}
              <ThemeCircle
                cx={hub.cx} cy={hub.cy} r={hub.r}
                theme={{ label: "Scan", count: 0, avgConfidence: 0, summary33: "NFC" }}
                fill={selectedFlower && activePortal ? activePortal.color.fill : "rgba(var(--primary), 0.15)"}
                stroke={selectedFlower && activePortal ? activePortal.color.stroke : "hsl(var(--primary))"}
                isHub
                onClick={handleHubScan}
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
                ← {t("cube12.arx.all_portals")}
              </button>
            )}

            {!selectedFlower && (
              <p className="text-[9px] text-muted-foreground/40 mt-4">
                {t("cube12.arx.select_portal")}
              </p>
            )}

            {/* Footer — matches Divinity Guide exactly */}
            <div className="mt-auto pb-6 text-center">
              <br />
              <p className="text-[9px] text-muted-foreground/40">••• {t("cube12.arx.title")} •••</p>
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
                <p className="text-lg font-bold">{t("cube12.arx.welcome_title")}</p>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  {t("cube12.arx.welcome_desc")}
                </p>
                <p className="text-xs text-muted-foreground/60 italic max-w-xs">
                  {t("cube12.arx.welcome_hint")}
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
                    {t("cube12.arx.register_item")}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("cube12.arx.register_desc")}
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Item Name */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.item_name")} *</label>
                    <input
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Original artwork, signed book, collectible..."
                      maxLength={500}
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.price_label")} *</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={regPrice}
                      onChange={(e) => setRegPrice(e.target.value)}
                      placeholder="33.33"
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Purchase Date + Time — side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.purchase_date_label")}</label>
                      <input
                        type="date"
                        value={regPurchaseDate}
                        onChange={(e) => setRegPurchaseDate(e.target.value)}
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.purchase_time_label")}</label>
                      <input
                        type="time"
                        value={regPurchaseTime}
                        onChange={(e) => setRegPurchaseTime(e.target.value)}
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground -mt-3">
                    {t("cube12.arx.purchase_date_hint")}
                  </p>

                  {/* Serial + Identifiers — side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.serial_label")}</label>
                      <input
                        value={regSerial}
                        onChange={(e) => setRegSerial(e.target.value)}
                        placeholder="DG-2026-001"
                        maxLength={255}
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.identifiers_label")}</label>
                      <input
                        value={regIdentifiers}
                        onChange={(e) => setRegIdentifiers(e.target.value)}
                        placeholder="Quote, stamp, or other unique mark"
                        maxLength={500}
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.description_label")}</label>
                    <input
                      value={regMarker}
                      onChange={(e) => setRegMarker(e.target.value)}
                      placeholder="Distinguishing details about this item"
                      maxLength={500}
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {t("cube12.arx.description_hint")}
                    </p>
                  </div>

                  {/* Contact */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.owner_contact")}</label>
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
                        {t("cube12.arx.link_nfc_chip")}
                        {regChipAddress && (
                          <span className="text-[10px] text-green-500 font-normal">({t("cube12.arx.chip_linked")})</span>
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
                          <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.chip_address")}</label>
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
                    {loading ? t("cube12.arx.registering") : t("cube12.arx.register_button")}
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
                <h2 className="text-xl font-bold text-green-500">{t("cube12.arx.registration_complete")}</h2>
                <p className="text-sm text-muted-foreground font-mono">{regSuccess.arx_tx_id}</p>

                {/* QR code */}
                <div className="p-6 border rounded-xl bg-card/80 backdrop-blur-sm w-full max-w-xs">
                  <p className="text-xs text-muted-foreground mb-3 text-center">{t("cube12.arx.scan_to_verify")}</p>
                  <div className="flex justify-center">
                    <QRCodeSVG value={regSuccess.qr_code_url} size={180} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3 text-center">{t("cube12.arx.save_and_share")}</p>
                </div>

                {/* Chip status */}
                {regChipAddress.trim() && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-green-500/30 bg-green-500/5 w-full max-w-xs">
                    <span className="text-green-500">✓</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-green-600">{t("cube12.arx.nfc_paired")}</p>
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
                        const itemUrl = `${window.location.origin}/divinity-guide/arx?token=${regSuccess!.token_id}`;
                        alert(t("cube12.arx.nfc_tap_confirm"));
                        await execHaloCmdWeb(
                          { name: "set_url_subdomain", url: itemUrl },
                          { statusCallback: () => {} }
                        );
                        alert(`${t("cube12.arx.chip_programmed_success")}\n\n${t("cube12.arx.chip_address")}: ${addr}`);
                      } catch (e: any) {
                        setError(e.message || "Failed to pair chip");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all"
                  >
                    {loading ? t("cube12.arx.verifying") : t("cube12.arx.read_program_chip")}
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    {t("cube12.arx.chip_program_desc")}
                  </p>

                  {/* Manual paste toggle */}
                  {!showPairChip ? (
                    <button
                      onClick={() => setShowPairChip(true)}
                      className="w-full py-2 border border-muted rounded-lg text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
                    >
                      {t("cube12.arx.paste_manually")}
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
                        {loading ? t("cube12.arx.verifying") : t("cube12.arx.link_chip_button")}
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
                    {t("cube12.arx.register_another")}
                  </button>
                  <button
                    onClick={() => router.push(`/divinity-guide/arx?token=${regSuccess.token_id}`)}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90"
                  >
                    {t("cube12.arx.view_item")}
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
                  <h2 className="text-xl font-bold" style={{ color: "#10B981" }}>{t("cube12.arx.verify_item")}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("cube12.arx.verify_desc")}
                  </p>
                </div>

                {/* [Athena] Two inputs side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.token_id")}</label>
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
                    <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.chip_address")}</label>
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
                    {loading ? t("cube12.arx.verifying") : t("cube12.arx.verify_button")}
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

                {/* Browse registered items */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2">
                    <input
                      value={browseSearch}
                      onChange={(e) => setBrowseSearch(e.target.value)}
                      placeholder="Search by item name..."
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:border-green-500 focus:outline-none transition-colors"
                      onKeyDown={(e) => { if (e.key === "Enter") handleBrowse(); }}
                    />
                    <button
                      onClick={() => handleBrowse()}
                      disabled={browseLoading}
                      className="px-4 py-2 bg-muted text-sm rounded-lg hover:bg-accent transition-colors disabled:opacity-40"
                    >
                      {browseLoading ? "..." : "Browse"}
                    </button>
                  </div>
                  {showBrowse && (
                    <div className="mt-3 space-y-1.5 max-h-[300px] overflow-y-auto">
                      {browseItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No items found</p>
                      ) : browseItems.map((bi) => (
                        <button
                          key={bi.token_id}
                          onClick={() => router.push(`/divinity-guide/arx?token=${bi.token_id}`)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{bi.item_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{bi.current_owner} &middot; {fmtDate(bi.created_at)}</p>
                          </div>
                          {bi.purchase_price_usd !== null && (
                            <span className="text-xs font-bold ml-2">${Number(bi.purchase_price_usd).toFixed(2)}</span>
                          )}
                        </button>
                      ))}
                      {browseHasMore && (
                        <button
                          onClick={() => handleBrowse(true)}
                          disabled={browseLoading}
                          className="w-full py-2 text-xs text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {browseLoading ? "..." : t("cube12.arx.show_more")}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Verification results */}
                {verificationStatus === "verified" && item && (
                  <div className="space-y-4">
                    {renderItemCard()}

                    {/* Actions — next steps after verification */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/divinity-guide/arx?token=${item.token_id}`)}
                        className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all"
                      >
                        {t("cube12.arx.view_item")}
                      </button>
                    </div>

                    {/* Transaction History */}
                    {item.transactions && item.transactions.length > 0 && (
                      <div className="rounded-xl border bg-card/80 backdrop-blur-sm p-5">
                        <h3 className="font-bold text-sm mb-3">
                          {t("cube12.arx.transaction_history")} ({item.transactions.length})
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
                                  {tx.type === "mint" ? t("cube12.arx.tx_registered") : tx.type === "sale" ? t("cube12.arx.tx_sold") : t("cube12.arx.tx_transferred")}
                                </span>
                              </div>
                              <div className="text-right">
                                {tx.price_usd != null && <span className="font-bold">${tx.price_usd.toFixed(2)}</span>}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {tx.timestamp ? fmtDate(tx.timestamp) : ""}
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
                    <p className="text-red-500 font-bold">{t("cube12.arx.not_found")}</p>
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
                  <h2 className="text-xl font-bold" style={{ color: "#3B82F6" }}>{t("cube12.arx.transfer_ownership")}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("cube12.arx.transfer_desc")}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t("cube12.arx.token_id")} *</label>
                    <input
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      placeholder="e.g. 123456789"
                      className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && transferTo.trim()) {
                          router.push(`/divinity-guide/arx?token=${transferTo.trim()}`);
                        }
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Found on the item QR code or registration receipt
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (transferTo.trim()) router.push(`/divinity-guide/arx?token=${transferTo.trim()}`);
                    }}
                    disabled={!transferTo.trim()}
                    className="w-full py-2.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 disabled:opacity-40 transition-all"
                  >
                    {t("cube12.arx.open_item_page")}
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
