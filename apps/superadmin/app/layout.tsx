import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@repo/ui/components/ui";
import Providers from "../lib/Providers";

const outfit = localFont({
  src: "./fonts/Outfit-VariableFont.woff2",
  variable: "--font-outfit",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SuperAdmin | SaaS Control Panel",
  description: "Management dashboard for SaaS platform product owners.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased text-gray-900 bg-gray-50">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
