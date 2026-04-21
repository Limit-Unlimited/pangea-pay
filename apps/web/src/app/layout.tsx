import type { Metadata } from "next";
import { Inter, Lato } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets:  ["latin"],
  display:  "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets:  ["latin"],
  weight:   ["400", "700"],
  style:    ["normal", "italic"],
  display:  "swap",
});

export const metadata: Metadata = {
  title:       "Pangea Pay",
  description: "Send money globally with Pangea Pay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lato.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8FBEF] font-[family-name:var(--font-inter)]">{children}</body>
    </html>
  );
}
