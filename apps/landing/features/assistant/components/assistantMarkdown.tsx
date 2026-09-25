'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Lightweight markdown: **bold**, bullets, numbered lists, links. No HTML injection. */
export function renderAssistantMarkdown(text: string): ReactNode {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let listBuf: { type: 'ul' | 'ol'; items: string[] } | null = null

  const flushList = () => {
    if (!listBuf) return
    const Tag = listBuf.type
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={cn(
          'my-1.5 space-y-1 pl-4 text-[13px] leading-relaxed text-foreground/90',
          Tag === 'ul' ? 'list-disc' : 'list-decimal',
        )}
      >
        {listBuf.items.map((item, i) => (
          <li key={i}>{inlineFormat(item)}</li>
        ))}
      </Tag>,
    )
    listBuf = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const bullet = line.match(/^\s*[•\-*]\s+(.*)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/)

    if (bullet) {
      if (!listBuf || listBuf.type !== 'ul') {
        flushList()
        listBuf = { type: 'ul', items: [] }
      }
      listBuf.items.push(bullet[1])
      continue
    }
    if (numbered) {
      if (!listBuf || listBuf.type !== 'ol') {
        flushList()
        listBuf = { type: 'ol', items: [] }
      }
      listBuf.items.push(numbered[1])
      continue
    }

    flushList()
    if (!line.trim()) {
      blocks.push(<div key={`sp-${i}`} className="h-2" />)
      continue
    }
    blocks.push(
      <p key={`p-${i}`} className="text-[13px] leading-relaxed text-foreground/90">
        {inlineFormat(line)}
      </p>,
    )
  }
  flushList()
  return <div className="space-y-0.5">{blocks}</div>
}

function inlineFormat(text: string): ReactNode {
  // Split bold **...** and [label](url)
  const parts: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link && isSafeHref(link[2])) {
        parts.push(
          <a
            key={key++}
            href={link[2]}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            {link[1]}
          </a>,
        )
      } else {
        parts.push(token)
      }
    }
    last = m.index + token.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function isSafeHref(href: string) {
  return href.startsWith('/') || href.startsWith('https://') || href.startsWith('http://')
}
