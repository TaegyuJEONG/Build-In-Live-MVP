import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'BUILD_IN_LIVE - Precision Isometric Grid',
  description: 'Real-time node visualization and deployment dashboard',
  generator: 'v0.app',
  icons: {
    icon: '/favicon.png',
  },
}

import AuthGuard from '@/components/AuthGuard'
import { AuthPromptModal } from '@/components/AuthPromptModal'


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-mono antialiased bg-[#0a0a0a]">

                  <AuthGuard>
                    {children}
                  </AuthGuard>
                  <AuthPromptModal />
                  <Analytics />
                </body>
    </html>
  )
}
