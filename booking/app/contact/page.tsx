'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Mail, Phone, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <Breadcrumbs />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Contact Us</h1>
          <p className="text-muted-foreground">We&apos;d love to hear from you. Get in touch with our team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-border shadow-lg p-6 text-center">
            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Email</h3>
            <p className="text-muted-foreground mb-4">support@bookflow.com</p>
            <a href="mailto:support@bookflow.com">
              <Button variant="outline" className="w-full">Send Email</Button>
            </a>
          </Card>

          <Card className="border border-border shadow-lg p-6 text-center">
            <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Phone</h3>
            <p className="text-muted-foreground mb-4">+1 (555) 123-4567</p>
            <a href="tel:+15551234567">
              <Button variant="outline" className="w-full">Call Us</Button>
            </a>
          </Card>

          <Card className="border border-border shadow-lg p-6 text-center">
            <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Live Chat</h3>
            <p className="text-muted-foreground mb-4">Available 24/7</p>
            <Button variant="outline" className="w-full">Start Chat</Button>
          </Card>
        </div>

        <Card className="border border-border shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Send Us a Message</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input 
                  type="text" 
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input 
                  type="email" 
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
              <input 
                type="text" 
                placeholder="How can we help?"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Message</label>
              <textarea 
                placeholder="Your message here..."
                rows={6}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>

            <Button className="w-full">Send Message</Button>
          </form>
        </Card>

        <Card className="border border-border shadow-lg p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Other Resources</h2>
          <div className="space-y-3">
            <Link href="/help">
              <Button variant="ghost" className="w-full justify-start text-left">
                FAQ & Help Center
              </Button>
            </Link>
            <Link href="/privacy">
              <Button variant="ghost" className="w-full justify-start text-left">
                Privacy Policy
              </Button>
            </Link>
            <Link href="/terms">
              <Button variant="ghost" className="w-full justify-start text-left">
                Terms of Service
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
