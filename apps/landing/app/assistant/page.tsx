'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { AiAssistant } from '@/components/ai-assistant'
import { PricingModal } from '@/components/pricing-modal'
import { ContactModal } from '@/components/contact-modal'

export default function AssistantPage() {
  const [pricingOpen, setPricingOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  const openContact = () => setContactOpen(true)

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <Header />
      <div className="min-h-0 w-full flex-1 overflow-hidden bg-slate-950/20">
        <AiAssistant standalone={true} />
      </div>

      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        onContactClick={openContact}
      />

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </main>
  )
}
