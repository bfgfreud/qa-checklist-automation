import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QA Checklist Automation - Bonfire Gathering",
  description: "QA Checklist Automation Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
