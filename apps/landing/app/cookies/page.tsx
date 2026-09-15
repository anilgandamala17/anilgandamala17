import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/static-page-shell'
import { BRAND } from '@/lib/site'

export const metadata: Metadata = {
  title: `Cookie Policy — ${BRAND.name}`,
  description: `How ${BRAND.name} uses cookies and similar technologies.`,
}

export default function CookiesPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Cookie Policy"
      description={`Last updated: July 2026. This page explains cookies on ${BRAND.name}.`}
    >
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
        We may update this policy as our tooling changes. Material updates will be
        reflected on this page with a revised date.
      </p>
    </StaticPageShell>
  )
}
