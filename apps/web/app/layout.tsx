import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Amphi - University Social Network",
  description: "A university social platform for communities, discussions, and study resources.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
            <footer className="border-t bg-card/50">
              <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
                Amphi — university communities, posts, and study resources.
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
