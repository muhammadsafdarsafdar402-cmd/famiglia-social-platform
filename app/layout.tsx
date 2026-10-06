import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConnectivityGuard from "@/components/ConnectivityGuard";
import { EmojiProvider } from "@/components/EmojiContext"; // <--- 1. IMPORT THIS
import "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Famiglia Oro CS",
  description: "Golden Family Creator Suite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 2. WRAP YOUR APP WITH THE PROVIDER */}
        <EmojiProvider>
            <ConnectivityGuard>
              {children}
            </ConnectivityGuard>
        </EmojiProvider>
      </body>
    </html>
  );
}