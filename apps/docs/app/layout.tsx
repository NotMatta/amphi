import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";
import "./docs.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Amphi Docs",
  description: "Setup, run, and architecture documentation for the Amphi project.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} doc-shell`}>
        <header className="doc-header">
          <div className="doc-header-inner">
            <Link href="/" className="doc-brand">
              Amphi <span>Docs</span>
            </Link>
            <nav className="doc-nav" aria-label="Documentation">
              <Link href="/">Overview</Link>
              <Link href="/setup">Setup &amp; Run</Link>
              <Link href="/architecture">Architecture</Link>
            </nav>
          </div>
        </header>
        <main className="doc-main doc-prose">{children}</main>
      </body>
    </html>
  );
}
