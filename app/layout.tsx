import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavigationProgress } from "@/components/navigation-progress";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OutreachOS - LinkedIn Outreach Platform",
  description: "Run outreach campaigns using your LinkedIn network data and email",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}
