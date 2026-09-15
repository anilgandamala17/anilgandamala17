'use client'

import { X, Phone, Mail, MapPin, Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { CONTACT_INBOX } from '@/lib/site'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

export function ContactModal({ open, onClose }: ContactModalProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const contactInfo = {
    phone: '8897210954',
    email: CONTACT_INBOX,
    address: '2-49 Govindapuram A Village and Bonakal mandal khammam District Telangana 507204',
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      window.setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('[contact] clipboard write failed', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/80 backdrop-blur-md"
        className="max-w-lg overflow-hidden rounded-[2.5rem] border border-white/20 bg-slate-900/90 p-0 shadow-2xl backdrop-blur-2xl"
      >
        <DialogTitle className="sr-only">Contact Us</DialogTitle>
        <DialogDescription className="sr-only">
          Phone, email, and corporate address for Aɪra Education Technologies.
        </DialogDescription>
      <div className="relative w-full max-w-lg bg-slate-900/90 border border-white/20 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
        {/* Background gradient effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-[80px]" />

        {/* Header */}
        <div className="p-8 pb-4 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-3xl font-black text-white tracking-tight">Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Us</span></h2>
          <p className="text-white/50 text-sm mt-2">We&apos;d love to hear from you. Reach out anytime.</p>
        </div>

        {/* Content */}
        <div className="p-8 pt-2 space-y-6 relative">
          {/* Phone */}
          <div className="group bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Phone Number</p>
                  <p className="text-white text-lg font-bold">{contactInfo.phone}</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(contactInfo.phone, 'phone')}
                className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                title="Copy phone"
              >
                {copied === 'phone' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Email */}
          <div className="group bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Email Address</p>
                  <p className="text-white text-lg font-bold break-all">{contactInfo.email}</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(contactInfo.email, 'email')}
                className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                title="Copy email"
              >
                {copied === 'email' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Address */}
          <div className="group bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Corporate Address</p>
                <p className="text-white text-sm font-medium leading-relaxed mt-1">
                  {contactInfo.address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-8 pb-8 pt-2 text-center">
            <p className="text-white/20 text-[10px] uppercase font-black tracking-[0.2em]">Aɪra Education Technologies</p>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  )
}
