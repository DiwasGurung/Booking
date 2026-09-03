'use client'

import { useState } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import { FeedbackModal } from './FeedbackModal'

interface FeedbackFloatingButtonProps {
  role?: 'business_owner' | 'staff'
  businessName?: string
  defaultEmail?: string
  defaultName?: string
}

export function FeedbackFloatingButton({
  role = 'business_owner',
  businessName,
  defaultEmail,
  defaultName,
}: FeedbackFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-teal-600 text-white pl-3 pr-4 py-3 rounded-full shadow-lg hover:bg-teal-700 transition"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Feedback</span>
      </button>

      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        role={role}
        businessName={businessName}
        defaultEmail={defaultEmail}
        defaultName={defaultName}
      />
    </>
  )
}