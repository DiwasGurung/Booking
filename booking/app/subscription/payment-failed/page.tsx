import PaymentFailedContent from "@/components/subscription/paymentFailedPage";
import { Suspense } from "react";

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
