import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/static-page-shell'
import { BRAND, CONTACT_INBOX } from '@/lib/site'

export const metadata: Metadata = {
  title: `Cookie Policy — ${BRAND.name}`,
  description: `How ${BRAND.legalName} uses cookies and similar technologies on ${BRAND.name}.`,
}

export default function CookiesPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Cookie Policy"
      description={`Last updated: September 2026. This page explains how ${BRAND.legalName} uses cookies on ${BRAND.name}.`}
    >
      <h2>Operator</h2>
      <p>
        Cookies and similar technologies on this website and related{' '}
        {BRAND.name} experiences are used by{' '}
        <strong>{BRAND.legalName}</strong> (&ldquo;Company&rdquo;,
        &ldquo;we&rdquo;, or &ldquo;us&rdquo;) to operate and improve the Service.
      </p>

      <h2>What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device. We also use similar
        technologies such as local storage for session and preference data.
      </p>

      <h2>How we use cookies</h2>
      <ul>
        <li>
          <strong>Essential:</strong> authentication, security, and core site
          functionality
        </li>
        <li>
          <strong>Preferences:</strong> remembering settings such as theme or
          language where supported
        </li>
        <li>
          <strong>Analytics:</strong> understanding usage to improve the product
          (aggregated where possible)
        </li>
      </ul>

      <h2>Managing cookies</h2>
      <p>
        You can control cookies through your browser settings. Blocking essential
        cookies may limit account login and certain features.
      </p>

      <h2>Updates</h2>
      <p>
        {BRAND.legalName} may update this policy as tooling changes. Material
        updates will be reflected on this page with a revised date.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about cookies may be sent to {BRAND.legalName} at{' '}
        <a href={`mailto:${CONTACT_INBOX}`} className="text-primary hover:underline">
          {CONTACT_INBOX}
        </a>
        .
      </p>
    </StaticPageShell>
  )
}
