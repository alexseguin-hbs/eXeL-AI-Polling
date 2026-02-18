import "./globals.css";
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
          {children}
          <PoweredBadge />
        </Providers>
      </body>
    </html>
  );
}
