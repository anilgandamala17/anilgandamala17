import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/static-page-shell'
import { BRAND, CONTACT_INBOX } from '@/lib/site'

export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND.name}`,
  description: `How ${BRAND.name} collects, uses, and protects your data.`,
}

export default function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description={`Last updated: July 2026. This policy describes how ${BRAND.name} handles personal information.`}
    >
      <h2>Information we collect</h2>
      <ul>
        <li>Account details (name, email, organization where provided)</li>
        <li>Learning activity (progress, assessments, interactions with AI tutors)</li>
        <li>Technical data (device, browser, approximate location from IP)</li>
        <li>Communications you send us (support, demo requests, waitlist signups)</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>Deliver and personalize the learning experience</li>
        <li>Improve product quality and safety</li>
        <li>Send service-related messages and, with consent, product updates</li>
        <li>Comply with legal obligations</li>
      </ul>
      <h2>Sharing</h2>
      <p>
        We do not sell personal information. We use infrastructure and analytics
        providers who process data on our behalf under contractual safeguards.
      </p>
      <h2>Retention &amp; security</h2>
      <p>
        We retain data while your account is active and as needed for legal,
        security, and backup purposes. We apply industry-standard technical and
        organizational measures to protect data.
      </p>
      <h2>Your choices</h2>
      <p>
        You may request access, correction, or deletion of your data by contacting{' '}
        <a href={`mailto:${CONTACT_INBOX}`} className="text-primary hover:underline">
          {CONTACT_INBOX}
        </a>
        . Where applicable, you may opt out of marketing emails via the unsubscribe
        link in each message.
      </p>
      <h2>Children</h2>
      <p>
        School accounts may involve learners under 18. Schools and parents should
        review this policy and supervise use in line with local regulations.
      </p>
    </StaticPageShell>
  )
}
