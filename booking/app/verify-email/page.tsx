import { Suspense } from "react"
import VerifyEmailClient from "@/components/VerifyEmailClient"

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <VerifyEmailClient />
    </Suspense>
  )
}