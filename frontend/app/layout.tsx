import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/frontend/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QA Checklist Automation",
  description: "Streamline your QA testing workflow with modular, reusable checklists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
