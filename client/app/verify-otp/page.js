import { Suspense } from "react";
import dynamic from "next/dynamic";

const VerifyOtpPageContent = dynamic(() => import("./VerifyOtpPageContent.js"));

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <VerifyOtpPageContent />
    </Suspense>
  );
}