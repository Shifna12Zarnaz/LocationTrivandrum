import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
    <html lang="en" className={omegle.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
