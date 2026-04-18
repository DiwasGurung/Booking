'use client'

import type React from "react"
import Link from "next/link"
import { ArrowRight, Calendar, Shield, Zap, TrendingUp, Users, Smartphone } from "lucide-react"
import { useAuth } from "@/context/authContext"
import { useEffect } from "react" 
import { useRouter } from "next/navigation"

export default function HomePage() {
  // const { user } = useAuth()
  // const router = useRouter()

  // // Redirect logged-in users to appropriate page
  // useEffect(() => {
  //   if (user) {
  //     if (user.role === 'CUSTOMER') {
  //       router.push('/search')
  //     } 
  //   }
  // }, [user, router])

  return (
    <main className="min-h-screen bg-background">

      {/* HERO SECTION */}
      <section className="relative px-6 py-24 md:py-32 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-2 bg-accent/10 rounded-full border border-accent/30">
            <span className="text-sm font-medium text-accent">✨ Trusted by 500+ businesses</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
            The simplest way to manage bookings
          </h1>

          <p className="text-xl text-foreground/60 mb-8 max-w-2xl text-balance leading-relaxed">
            Let customers book appointments online while you focus on growing your business. No complex setup needed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link
              href="/search"
              className="group bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition w-fit"
            >
              Start Booking Today
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="/register-business"
              className="border border-border bg-card hover:bg-muted/50 text-foreground px-8 py-3 rounded-lg font-semibold transition w-fit"
            >
              For Business Owners
            </Link>
          </div>

          <p className="text-sm text-foreground/50">🎉 Free for first 30 days. No credit card required.</p>
        </div>

        {/* Background decoration */}
        <div className="absolute -z-10 top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="px-6 py-20 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything you need to succeed</h2>
            <p className="text-lg text-foreground/60">Powerful features designed for modern service businesses</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Calendar}
              title="Smart Scheduling"
              description="Automated booking system that syncs with your calendar in real-time, avoiding double bookings."
            />
            <FeatureCard
              icon={Smartphone}
              title="Mobile Friendly"
              description="Your customers can book on any device. Beautiful, responsive design every time."
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Reliable"
              description="Enterprise-grade security with 99.9% uptime. Your data is always protected."
            />
            <FeatureCard
              icon={Users}
              title="Team Management"
              description="Manage multiple staff members, assign appointments, and track team performance."
            />
            <FeatureCard
              icon={Zap}
              title="Instant Notifications"
              description="Automated SMS and email reminders reduce no-shows by up to 40%."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Business Analytics"
              description="Track bookings, revenue, and customer insights with detailed reports."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground text-center mb-16">How it works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Set up your profile"
              description="Add your business details, services, and availability in minutes."
            />
            <StepCard
              number="2"
              title="Share your booking link"
              description="Send customers a unique link or embed booking on your website."
            />
            <StepCard
              number="3"
              title="Start receiving bookings"
              description="Get instant notifications and manage all appointments from one dashboard."
            />
          </div>
        </div>
      </section>

      {/* INDUSTRY SHOWCASE */}
      <section className="px-6 py-20 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">Built for every industry</h2>
          <p className="text-center text-foreground/60 mb-12">
            From salons to consulting, BookFlow works for any service-based business
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Salons & Spas",
              "Medical Clinics",
              "Fitness Studios",
              "Consulting",
              "Photography",
              "Repair Services",
              "Education",
              "Beauty Services",
            ].map((industry) => (
              <div
                key={industry}
                className="bg-background rounded-lg p-4 text-center border border-border hover:border-accent/50 transition"
              >
                <p className="text-sm font-medium text-foreground">{industry}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUSINESS CTA */}
      <section id="pricing" className="px-6 py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Double your bookings</h2>
          <p className="text-lg opacity-90 mb-8">
            Join businesses that have increased their online bookings by an average of 150%
          </p>

          <div className="bg-primary-foreground/10 rounded-lg p-8 mb-8 border border-primary-foreground/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <div className="text-3xl font-bold mb-1">150%</div>
                <p className="text-sm opacity-75">Avg. booking increase</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">40%</div>
                <p className="text-sm opacity-75">Fewer no-shows</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">2hrs</div>
                <p className="text-sm opacity-75">Setup time</p>
              </div>
            </div>
          </div>

          <Link
            href="/register"
            className="inline-block bg-primary-foreground text-primary px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Register Your Business Free
          </Link>
        </div>
      </section>

    </main>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="bg-background rounded-xl border border-border p-6 hover:border-accent/50 hover:shadow-lg transition">
      <Icon className="w-8 h-8 text-accent mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-foreground/60">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="relative">
      <div className="mb-4">
        <div className="w-12 h-12 rounded-full bg-accent/10 border-2 border-accent text-accent flex items-center justify-center font-bold text-lg">
          {number}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-foreground/60">{description}</p>
    </div>
  )
}
