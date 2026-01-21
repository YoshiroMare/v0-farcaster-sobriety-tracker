import type React from "react"
import type { Metadata } from "next"
import { Geist } from 'next/font/google'
import "./globals.css"

const geist = Geist({ 
  subsets: ["latin"],
  variable: "--font-geist"
})

export const metadata: Metadata = {
  title: "Sober - Sobriety Tracker",
  description: "Track your sobriety journey one day at a time",
  openGraph: {
    title: "Sober - Sobriety Tracker",
    description: "Track your sobriety journey one day at a time",
    images: [
      {
        url: "https://v0-farcaster-sobriety-tracker.vercel.app/image.png",
        width: 1200,
        height: 800,
        alt: "Sober App",
      },
    ],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: "https://v0-farcaster-sobriety-tracker.vercel.app/image.png",
      button: {
        title: "Stay Sober",
        action: {
          type: "launch_frame",
          name: "Sober",
          url: "https://v0-farcaster-sobriety-tracker.vercel.app",
          splashImageUrl: "https://v0-farcaster-sobriety-tracker.vercel.app/splash.png",
          splashBackgroundColor: "#FFFFFF",
        },
      },
    }),
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  )
}
