export const metadata = {
  title: 'eXeL AI Polling',
  description: 'Fast, secure, large-group polling with AI theming and prioritization',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
