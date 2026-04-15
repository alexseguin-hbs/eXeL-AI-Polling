"use client";

/**
 * /divinity-guide/arx/[tokenId] — Individual Item Page
 *
 * Standalone provenance + transfer page for a single ARX-registered item.
 * Flow: Seller shares URL → Buyer sees item history → Buyer fills in details → Transfer.
 *
 * Sections:
 *   1. Item details (name, serial, identifiers, current owner)
 *   2. Ownership chain (every owner, price, date — collectibility proof)
 *   3. Transfer form (buyer fills in name, contact, price paid)
 *   4. QR receipts (buyer + seller after transfer)
 *
 * CRS: CRS-NEW-12.03 (Transfer), CRS-NEW-12.04 (Get item details)
 */

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

interface ArxTransaction {
  arx_tx_id: string;
  from_address: string | null;
  to_address: string;
  price_usd: number | null;
  transaction_type: string;
  created_at: string;
}

interface ArxItemFull {
  token_id: number;
  item_name: string;
  serial_number: string | null;
  identifiers: string | null;
  language: string;
  current_owner: string;
  purchase_price_usd: number | null;
  qr_code_url: string;
  chip_key_hash: string | null;
  created_at: string;
  last_transfer_at: string | null;
  transactions: ArxTransaction[];
}

function ItemPageInner() {
  const params = useParams();
  const tokenId = params.tokenId as string;

  const [item, setItem] = useState<ArxItemFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Transfer form — buyer fills in their details
  const [buyerName, setBuyerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<{
    arx_tx_id: string;
    buyer_qr_url: string;
    seller_qr_url: string;
  } | null>(null);

  // NFC chip states
  const [chipVerified, setChipVerified] = useState(false);
  const [chipProgrammed, setChipProgrammed] = useState(false);

  // Load item on mount
  useEffect(() => {
    if (!tokenId) return;
    loadItem(parseInt(tokenId));
  }, [tokenId]);

  const loadItem = useCallback(async (tid: number) => {
    setLoading(true);
    setError("");
    try {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) throw new Error("Supabase not available");

      const { data: itemData, error: itemErr } = await supabase
        .from("arx_items")
        .select("*")
        .eq("token_id", tid)
        .single();

      if (itemErr || !itemData) {
        setError("Item not found. Check the URL and try again.");
        return;
      }

      const { data: txData } = await supabase
        .from("arx_transactions")
        .select("*")
        .eq("token_id", tid)
        .order("created_at", { ascending: true });

      setItem({
        token_id: itemData.token_id,
        item_name: itemData.item_name,
        serial_number: itemData.serial_number,
        identifiers: itemData.identifiers || itemData.edition?.toString() || null,
        language: itemData.language || "en",
        current_owner: itemData.current_owner || "",
        purchase_price_usd: itemData.purchase_price_usd
          ? parseFloat(itemData.purchase_price_usd)
          : null,
        qr_code_url: itemData.qr_code_url || "",
        chip_key_hash: itemData.chip_key_hash || null,
        created_at: itemData.created_at,
        last_transfer_at: itemData.last_transfer_at,
        transactions: (txData || []).map((tx: any) => ({
          arx_tx_id: tx.arx_tx_id,
          from_address: tx.from_address,
          to_address: tx.to_address,
          price_usd: tx.price_usd ? parseFloat(tx.price_usd) : null,
          transaction_type: tx.transaction_type,
          created_at: tx.created_at,
        })),
      });
    } catch {
      setError("Could not load item. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle transfer — buyer submits their details
  const handleTransfer = useCallback(async () => {
    if (!item || !buyerName.trim()) return;
    setTransferring(true);
    setError("");
    try {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) throw new Error("Supabase not available");

      const now = new Date();
      const txId = `ARX-${now.getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const price = salePrice ? parseFloat(salePrice) : null;

      // Generate QR verification URLs
      const buyerHash = await crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(`${item.token_id}:${buyerName}:${now.toISOString()}`))
        .then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""));
      const buyerQr = `${window.location.origin}/divinity-guide/arx/${item.token_id}`;

      const sellerHash = await crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(`${item.token_id}:${item.current_owner}:sold:${now.toISOString()}`))
        .then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""));
      const sellerQr = `${window.location.origin}/divinity-guide/arx/${item.token_id}?verify=${sellerHash.slice(0, 16)}`;

      // Update ownership
      const newOwner = buyerContact.trim() || buyerName.trim();
      await supabase.from("arx_items").update({
        current_owner: newOwner,
        last_transfer_at: now.toISOString(),
        qr_code_url: buyerQr,
        ...(price !== null ? { purchase_price_usd: price } : {}),
      }).eq("token_id", item.token_id);

      // Log transaction
      await supabase.from("arx_transactions").insert({
        arx_tx_id: txId,
        token_id: item.token_id,
        from_address: item.current_owner,
        to_address: newOwner,
        price_usd: price,
        transaction_type: price ? "sale" : "transfer",
      });

      setTransferResult({
        arx_tx_id: txId,
        buyer_qr_url: buyerQr,
        seller_qr_url: sellerQr,
      });

      // Reload item to show updated ownership
      await loadItem(item.token_id);
    } catch (e: any) {
      setError(e.message || "Transfer failed. Please try again.");
    } finally {
      setTransferring(false);
    }
  }, [item, buyerName, buyerContact, salePrice, loadItem]);

  // NFC read — verify chip belongs to this item
  const handleNfcRead = useCallback(async () => {
    try {
      const { execHaloCmdWeb } = await import("@arx-research/libhalo/api/web");
      const info = await execHaloCmdWeb(
        { name: "sign", message: "00", keyNo: 1 },
        {
          statusCallback: (s: string) => {
            if (s === "init") {
              alert("Hold your ARX chip to the back of your phone.\n\nKeep it still until the read completes.");
            }
          },
        }
      );
      const chipAddr = info.etherAddress || "";
      if (!chipAddr) {
        setError("Could not read chip. Hold steady and try again.");
        return;
      }
      // Check if chip matches this item
      if (item?.chip_key_hash && chipAddr.toLowerCase() === item.chip_key_hash.toLowerCase()) {
        setChipVerified(true);
      } else if (item?.chip_key_hash) {
        setError("This chip does not match this item.");
      } else {
        setChipVerified(true); // No chip on file — accept any read as presence proof
      }
    } catch (e: any) {
      setError(e.message || "NFC read failed");
    }
  }, [item]);

  // NFC write — program chip to redirect to this item page when tapped
  // Uses set_url_subdomain only (NOT cfg_ndef which disables chip broadcast)
  const handleProgramChip = useCallback(async () => {
    if (!item) return;
    try {
      setError("");
      const { execHaloCmdWeb } = await import("@arx-research/libhalo/api/web");

      // Step 1: Read chip to get address + verify it works
      alert("Hold your ARX chip to the back of your phone.\n\nKeep it still until programming completes (2 taps needed).");

      const info = await execHaloCmdWeb(
        { name: "sign", message: "00", keyNo: 1 },
        { statusCallback: () => {} }
      );
      const chipAddr = info.etherAddress || "";
      if (!chipAddr) {
        setError("Could not read chip. Hold steady and try again.");
        return;
      }

      // Step 2: Write URL subdomain — chip will redirect to our item page
      // The chip base URL stays as-is; we append our path
      const itemPath = `divinity-guide/arx/${item.token_id}`;
      await execHaloCmdWeb(
        { name: "set_url_subdomain", url: `https://exel-ai-polling.explore-096.workers.dev/${itemPath}` },
        {
          statusCallback: (s: string) => {
            if (s === "init") {
              alert("Tap chip again to confirm URL programming.");
            }
          },
        }
      );

      // Step 3: Store chip address if not already linked
      if (!item.chip_key_hash) {
        const { supabase } = await import("@/lib/supabase");
        if (supabase) {
          await supabase.from("arx_items").update({
            chip_key_hash: chipAddr.toLowerCase(),
          }).eq("token_id", item.token_id);
        }
      }

      setChipProgrammed(true);
      setChipVerified(true);
    } catch (e: any) {
      setError("Chip programming failed: " + (e.message || "Unknown error. Try again."));
    }
  }, [item]);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading item...</p>
        </div>
      </div>
    );
  }

  // --- Error / not found ---
  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
            <span className="text-2xl text-red-400">?</span>
          </div>
          <h1 className="text-xl font-bold">Item Not Found</h1>
          <p className="text-sm text-muted-foreground">{error || "This item does not exist in the registry."}</p>
          <Link
            href="/divinity-guide/arx"
            className="inline-block px-4 py-2 border rounded-lg text-sm hover:bg-accent transition-colors"
          >
            ← Back to ARX
          </Link>
        </div>
      </div>
    );
  }

  // --- Transfer complete ---
  if (transferResult) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-6 py-12 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href="/divinity-guide/arx" className="flex items-center gap-1.5 hover:opacity-80">
              <span className="text-sm font-bold text-primary">eXeL</span>
              <span className="text-sm font-light text-primary/70">AI</span>
            </Link>
            <span className="text-xs text-muted-foreground">ARX Transfer Receipt</span>
          </div>

          {/* Success */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
              <span className="text-2xl text-green-500">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-green-500">Transfer Complete</h1>
            <p className="text-sm text-muted-foreground">{item.item_name}</p>
            <p className="text-xs text-muted-foreground font-mono">{transferResult.arx_tx_id}</p>
          </div>

          {/* QR Receipts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 border rounded-xl bg-card/80 text-center space-y-3">
              <p className="text-xs font-medium text-muted-foreground">New Owner</p>
              <div className="flex justify-center">
                <QRCodeSVG value={transferResult.buyer_qr_url} size={140} />
              </div>
              <p className="text-[10px] text-muted-foreground">Scan to view your item</p>
            </div>
            <div className="p-5 border rounded-xl bg-card/80 text-center space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Previous Owner</p>
              <div className="flex justify-center">
                <QRCodeSVG value={transferResult.seller_qr_url} size={140} />
              </div>
              <p className="text-[10px] text-muted-foreground">Your transfer receipt</p>
            </div>
          </div>

          {/* View item link */}
          <div className="text-center">
            <Link
              href={`/divinity-guide/arx/${item.token_id}`}
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all"
              onClick={() => setTransferResult(null)}
            >
              View Updated Item
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Main item page ---
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/divinity-guide/arx" className="flex items-center gap-1.5 hover:opacity-80">
            <span className="text-sm font-bold text-primary">eXeL</span>
            <span className="text-sm font-light text-primary/70">AI</span>
          </Link>
          <Link href="/divinity-guide/arx" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            ← ARX Registry
          </Link>
        </div>

        {/* ═══ ITEM DETAILS ═══ */}
        <div className="rounded-xl border bg-card/80 backdrop-blur-sm p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold leading-tight">{item.item_name}</h1>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Token #{item.token_id}
              </p>
            </div>
            {/* Chip verification badge */}
            {item.chip_key_hash && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-medium text-primary">NFC Chip</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Current Owner</p>
              <p className="font-medium truncate">{item.current_owner}</p>
            </div>
            {item.purchase_price_usd !== null && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Last Price</p>
                <p className="font-bold">${item.purchase_price_usd.toFixed(2)}</p>
              </div>
            )}
            {item.serial_number && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Serial</p>
                <p className="font-mono text-xs">{item.serial_number}</p>
              </div>
            )}
            {item.identifiers && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Identifiers</p>
                <p className="text-xs">{item.identifiers}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Registered</p>
              <p className="text-xs">{new Date(item.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Transfers</p>
              <p className="font-bold">{item.transactions.length}</p>
            </div>
          </div>

          {/* QR code */}
          {item.qr_code_url && (
            <div className="flex justify-center pt-2">
              <QRCodeSVG value={item.qr_code_url} size={100} />
            </div>
          )}

          {/* Verify NFC chip */}
          {item.chip_key_hash && !chipVerified && (
            <button
              onClick={handleNfcRead}
              className="w-full py-2.5 border border-primary/30 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors"
            >
              Tap NFC Chip to Verify
            </button>
          )}
          {chipVerified && !chipProgrammed && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-green-500/30 bg-green-500/5">
              <span className="text-green-500">✓</span>
              <p className="text-sm font-medium text-green-600">NFC chip verified — matches this item</p>
            </div>
          )}
          {chipProgrammed && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-green-500/30 bg-green-500/5">
              <span className="text-green-500">✓</span>
              <p className="text-sm font-medium text-green-600">Chip programmed — tapping it will open this page</p>
            </div>
          )}

          {/* Program chip — write item URL so tapping chip opens this page */}
          {!chipProgrammed && (
            <button
              onClick={handleProgramChip}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all"
            >
              Program Chip — Link to This Item
            </button>
          )}
          <p className="text-[10px] text-muted-foreground text-center">
            {chipProgrammed
              ? "Anyone who taps this chip will see this item page."
              : "Programs the NFC chip so tapping it opens this item page. The chip address stays readable."}
          </p>
        </div>

        {/* ═══ OWNERSHIP HISTORY ═══ */}
        {item.transactions.length > 0 && (
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Ownership History
            </h2>

            <div className="space-y-0">
              {item.transactions.map((tx, i) => {
                const isFirst = i === 0;
                const isLast = i === item.transactions.length - 1;
                return (
                  <div key={tx.arx_tx_id} className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        isLast ? "border-primary bg-primary" : "border-muted-foreground/30 bg-background"
                      }`} />
                      {!isLast && <div className="w-px flex-1 bg-muted-foreground/15 min-h-[40px]" />}
                    </div>

                    {/* Content */}
                    <div className="pb-5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          tx.transaction_type === "mint" ? "bg-green-500/10 text-green-600" :
                          tx.transaction_type === "sale" ? "bg-blue-500/10 text-blue-600" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {tx.transaction_type === "mint" ? "Registered" :
                           tx.transaction_type === "sale" ? "Sold" : "Transferred"}
                        </span>
                        {tx.price_usd !== null && (
                          <span className="text-sm font-bold">${tx.price_usd.toFixed(2)}</span>
                        )}
                      </div>
                      <p className="text-xs mt-1">
                        {isFirst ? (
                          <span>Registered by <span className="font-medium">{tx.to_address}</span></span>
                        ) : (
                          <span>
                            <span className="text-muted-foreground">{tx.from_address}</span>
                            {" → "}
                            <span className="font-medium">{tx.to_address}</span>
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ TRANSFER FORM — Buyer fills in details ═══ */}
        <div className="rounded-xl border bg-card/80 backdrop-blur-sm p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Transfer to New Owner
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              The new owner fills in their details below to complete the transfer.
              The item&apos;s ARX chip stays linked — only the ownership record changes.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">New Owner Name *</label>
              <input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Contact (email or phone)</label>
              <input
                value={buyerContact}
                onChange={(e) => setBuyerContact(e.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Used as your ownership identifier on this item
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Purchase Price (USD)</label>
              <input
                type="number" step="0.01" min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Leave empty if gift"
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/5 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={() => {
              const priceLabel = salePrice ? `$${parseFloat(salePrice).toFixed(2)}` : "gift";
              const confirmed = window.confirm(
                `Transfer "${item.item_name}" to ${buyerName.trim()}?\n\nType: ${priceLabel}\nFrom: ${item.current_owner}\nTo: ${buyerContact.trim() || buyerName.trim()}\n\nThis cannot be undone.`
              );
              if (confirmed) handleTransfer();
            }}
            disabled={!buyerName.trim() || transferring}
            className="w-full py-3 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 disabled:opacity-40 transition-all"
          >
            {transferring ? "Processing..." :
             salePrice ? `Complete Purchase — $${parseFloat(salePrice).toFixed(2)}` :
             "Accept as Gift"}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-[9px] text-muted-foreground/40">
            Powered by eXeL AI &middot; ARX Physically Backed Tokens
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ItemPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ItemPageInner />
    </Suspense>
  );
}
