import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const omegle = localFont({
  src: "../public/fonts/OmegleRegular.woff",
  variable: "--font-omegle",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Location Restaurant | European & Arabic fusion menu",
  description: "Browse the digital menu at Location Restaurant: European finesse, Arabic soul.",
  openGraph: { title: "Location Restaurant", description: "European finesse. Arabic soul.", type: "website" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#202020" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${omegle.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
