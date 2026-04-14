"use client";

/**
 * /divinity-guide/arx — NFT ARX Physically-Backed Token Verification
 *
 * 4 modes:
 *   Browse:   No params — show available editions + marketplace
 *   Verify:   ?token={id} — show ownership proof + authenticity
 *   Own:      Logged in + owns token — transfer/sell buttons
 *   ChipTap:  ?chip={uid} — NFC verification animation
 *
 * CRS: CRS-NEW-12.01 through 12.05
 * Inspired by Divinity Guide aesthetic (Flower of Life, theme colors)
 */

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

export default function ArxPage() {
  const searchParams = useSearchParams();
  const { t } = useLexicon();
  const tokenId = searchParams.get("token");
  const chipUid = searchParams.get("chip");
  const verifyHash = searchParams.get("verify");

  const [item, setItem] = useState<ArxItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "failed">("pending");

  // Determine mode
  const mode = useMemo(() => {
    if (chipUid) return "chip-tap";
    if (tokenId) return "verify";
    return "browse";
  }, [tokenId, chipUid]);

  // Fetch item data when token ID is present
  useEffect(() => {
    if (!tokenId && !chipUid) return;
    setLoading(true);
    const id = tokenId || "0";

    fetch(`/api/v1/arx/verify/${id}${chipUid ? `?chip_uid=${chipUid}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.verified) {
          setItem(data);
          setVerificationStatus("verified");
        } else {
          setVerificationStatus("failed");
          setError(data.reason || "Item not found");
        }
      })
      .catch(() => {
        setVerificationStatus("failed");
        setError("Verification service unavailable");
      })
      .finally(() => setLoading(false));
  }, [tokenId, chipUid]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header — matches Divinity Guide style */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/divinity-guide" className="flex items-center gap-2 hover:opacity-80">
            <span className="text-sm font-bold text-primary">eXeL</span>
            <span className="text-sm font-light text-primary/70">AI</span>
            <span className="text-xs text-muted-foreground">/ Divinity Guide / ARX</span>
          </Link>
        </div>
      </div>

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {/* Browse Mode */}
        {mode === "browse" && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">NFT ARX — Physically Backed Tokens</h1>
              <p className="text-muted-foreground">
                Own a physical copy of The Divinity Guide or any collectible with blockchain-verified authenticity.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Edition cards — 12 Ascended Masters editions */}
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="rounded-xl border bg-card p-6 hover:border-primary transition-colors">
                  <div className="text-center space-y-2">
                    <div className="text-4xl">✦</div>
                    <h3 className="font-bold">Edition {i + 1} of 12</h3>
                    <p className="text-xs text-muted-foreground">Ascended Master Edition</p>
                    <p className="text-lg font-bold text-primary">$33.33</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chip Tap Mode — NFC verification animation */}
        {mode === "chip-tap" && (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            {loading ? (
              <>
                <div className="w-24 h-24 rounded-full border-4 border-primary animate-ping" />
                <p className="text-lg font-bold">Verifying ARX chip...</p>
              </>
            ) : verificationStatus === "verified" && item ? (
              <>
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-4xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-green-500">Authenticated</h2>
                <p className="text-muted-foreground">{item.item_name}</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-4xl">✗</span>
                </div>
                <h2 className="text-2xl font-bold text-red-500">Unverified</h2>
                <p className="text-muted-foreground">{error}</p>
              </>
            )}
          </div>
        )}

        {/* Verify Mode — item details + ownership proof */}
        {mode === "verify" && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : verificationStatus === "verified" && item ? (
              <>
                {/* Verification banner */}
                <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
                  <p className="text-green-500 font-bold">✓ This item is authenticated on Quai blockchain</p>
                </div>

                {/* Item details */}
                <div className="rounded-xl border bg-card p-6 space-y-4">
                  <h2 className="text-2xl font-bold">{item.item_name}</h2>
                  {item.serial_number && (
                    <p className="text-sm text-muted-foreground">Serial: {item.serial_number}</p>
                  )}
                  {item.edition > 0 && (
                    <p className="text-sm">Edition {item.edition} of 12 — Ascended Master Edition</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Owner</p>
                      <p className="font-mono text-xs">{item.current_owner?.slice(0, 20)}...</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Purchase Price</p>
                      <p className="font-bold">${item.purchase_price_usd?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Minted</p>
                      <p>{item.minted_at ? new Date(item.minted_at).toLocaleDateString() : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transfers</p>
                      <p>{item.transaction_count}</p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                {item.qr_code_url && (
                  <div className="flex flex-col items-center space-y-2 p-6 border rounded-xl">
                    <QRCodeSVG value={item.qr_code_url} size={200} />
                    <p className="text-xs text-muted-foreground">Scan to verify</p>
                  </div>
                )}

                {/* Transaction History */}
                {item.transactions && item.transactions.length > 0 && (
                  <div className="rounded-xl border bg-card p-6">
                    <h3 className="font-bold mb-4">Transaction History</h3>
                    <div className="space-y-2">
                      {item.transactions.map((tx) => (
                        <div key={tx.arx_tx_id} className="flex justify-between text-sm border-b pb-2">
                          <div>
                            <span className="font-mono text-xs">{tx.arx_tx_id}</span>
                            <span className="ml-2 text-muted-foreground">{tx.type}</span>
                          </div>
                          <div className="text-right">
                            {tx.price_usd && <span className="font-bold">${tx.price_usd.toFixed(2)}</span>}
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
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by eXeL AI — Physically Backed Tokens on Quai Network
        </p>
      </footer>
    </div>
  );
}
