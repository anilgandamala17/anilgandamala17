'use client'

import Link from 'next/link'
import { Instagram } from 'lucide-react'
import { AudienceNavLink } from '@/components/audience-nav-link'
import { BrandIcon, BrandWordmark } from '@/components/brand'
import { CTAS, EXTERNAL, BRAND, SOCIAL } from '@/lib/site'

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.851L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  )
}

interface FooterProps {
  onContactClick?: () => void
}

export function Footer({ onContactClick }: FooterProps) {
  return (
    <footer className="relative overflow-hidden bg-slate-950 pt-24 pb-12 text-white">
      <div className="pointer-events-none absolute top-0 left-1/4 -z-0 h-[600px] w-[600px] rounded-full bg-purple-900/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-0 -z-0 h-[500px] w-[500px] rounded-full bg-blue-900/10 blur-[120px]" />

      <div className="container relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-8 flex items-center space-x-2">
              <Link href="/" aria-label={BRAND.name} className="inline-flex items-center gap-2.5">
                <BrandIcon size={44} className="size-11" />
                <BrandWordmark
                  tone="inherit"
                  className="bg-gradient-to-r from-sky-300 via-blue-400 to-cyan-300 bg-clip-text text-3xl font-black tracking-tighter text-transparent"
                />
              </Link>
            </div>
            <p className="mb-6 max-w-sm text-lg leading-relaxed text-slate-400">
              Revolutionizing education with personalized AI. Empowering the next
              generation of learners with adaptive paths.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={SOCIAL.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${BRAND.name} on Instagram`}
                className="inline-flex size-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 transition-colors hover:border-pink-500/50 hover:bg-pink-500/10 hover:text-pink-300"
              >
                <Instagram className="size-4" strokeWidth={1.75} />
              </a>
              <a
                href={SOCIAL.x.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${BRAND.name} on X`}
                className="inline-flex size-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 transition-colors hover:border-slate-400 hover:bg-white/10 hover:text-white"
              >
                <XIcon className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-bold tracking-wide text-white uppercase">
              Product
            </h4>
            <ul className="space-y-4 text-slate-400">
              <li>
                <Link
                  href="/#features"
                  className="transition-colors duration-300 hover:text-blue-400"
                >
                  Features
                </Link>
              </li>
              <li>
                <AudienceNavLink
                  audience="schools"
                  className="transition-colors duration-300 hover:text-blue-400"
                >
                  {EXTERNAL.schools.label}
                </AudienceNavLink>
              </li>
              <li>
                <AudienceNavLink
                  audience="professionals"
                  className="transition-colors duration-300 hover:text-blue-400"
                >
                  {EXTERNAL.professionals.label}
                </AudienceNavLink>
              </li>
              <li>
                <Link
                  href="/#courses"
                  className="transition-colors duration-300 hover:text-blue-400"
                >
                  Courses
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="transition-colors duration-300 hover:text-blue-400"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-bold tracking-wide text-white uppercase">
              Company
            </h4>
            <ul className="space-y-4 text-slate-400">
              <li>
                <Link
                  href="/about"
                  className="transition-colors duration-300 hover:text-purple-400"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="transition-colors duration-300 hover:text-purple-400"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="transition-colors duration-300 hover:text-purple-400"
                >
                  Careers
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onContactClick}
                  suppressHydrationWarning
                  className="w-full text-left transition-colors duration-300 hover:text-purple-400"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-xs font-bold tracking-wide text-white uppercase">
              Connect
            </h4>
            <ul className="mb-5 space-y-4 text-slate-400">
              <li>
                <a
                  href={SOCIAL.instagram.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors duration-300 hover:text-pink-300"
                >
                  <Instagram className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL.x.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors duration-300 hover:text-white"
                >
                  <XIcon className="size-3.5 shrink-0" />
                  X (Twitter)
                </a>
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-slate-400">
              Questions about schools, demos, or partnerships?{' '}
              <Link
                href={CTAS.secondary.href}
                className="font-semibold text-blue-400 underline-offset-4 hover:underline"
              >
                Get in touch
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              <p className="text-sm font-medium text-slate-500">
                &copy; {new Date().getFullYear()} Aɪra. All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-500">
              <Link href="/terms" className="transition-colors hover:text-slate-300">
                Terms
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-slate-300">
                Privacy
              </Link>
              <Link href="/cookies" className="transition-colors hover:text-slate-300">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
