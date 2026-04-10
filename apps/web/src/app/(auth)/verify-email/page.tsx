import { Suspense } from "react";
import VerifyEmailForm from "./verify-email-form";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-[#64748B] py-8">Loading…</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
