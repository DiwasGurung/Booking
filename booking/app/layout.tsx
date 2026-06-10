import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from 'sonner'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/context/authContext"
import LayoutClient from "@/components/LayoutClient"
import { GoogleAuthProvider } from "@/components/GoogleAuthProvider"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Appoint-Nepal - Simple Online Booking for Service Businesses",
  description:
    "The easiest way to manage bookings online. Let customers book appointments, reduce no-shows, and grow your business.",
  generator: "v0.app",
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
      <body className={`font-sans antialiased pt-16 flex flex-col min-h-screen`}>
        <AuthProvider>
          <GoogleAuthProvider>
            <LayoutClient>
              <Header />
              <main className="flex-1">
                <Toaster />
                {children}
              </main>
              <Footer />
            </LayoutClient>
          </GoogleAuthProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
