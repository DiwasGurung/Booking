'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronDown, Search, HelpCircle, BookOpen, MessageSquare, AlertCircle } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    category: 'bookings',
    question: 'How do I book a service?',
    answer: 'To book a service: 1) Search for a business, 2) Select a service, 3) Choose your preferred date and time, 4) Receive confirmation.'
  },
  {
    id: '2',
    category: 'bookings',
    question: 'Can I cancel my booking?',
    answer: 'Yes, you can cancel bookings up to 24 hours before the appointment. Go to "My Bookings" and click the cancel button. Cancellation fees may apply depending on the business policy.'
  },

  {
    id: '3',
    category: 'account',
    question: 'How do I create an account?',
    answer: 'Click "Sign Up" on the homepage, enter your email and create a password, then verify your email address. You can also sign up using your Google or social media account.'
  },
  {
    id: '4',
    category: 'account',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page, enter your email, and we will send you a link to reset your password. Follow the instructions in the email to create a new password.'
  },
  {
    id: '5',
    category: 'account',
    question: 'How do I update my profile?',
    answer: 'Go to Account Settings, click "Edit Profile", update your information, and click Save. You can change your name, phone number, email, and profile picture.'
  },
  {
    id: '6',
    category: 'business',
    question: 'How do I become a business owner?',
    answer: 'Click "Become a Business Owner" on the homepage, fill out the business registration form, verify your information, and set up your services. Your business will be reviewed before going live.'
  },
  {
    id: '7',
    category: 'business',
    question: 'How do I add services to my business?',
    answer: 'Log in to your business dashboard, go to "Services", click "Add Service", enter service details (name, description, price, duration), and save.'
  },
  {
    id:'8',
    category: 'business',
    question: 'How do I manage my business hours?',
    answer: 'Go to Business Settings, click "Business Hours", set your operating hours for each day, and save. You can also set holidays when your business is closed.'
  },
]

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const filteredFAQs = faqItems.filter((item) => {
    const matchesSearch = 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeTab === 'all') return matchesSearch
    return matchesSearch && item.category === activeTab
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-4">
            <HelpCircle className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Help & Support</h1>
          <p className="text-muted-foreground mb-8">Find answers to common questions or contact our support team</p>
        </div>

        {/* Search Bar */}
        <Card className="border border-border shadow-lg p-6 mb-8">
          <div className="flex gap-2">
            <Search className="w-5 h-5 text-muted-foreground mt-3" />
            <Input
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </Card>

        {/* Contact Support Card */}
        <Card className="border border-primary/20 bg-primary/5 shadow-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <MessageSquare className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Still need help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
              <div className="flex gap-2">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Contact Support
                </Button>
                <Button variant="outline">
                  Email us
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* FAQ Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3">
            {filteredFAQs.length === 0 ? (
              <Card className="border border-border shadow-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No results found. Try a different search.</p>
              </Card>
            ) : (
              filteredFAQs.map((item) => (
                <Card
                  key={item.id}
                  className="border border-border shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">{item.question}</h3>
                      {expandedId === item.id && (
                        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                          {item.answer}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-primary flex-shrink-0 transition-transform mt-1 ${
                        expandedId === item.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Additional Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-border shadow-lg p-6">
              <BookOpen className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Guides & Tutorials</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Step-by-step guides to help you get the most out of our platform.
              </p>
              <Button variant="outline" size="sm">View Guides</Button>
            </Card>

            <Card className="border border-border shadow-lg p-6">
              <HelpCircle className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Video Tutorials</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Watch video tutorials on how to use key features.
              </p>
              <Button variant="outline" size="sm">Watch Videos</Button>
            </Card>

            <Card className="border border-border shadow-lg p-6">
              <MessageSquare className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Community Forum</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with other users and share experiences.
              </p>
              <Button variant="outline" size="sm">Join Forum</Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
