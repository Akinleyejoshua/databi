import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: "Data BI — Business Intelligence Platform",
  description: "Build powerful dashboards and gain insights from your data with Data BI. Import Excel/CSV, create stunning visualizations, and share with stakeholders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={bricolage.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
