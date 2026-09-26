import type { Metadata } from "next";
import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextAuthProvider } from "@/contexts/NextAuthProvider";
import { AppProvider } from "@/contexts/AppContext";
import { AdminProvider } from "@/contexts/AdminContext";
import HeaderBar from "@/components/layouts/header";
import AdminSidebar from "@/components/layouts/sidebar/sidebar-admin";
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${Geist.variable} ${Geist_Mono.variable} ${Afacad.variable} ${Holtwood_One_SC.variable} ${Roboto.variable} ${Aclonica.variable} antialiased
          text-size-default font-afacad bg-background relative
        `}
      >
        <AppProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
            <NextAuthProvider>
              <AuthProvider>
                <TopLoadingRoot />
                <Suspense>
                  <AdminProvider>
                    <div className="flex flex-row w-full h-fit">
                      <HeaderBar className="fixed left-2.5 right-2.5 z-40" autoHide={false} />
                      <AdminSidebar />
                      <div className="max-w-[2000px] m-auto mt-16 px-2 md:px-10 w-full bg-background">
                        {children}
                        <div className="w-full h-24"></div>
                      </div>
                    </div>
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
