import type { Metadata } from "next";
import { Inter, Space_Mono, VT323 } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { PageTransition } from "@/components/layout/PageTransition";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Lodus — Our group. Our games. Our space.",
  description: "The official home of the Lodus friend group.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${spaceMono.variable} ${vt323.variable} min-h-screen antialiased`}>
        <SessionProvider>
          <PageTransition>
            <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
          </PageTransition>
        </SessionProvider>
      </body>
    </html>
  );
}
