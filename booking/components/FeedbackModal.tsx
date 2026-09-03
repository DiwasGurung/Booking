'use client'

import { useState } from 'react'
import { X, MessageSquarePlus, CheckCircle2 } from 'lucide-react'

type FeedbackType = 'bug' | 'feature' | 'other'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  role?: 'customer' | 'business_owner' | 'staff' | 'visitor'
  businessName?: string
  defaultEmail?: string
  defaultName?: string
}

export function FeedbackModal({
  isOpen,
  onClose,
  role = 'visitor',
  businessName,
  defaultEmail = '',
  defaultName = '',
}: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>('feature')
  const [message, setMessage] = useState('')
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (message.trim().length < 5) {
      setError('Please add a little more detail.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback`, {
  method: 'POST',
  credentials: 'include', // sends the auth cookie if the user is logged in
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type,
    message: message.trim(),
    name: name.trim() || undefined,
    email: email.trim() || undefined,
    businessName,
    page: typeof window !== 'undefined' ? window.location.pathname : undefined,
  }),
})

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setSubmitted(true)
      setMessage('')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSubmitted(false)
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-teal-600" />
            Share Feedback
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto mb-4" />
            <p className="text-slate-800 font-medium mb-1">Thanks for the feedback!</p>
            <p className="text-sm text-slate-500 mb-6">We read every submission.</p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
              <div className="flex gap-2">
                {(['feature', 'bug', 'other'] as FeedbackType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      type === t
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    {t === 'feature' ? 'Suggestion' : t === 'bug' ? 'Bug' : 'Other'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Your message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={
                  type === 'bug'
                    ? "What happened, and what did you expect instead?"
                    : "What would make Appoint-Nepal better for you?"
                }
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}