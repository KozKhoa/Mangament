import { Suspense } from "react";
import RegisterPage from "./RegisterPage";

export const metadata = {
  title: "Đăng ký",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Đang tải...</div>}>
      <RegisterPage />
    </Suspense>
  );
}
