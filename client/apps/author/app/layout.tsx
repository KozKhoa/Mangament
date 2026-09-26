import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextAuthProvider } from "@/contexts/NextAuthProvider";
import { AppProvider } from "@/contexts/AppContext";
import { ModalRoot } from "@/components/modal/modal-root";
import TopLoadingRoot from "@/components/loadings/loading-bar/top-loading-bar";
import { Toaster } from "sonner";
import { Afacad, Holtwood_One_SC, Geist_Mono, Geist, Roboto, Aclonica } from "./font";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mangament Creator Studio",
    template: "%s | Mangament Creator Studio",
  },
  description: "Portal dành cho Tác giả quản lý và sáng tác truyện",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${Geist.variable} ${Geist_Mono.variable} ${Afacad.variable} ${Holtwood_One_SC.variable} ${Roboto.variable} ${Aclonica.variable} antialiased
          text-size-default font-afacad bg-background text-foreground relative min-h-screen
        `}
      >
        <AppProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
            <NextAuthProvider>
              <AuthProvider>
                <TopLoadingRoot />

                {/* Author Portal Layout */}
                <div className="min-h-screen flex flex-col">
                  {/* Top Navigation Bar */}
                  <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
                      <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                          <span className="text-primary font-holtwood">MANGAMENT</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Studio</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
                          <Link href="/" className="transition-colors hover:text-primary">
                            Tổng quan
                          </Link>
                          <Link href="/stories" className="transition-colors hover:text-primary">
                            Truyện của tôi
                          </Link>
                          <Link href="/stories/create" className="transition-colors hover:text-primary">
                            Đăng truyện mới
                          </Link>
                        </nav>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href="/stories/create"
                          className="hidden sm:inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                        >
                          + Thêm tác phẩm
                        </Link>
                      </div>
                    </div>
                  </header>

                  {/* Main Content Area */}
                  <main className="flex-1 container px-4 sm:px-8 py-6 max-w-7xl mx-auto">{children}</main>
                </div>

                <Toaster position="top-center" />
                <ModalRoot />
              </AuthProvider>
            </NextAuthProvider>
          </ThemeProvider>
        </AppProvider>
      </body>
    </html>
  );
}
