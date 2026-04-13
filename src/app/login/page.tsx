import { Suspense } from "react";
import LoginPage from "@/views/LoginPage";

export default function LoginRoute() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
