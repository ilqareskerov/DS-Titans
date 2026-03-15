import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CommunityPulse Admin ⚡ — AI-Powered Community Management",
  description: "Admin dashboard for creating and distributing content to your community platforms. AI-powered post generation, quiz creation, and multi-platform sharing.",
  keywords: ["CommunityPulse", "Community Management", "AI", "Admin Dashboard", "Quiz", "Social Media"],
  authors: [{ name: "CommunityPulse Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "CommunityPulse Admin ⚡",
    description: "AI-Powered Community Management Dashboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CommunityPulse Admin ⚡",
    description: "AI-Powered Community Management Dashboard",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
