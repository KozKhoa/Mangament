import { Suspense } from "react";
import LoginPage from "./LoginPage";

export const metadata = {
  title: "Đăng nhập",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Đang tải...</div>}>
      <LoginPage />
    </Suspense>
  );
}
