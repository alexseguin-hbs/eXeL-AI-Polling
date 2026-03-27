import "./globals.css";
import { Suspense } from "react";
import { Providers } from "@/components/providers";
import { PoweredBadge } from "@/components/powered-badge";

export const metadata = {
  title: "eXeL AI Polling",
  description:
    "Fast, secure, large-group polling with AI theming and prioritization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {/* Build info banner — auto-populated at build time from git + timestamp */}
          <div className="w-full bg-zinc-900 border-b border-zinc-800 py-1 text-center font-mono text-xs text-zinc-400 tracking-wide">
            SHA:&nbsp;<span className="text-zinc-200">{process.env.NEXT_PUBLIC_GIT_SHA ?? 'dev'}</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            Date:&nbsp;<span className="text-zinc-200">{process.env.NEXT_PUBLIC_BUILD_DATE ?? '—'}</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            Time:&nbsp;<span className="text-zinc-200">{process.env.NEXT_PUBLIC_BUILD_TIME ?? '—'}</span>
          </div>
          {children}
          <Suspense>
            <PoweredBadge />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
