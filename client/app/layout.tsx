import type { Metadata } from "next";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextAuthProvider } from "@/contexts/NextAuthProvider";
import { AppProvider } from "@/contexts/AppContext";

import { Toaster } from "sonner";

import { Afacad, Holtwood_One_SC, Geist_Mono, Geist, Roboto, Aclonica } from "./font";

import "./globals.css";

import { ModalRoot } from "@/components/modal/modal-root";
import TopLoadingRoot from "@/components/loadings/loading-bar/top-loading-bar";

export const metadata: Metadata = {
  title: {
    default: "Mangament",
    template: "%s | Mangament",
  },
  description: "Read manga and novels online",
  applicationName: "Mangament",
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

                <div>{children}</div>

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
