import type { Metadata } from "next";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "Whale-Bridge | Swap Any Crypto to $WHITEWHALE",
  description:
    "The fastest cross-chain bridge to swap BTC, ETH, SOL and more directly into $WHITEWHALE on Solana. Deep sea tech, powered by ChangeNow.",
  keywords: ["WhiteWhale", "crypto swap", "bridge", "Solana", "BTC", "ETH", "SOL", "USDC", "ChangeNow"],
  openGraph: {
    title: "Whale-Bridge | Cross-Chain Gateway to $WHITEWHALE",
    description: "Swap any crypto directly into $WHITEWHALE on Solana.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ cursor: 'none' }}>
      <body className="antialiased" style={{ cursor: 'none' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          *, *::before, *::after,
          html, body,
          a, button, input, select, textarea, label,
          [role="button"], [tabindex] {
            cursor: none !important;
          }
        `}} />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
