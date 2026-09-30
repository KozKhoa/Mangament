import type { Metadata } from "next";
import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextAuthProvider } from "@/contexts/NextAuthProvider";
import { AppProvider } from "@/contexts/AppContext";
import { AdminProvider } from "@/contexts/AdminContext";
import AdminSidebar from "@/components/layouts/sidebar/sidebar-admin";
import AdminGuard from "@/components/guards/admin-guard";
import { ModalRoot } from "@/components/modal/modal-root";
import TopLoadingRoot from "@/components/loadings/loading-bar/top-loading-bar";
import { Toaster } from "sonner";
import { Afacad, Holtwood_One_SC, Geist_Mono, Geist, Roboto, Aclonica } from "./font";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mangament Admin",
    template: "%s | Mangament Admin",
  },
  description: "Management Dashboard for Manga Platform",
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
          text-sm font-afacad bg-background text-foreground relative min-h-screen
        `}
      >
        <AppProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
            <NextAuthProvider>
              <AuthProvider>
                <TopLoadingRoot />
                <Suspense>
                  <AdminProvider>
                    <AdminGuard>
                      <div className="flex flex-col md:flex-row min-h-screen w-full bg-background">
                        <AdminSidebar />
                        <main className="flex-1 p-4 md:p-8 max-w-[1800px] w-full mx-auto overflow-x-hidden">{children}</main>
                      </div>
                    </AdminGuard>
                  </AdminProvider>
                </Suspense>
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
