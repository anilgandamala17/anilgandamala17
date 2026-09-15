import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { AuthProvider } from '@/components/auth-provider'
import { AuthDomainGuard } from '@/components/auth-domain-guard'
import { AnalyticsPageReporter } from '@/components/analytics-page-reporter'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'Aɪra — AI-Powered Learning Platform',
  description:
    'Master boards, JEE, NEET, and professional skills with personalized AI tutoring — visual lessons, voice teaching, and adaptive practice.',
  icons: {
    icon: [{ url: '/aira-logo.png', type: 'image/png' }],
    apple: [{ url: '/aira-logo.png', type: 'image/png' }],
    shortcut: ['/aira-logo.png'],
  },
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" href="/aira-logo.png" as="image" type="image/png" />
      </head>
      <body className="font-sans antialiased relative isolate" suppressHydrationWarning>
        {/* FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md */}
        <AuthDomainGuard />
        <AuthProvider>
          <AnalyticsPageReporter />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
