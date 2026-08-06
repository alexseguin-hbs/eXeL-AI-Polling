import "./globals.css";
import { Providers } from "@/components/providers";

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
          {/* Build info banner — auto-populated at build time from git + timestamp.
              `id` is load-bearing: this strip is shared chrome above every route (41px on
              a phone, 25px on desktop), so a page that claims the whole viewport has to
              subtract it. SiteFooter measures it by this id and publishes the total as
              `--site-chrome-h`. Renaming or removing the id breaks that measurement, and
              tests/site-footer-height.test.mjs fails if it goes missing. */}
          <div
            id="site-build-banner"
            className="w-full bg-zinc-900 border-b border-zinc-800 py-1 text-center font-mono text-xs text-zinc-400 tracking-wide"
          >
            SHA:&nbsp;<span className="text-zinc-200">{process.env.NEXT_PUBLIC_GIT_SHA ?? 'dev'}</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            Date:&nbsp;<span className="text-zinc-200">{process.env.NEXT_PUBLIC_BUILD_DATE ?? '—'}</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            Time:&nbsp;<span className="text-zinc-200">{process.env.NEXT_PUBLIC_BUILD_TIME ?? '—'}</span>
          </div>
          {/* Feedback + eXeL AI now live in an in-flow footer at the bottom of every page
              (rendered by Providers → SiteFooter), no longer fixed-floating over content. */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
