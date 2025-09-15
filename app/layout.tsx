import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

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
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
