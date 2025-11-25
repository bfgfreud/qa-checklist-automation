import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "QA Checklist Automation - Bonfire Gathering",
  description: "QA Checklist Automation Tool",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-dark-bg text-dark-text-primary">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
