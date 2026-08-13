import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ToasterProvider } from "@/components/providers/toast-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/context/authContext"
import LayoutClient from "@/components/LayoutClient"
import { GoogleAuthProvider } from "@/components/GoogleAuthProvider"



const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const siteUrl = "https://appointnepal.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Appoint Nepal | Online Appointment Booking Platform",
    template: "%s | Appoint Nepal",
  },
  description:
    "Book appointments online in Nepal with Appoint Nepal. Discover local businesses, salons, clinics, consultants, and service providers, or grow your business with online booking.",
  keywords: [
    "appointment booking Nepal",
    "online booking Nepal",
    "book appointments online",
    "business appointment scheduling",
    "salon booking Nepal",
    "clinic appointment booking Nepal",
    "Appoint Nepal",
    "appointment booking Kathmandu",
    "appointment booking Pokhara",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Appoint Nepal",
    title: "Appoint Nepal | Online Appointment Booking",
    description: "Find businesses and book appointments online across Nepal.",
    locale: "en_NP",
  },
  twitter: {
    card: "summary_large_image",
    title: "Appoint Nepal | Online Appointment Booking",
    description: "Find businesses and book appointments online across Nepal.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  generator: "Appoint Nepal",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>

        <AuthProvider>
          <GoogleAuthProvider>
            <LayoutClient>
              <Header />
              <main className="flex-1">    
                {children}
              </main>
              <Footer />
            </LayoutClient>
          </GoogleAuthProvider>
        </AuthProvider>
        <Analytics />
        <ToasterProvider />
      </body>
    </html>
  )
}
