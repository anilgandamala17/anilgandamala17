import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/static-page-shell'
import { BRAND, CONTACT_INBOX } from '@/lib/site'

export const metadata: Metadata = {
  title: `Terms of Service — ${BRAND.name}`,
  description: `Terms governing use of the ${BRAND.name} platform.`,
}

export default function TermsPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Terms of Service"
      description={`Last updated: July 2026. These terms apply to your use of ${BRAND.name}.`}
    >
      <h2>1. Acceptance</h2>
      <p>
        By creating an account or using {BRAND.name}, you agree to these Terms of
        Service and our Privacy Policy.
      </p>
      <h2>2. Accounts</h2>
      <p>
        You are responsible for safeguarding your login credentials and for
        activity under your account. Provide accurate registration information.
      </p>
      <h2>3. Acceptable use</h2>
      <p>
        Do not misuse the platform, attempt unauthorized access, scrape content at
        scale, or use the service in ways that harm other users or violate
        applicable law.
      </p>
      <h2>4. Content &amp; AI outputs</h2>
      <p>
        Learning materials and AI-generated responses are provided for educational
        purposes. Verify important information independently before relying on it
        for high-stakes decisions.
      </p>
      <h2>5. Subscriptions &amp; billing</h2>
      <p>
        Paid plans renew according to the billing cycle shown at checkout unless
        cancelled. Refund terms, if any, will be stated on the pricing page at
        purchase.
      </p>
      <h2>6. Limitation of liability</h2>
      <p>
        To the extent permitted by law, {BRAND.name} is not liable for indirect or
        consequential damages arising from use of the service.
      </p>
      <h2>7. Contact</h2>
      <p>
        For questions about these terms, contact{' '}
        <a href={`mailto:${CONTACT_INBOX}`} className="text-primary hover:underline">
          {CONTACT_INBOX}
        </a>
        .
      </p>
    </StaticPageShell>
  )
}
