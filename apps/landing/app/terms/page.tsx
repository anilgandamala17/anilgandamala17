import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/static-page-shell'
import { BRAND, CONTACT_INBOX } from '@/lib/site'

export const metadata: Metadata = {
  title: `Terms of Service — ${BRAND.name}`,
  description: `Terms governing use of the ${BRAND.name} platform operated by ${BRAND.legalName}.`,
}

export default function TermsPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Terms of Service"
      description={`Last updated: September 2026. These terms govern your use of ${BRAND.name}, operated by ${BRAND.legalName}.`}
    >
      <h2>1. Contracting party</h2>
      <p>
        The {BRAND.name} website, applications, and related services (collectively,
        the &ldquo;Service&rdquo;) are provided by{' '}
        <strong>{BRAND.legalName}</strong> (&ldquo;Company&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). References to{' '}
        {BRAND.name} in these terms mean the product brand under which the Company
        offers the Service.
      </p>

      <h2>2. Acceptance</h2>
      <p>
        By creating an account or using the Service, you agree to these Terms of
        Service and our Privacy Policy. If you use the Service on behalf of a
        school, company, or other organization, you represent that you are
        authorized to bind that organization to these terms.
      </p>

      <h2>3. Accounts</h2>
      <p>
        You are responsible for safeguarding your login credentials and for
        activity under your account. Provide accurate registration information and
        keep it up to date.
      </p>

      <h2>4. Acceptable use</h2>
      <p>
        Do not misuse the platform, attempt unauthorized access, scrape content at
        scale, or use the Service in ways that harm other users or violate
        applicable law.
      </p>

      <h2>5. Content &amp; AI outputs</h2>
      <p>
        Learning materials and AI-generated responses are provided for educational
        purposes. Verify important information independently before relying on it
        for high-stakes decisions.
      </p>

      <h2>6. Subscriptions &amp; billing</h2>
      <p>
        Paid plans renew according to the billing cycle shown at checkout unless
        cancelled. Refund terms, if any, will be stated on the pricing page at
        purchase. Charges are processed on behalf of {BRAND.legalName}.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The Service, including software, branding, curricula, and related
        materials, is owned by {BRAND.legalName} or its licensors. You receive a
        limited, non-exclusive licence to use the Service as permitted by these
        terms. The {BRAND.name} name and marks remain trademarks of the Company.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the extent permitted by law, {BRAND.legalName} and its directors,
        officers, and employees are not liable for indirect, incidental, or
        consequential damages arising from use of the Service.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the laws of India, without regard to conflict
        of law principles. Courts of competent jurisdiction in India shall have
        exclusive jurisdiction, subject to mandatory consumer protections that may
        apply in your location.
      </p>

      <h2>10. Contact</h2>
      <p>
        For questions about these terms, contact {BRAND.legalName} at{' '}
        <a href={`mailto:${CONTACT_INBOX}`} className="text-primary hover:underline">
          {CONTACT_INBOX}
        </a>
        .
      </p>
    </StaticPageShell>
  )
}
