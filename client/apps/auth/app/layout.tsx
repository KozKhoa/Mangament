import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextAuthProvider } from "@/contexts/NextAuthProvider";
import { AppProvider } from "@/contexts/AppContext";
import { ModalRoot } from "@/components/modal/modal-root";
import TopLoadingRoot from "@/components/loadings/loading-bar/top-loading-bar";
import { Toaster } from "sonner";
import HeaderBar from "@/components/layouts/header";
import { Afacad, Holtwood_One_SC, Geist_Mono, Geist, Roboto, Aclonica } from "./font";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tài Khoản | Mangament",
    template: "%s | Mangament",
  },
  description: "Cổng xác thực & đăng nhập tài khoản Mangament",
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
                <div className="flex flex-col min-h-screen">
                  <HeaderBar className="fixed left-2.5 right-2.5 z-40" autoHide={false} />
                  <main className="flex-1 max-w-[2000px] m-auto mt-20 px-4 sm:px-8 w-full">{children}</main>
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
