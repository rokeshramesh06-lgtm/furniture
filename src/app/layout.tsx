import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { CartProvider } from "@/components/cart-provider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atelier Form",
  description: "A furniture portfolio and ordering storefront built with Next.js and SQLite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={manrope.variable}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
