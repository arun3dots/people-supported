import localFont from "next/font/local";
import "./globals.css";
import { Metadata } from "next/types";
import { Toaster } from "@repo/ui/components/ui";
import Providers from "../lib/Providers";

const outfit = localFont({
  src: "./fonts/Outfit-VariableFont.woff2",
  variable: "--font-outfit",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Cantra Care",
  description: "Cantra Care — built to support care",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable} data-scroll-behavior="smooth">
      <body className="font-sans antialiased text-gray-900 bg-gray-50">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
