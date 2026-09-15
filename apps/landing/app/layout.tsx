import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { AuthProvider } from '@/components/auth-provider'
import { AuthDomainGuard } from '@/components/auth-domain-guard'
import { AnalyticsPageReporter } from '@/components/analytics-page-reporter'
import { BRAND } from '@/lib/site'
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
  // Literal icon URLs — Next IconsMetadata calls url.toString(); undefined
  // BRAND keys (e.g. HMR mismatch faviconSrc vs faviconIco) crash GET /.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
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
        <link rel="preload" href={BRAND.iconSrc} as="image" type="image/png" />
        <link rel="preload" href={BRAND.heroSrc} as="image" type="image/png" />
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
