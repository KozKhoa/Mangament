"use client";

import Footer from "@/components/layouts/footer";
import HeaderBar from "@/components/layouts/header";

// app/(user)/layout.tsx
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <HeaderBar className="fixed left-2.5 right-2.5" />

      <div className="max-w-[1600px] m-auto transition-all duration-300">
        <div className="max-w-[1500px] m-auto">{children}</div>
      </div>

      <Footer></Footer>
    </div>
  );
}
