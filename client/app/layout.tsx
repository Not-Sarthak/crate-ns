import React from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={`bg-[#f2ece5] text-black font-mono ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className={`h-[full] min-h-screen`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

export const metadata = {
  title: 'crate',
  description: 'tutorial generator for your documentation',
}
