import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Integration Centre | FP&A",
  description: "Governed data integration foundation for AI-powered FP&A."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
