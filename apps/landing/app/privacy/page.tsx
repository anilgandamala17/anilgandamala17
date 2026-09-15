import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/static-page-shell'
import { BRAND, CONTACT_INBOX } from '@/lib/site'

export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND.name}`,
  description: `How ${BRAND.legalName} collects, uses, and protects personal data for the ${BRAND.name} platform.`,
}

export default function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description={`Last updated: September 2026. This policy describes how ${BRAND.legalName} handles personal information for ${BRAND.name}.`}
    >
      <h2>Who we are</h2>
      <p>
        <strong>{BRAND.legalName}</strong> (&ldquo;Company&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the{' '}
        {BRAND.name} learning platform. For privacy purposes, the Company is the
        organization responsible for deciding how personal information is
        collected and used in connection with the Service.
      </p>

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
        <li>Comply with legal obligations applicable to {BRAND.legalName}</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We do not sell personal information. We use infrastructure and analytics
        providers who process data on our behalf under contractual safeguards.
        We may disclose information when required by law or to protect the rights
        and safety of {BRAND.legalName}, our users, or the public.
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
        {BRAND.legalName} at{' '}
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

      <h2>Contact</h2>
      <p>
        Privacy questions may be directed to {BRAND.legalName} at{' '}
        <a href={`mailto:${CONTACT_INBOX}`} className="text-primary hover:underline">
          {CONTACT_INBOX}
        </a>
        .
      </p>
    </StaticPageShell>
  )
}
