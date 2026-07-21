import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brolife",
  description: "A supportive AI productivity companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body>
        <AppSidebar />
        <div className="min-h-screen lg:pl-64">
          <AppHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
