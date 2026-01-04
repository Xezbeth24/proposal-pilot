import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/ui/providers/AuthProvider";
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProposalPilot - AI Upwork Proposal Generator",
  description: "Generate winning Upwork proposals in seconds using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider> 
          {children} 
          {/* 1. This adds the notification popups to your app */}
          <Toaster position="top-center" richColors />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
