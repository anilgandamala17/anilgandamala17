'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { Courses } from '@/components/courses'
import { HowItWorks } from '@/components/how-it-works'
import { CTA } from '@/components/cta'
import { Footer } from '@/components/footer'
import { PricingModal } from '@/components/pricing-modal'
import { ContactModal } from '@/components/contact-modal'
import { FloatingAssistant } from '@/components/floating-assistant'

export default function Home() {
  // Modals retained for footer/CTA until those sections are refactored in a later pass
  const [pricingOpen, setPricingOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <Courses />
        <HowItWorks />
        <CTA onPricingClick={() => setPricingOpen(true)} />
        <Footer onContactClick={() => setContactOpen(true)} />
      </main>

      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        onContactClick={() => setContactOpen(true)}
      />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <FloatingAssistant />
    </div>
  )
}
