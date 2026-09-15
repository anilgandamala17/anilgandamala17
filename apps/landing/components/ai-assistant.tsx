'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Info, 
  RotateCcw,
  BookOpen,
  Trophy,
  Cpu,
  Compass,
  Layers,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react'
import { sendCounselorMessage } from '@/lib/services/chatService'
import { fetchLandingTtsAudio } from '@/lib/services/ttsService'

const SUGGESTED_CARDS = [
  {
    title: 'Explore Curriculum Mode',
    desc: 'School boards and syllabus we support.',
    icon: BookOpen,
    iconColor: 'text-blue-400',
    query: 'Explore Curriculum Mode'
  },
  {
    title: 'Discover Competitive Exams',
    desc: 'Olympiads, JEE, NEET, and test preps.',
    icon: Trophy,
    iconColor: 'text-purple-400',
    query: 'Discover Competitive Exams'
  },
  {
    title: 'How AI Teaching Works',
    desc: 'Learn about Aɪra as your 1-on-1 virtual tutor.',
    icon: Cpu,
    iconColor: 'text-pink-400',
    query: 'How AI Teaching Works'
  },
  {
    title: 'Create My Learning Path',
    desc: 'Generate a study path customized to your goals.',
    icon: Compass,
    iconColor: 'text-rose-400',
    query: 'Create My Learning Path'
  },
  {
    title: 'Platform Features',
    desc: 'Check notes, quizzes, flashcards, and tools.',
    icon: Layers,
    iconColor: 'text-teal-400',
    query: 'Platform Features'
  },
  {
    title: 'Why Choose Aɪra',
    desc: 'Compare human learning vs AI teaching advantages.',
    icon: GraduationCap,
    iconColor: 'text-emerald-400',
    query: 'Why Choose Aɪra'
  }
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AiAssistantProps {
  standalone?: boolean
  isModal?: boolean
  onClose?: () => void
}

export function AiAssistant({ standalone = false, isModal = false, onClose }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm Aɪra AI Assistant. I can help you explore our platform, explain features, guide your learning journey, and answer your questions."
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [assistantState, setAssistantState] = useState<'idle' | 'listening' | 'speaking'>('idle')
  const [speakingExpression, setSpeakingExpression] = useState<'warm_smile' | 'focused' | 'encouraging' | 'confident' | 'neutral'>('neutral')
  const [isClient, setIsClient] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [ttsLanguage, setTtsLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aira-tts-language')
      return stored || 'en-IN'
    }
    return 'en-IN'
  })
  const ttsLanguageRef = useRef(ttsLanguage)
  ttsLanguageRef.current = ttsLanguage
  const chatAbortRef = useRef<AbortController | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const speechQueueRef = useRef<string[]>([])
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const speakTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Streaming progressive TTS refs
  const streamQueueRef = useRef<string[]>([])
  const isStreamSpeakingRef = useRef(false)
  const streamPendingRef = useRef('')
  // Streaming progressive Sarvam AI TTS refs
  const sarvamTextQueueRef = useRef<string[]>([])
  const sarvamAudioQueueRef = useRef<HTMLAudioElement[]>([])
  const isFetchingSarvamRef = useRef<boolean>(false)
  const isPlayingSarvamRef = useRef<boolean>(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Smooth video animation frame ref
  const animationFrameRef = useRef<number | null>(null)
  // Wind-down timer for natural speech→idle transition
  const windDownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize client check asynchronously to prevent React hydration / setState in effect error
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Autofocus textarea when modal mounts or when client is ready
  useEffect(() => {
    if (isClient && isModal) {
      const t = setTimeout(() => textareaRef.current?.focus(), 500)
      return () => clearTimeout(t)
    }
  }, [isClient, isModal])

  // ─── Stop all audio/video on unmount (e.g. modal close) ─────────────────────
  useEffect(() => {
    const video = videoRef.current
    return () => {
      // Stop Web Speech API
      if (typeof window !== 'undefined') window.speechSynthesis.cancel()
      // Stop Sarvam audio element
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      // Flush all Sarvam queues
      sarvamTextQueueRef.current = []
      sarvamAudioQueueRef.current = []
      isFetchingSarvamRef.current = false
      isPlayingSarvamRef.current = false
      // Reset avatar video
      if (video) {
        video.pause()
        video.currentTime = 0
      }
    }
  }, [])

  // Save language preference to localStorage whenever it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('aira-tts-language', ttsLanguage)
    }
  }, [ttsLanguage, isClient])


  // Smooth auto-scroll messages container to top (where the latest response is highlighted)
  const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior
      })
    } else if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior
      })
    }
  }

  useEffect(() => {
    scrollToTop('smooth')
  }, [messages.length, isTyping])

  // Blinking overlay disabled (the video has natural blinking)

  // Compute dynamic expressions relative to interactive state
  const activeExpression = 
    isTyping 
      ? 'thinking' 
      : assistantState === 'listening' 
        ? 'attentive' 
        : assistantState === 'speaking' 
          ? speakingExpression 
          : 'neutral'

  // ─── Video Control: synced with assistant state ───────────────────────────
  // Speaking state is driven directly by audio chunk events in playNextSarvamAudio.
  // Here we only handle idle (paused) and listening (gentle sway).
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (assistantState === 'listening') {
      // Gentle attentive breathing loop while listening
      video.playbackRate = 0.5
      video.play().catch(() => {})
    } else if (assistantState === 'idle') {
      // Pause and return to start — no looping when silent
      video.pause()
      video.currentTime = 0
    }
    // 'speaking' is managed frame-perfectly inside playNextSarvamAudio
  }, [assistantState, isClient])

  // ─── Language detection: parse user message for language switch ────────────────
  const detectLanguageSetting = (text: string): string | null => {
    const t = text.toLowerCase()
    if (/\b(telugu|తెలుగు)\b/.test(t)) return 'te-IN'
    if (/\b(hindi|हिंदी)\b/.test(t)) return 'hi-IN'
    if (/\b(tamil|தமிழ்)\b/.test(t)) return 'ta-IN'
    if (/\b(kannada|ಕನ್ನಡ)\b/.test(t)) return 'kn-IN'
    if (/\b(malayalam|മലയാളം)\b/.test(t)) return 'ml-IN'
    if (/\b(marathi|मराठी)\b/.test(t)) return 'mr-IN'
    if (/\b(bengali|bangla|বাংলা)\b/.test(t)) return 'bn-IN'
    if (/\b(english)\b/.test(t)) return 'en-IN'
    return null
  }

  const getExpressionFromText = (text: string): 'warm_smile' | 'focused' | 'encouraging' | 'confident' | 'neutral' => {
    const lower = text.toLowerCase()
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('welcome') || lower.includes('greet')) {
      return 'warm_smile'
    }
    if (lower.includes('exam') || lower.includes('jee') || lower.includes('neet') || lower.includes('test') || lower.includes('olympiad')) {
      return 'focused'
    }
    if (lower.includes('student') || lower.includes('help') || lower.includes('learn') || lower.includes('support')) {
      return 'encouraging'
    }
    if (lower.includes('feature') || lower.includes('curriculum') || lower.includes('teach') || lower.includes('path')) {
      return 'confident'
    }
    return 'neutral'
  }

  // Web Speech API: Initialize Speech Recognition
  useEffect(() => {
    if (!isClient) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-IN' // Indian English as requested

      rec.onstart = () => {
        setIsListening(true)
        setAssistantState('listening')
        cancelAllSpeech()
      }

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript
        if (text) {
          handleSubmitText(text)
        }
      }

      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err)
        setIsListening(false)
        setAssistantState('idle')
      }

      rec.onend = () => {
        setIsListening(false)
        setAssistantState(prev => prev === 'listening' ? 'idle' : prev)
      }

      recognitionRef.current = rec
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient])

  // Cancel any running speech synthesis
  function cancelAllSpeech() {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    // Clear Sarvam progressive queues
    sarvamTextQueueRef.current = []
    sarvamAudioQueueRef.current = []
    isFetchingSarvamRef.current = false
    isPlayingSarvamRef.current = false

    // Immediately stop avatar video and reset to start position
    const video = videoRef.current
    if (video) {
      video.pause()
      video.currentTime = 0
    }

    speechQueueRef.current = []
    streamQueueRef.current = []
    isStreamSpeakingRef.current = false
    streamPendingRef.current = ''
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current = null
    }
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current)
    if (windDownTimerRef.current) clearTimeout(windDownTimerRef.current)
    setAssistantState('idle')
    setSpeakingExpression('neutral')
  }

  // Queue a sentence for progressive Sarvam AI TTS fetch
  const queueSarvamText = (sentence: string) => {
    if (isMuted || typeof window === 'undefined') return
    sarvamTextQueueRef.current.push(sentence)
    fetchNextSarvamAudio()
  }

  // Background fetch audio for the next queued sentence
  const fetchNextSarvamAudio = async () => {
    if (isMuted || typeof window === 'undefined') return
    if (isFetchingSarvamRef.current) return
    if (sarvamTextQueueRef.current.length === 0) return

    isFetchingSarvamRef.current = true
    const nextSentence = sarvamTextQueueRef.current.shift()!

    try {
      // FUTURE BACKEND: POST /api/tts — NOW: mockAdapter → browser speech
      await fetchLandingTtsAudio({ text: nextSentence, language: ttsLanguageRef.current })
      fallbackToBrowserTTS(nextSentence)
    } catch {
      fallbackToBrowserTTS(nextSentence)
    } finally {
      isFetchingSarvamRef.current = false
      fetchNextSarvamAudio() // Process remaining text in queue
    }
  }

  // Plays the next audio in the preload play queue — video is driven here for perfect sync
  const resetVideo = () => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = 0
  }

  const playNextSarvamAudio = () => {
    if (isMuted || typeof window === 'undefined') return
    if (isPlayingSarvamRef.current) return
    if (sarvamAudioQueueRef.current.length === 0) {
      // No more chunks — reset video to start and return to idle
      resetVideo()
      if (!isTyping && sarvamTextQueueRef.current.length === 0 && !isFetchingSarvamRef.current) {
        setAssistantState('idle')
        setSpeakingExpression('neutral')
      }
      return
    }

    isPlayingSarvamRef.current = true
    const audio = sarvamAudioQueueRef.current.shift()!
    audioRef.current = audio

    const textToMatch = (audio as any).associatedText || ''

    audio.onplay = () => {
      // Sync video: start playing at full speed exactly when voice starts
      const video = videoRef.current
      if (video) {
        video.playbackRate = 1.0
        video.play().catch(() => {})
      }
      setAssistantState('speaking')
      setSpeakingExpression(getExpressionFromText(textToMatch))
    }

    audio.onended = () => {
      isPlayingSarvamRef.current = false
      audioRef.current = null
      const hasMore = sarvamAudioQueueRef.current.length > 0 ||
                      sarvamTextQueueRef.current.length > 0 ||
                      isFetchingSarvamRef.current
      if (!hasMore) {
        // Voice fully done — reset video back to start position
        resetVideo()
      }
      playNextSarvamAudio()
    }

    audio.onerror = (e) => {
      console.warn('Sarvam audio playback error, skipping chunk:', e)
      isPlayingSarvamRef.current = false
      audioRef.current = null
      if (sarvamAudioQueueRef.current.length === 0) resetVideo()
      playNextSarvamAudio()
    }

    audio.play().catch(err => {
      console.warn('Playback block / error:', err)
      isPlayingSarvamRef.current = false
      audioRef.current = null
      if (sarvamAudioQueueRef.current.length === 0) resetVideo()
      playNextSarvamAudio()
    })
  }

  // Web Speech API: Text-To-Speech sentence queuer (with Sarvam AI TTS preference)
  const speakResponse = async (text: string) => {
    if (isMuted || typeof window === 'undefined') return
    
    cancelAllSpeech()

    const cleanText = text.replace(/[*#]/g, '').trim()
    const sentences = cleanText.split(/(?<=[.!?])\s+/)
    
    // Feed each sentence sequentially into the progressive queue
    for (const sentence of sentences) {
      if (sentence.trim().length > 3) {
        queueSarvamText(sentence.trim())
      }
    }
  }

  // Fallback to browser standard speech synthesis
  const fallbackToBrowserTTS = (cleanText: string) => {
    // Split into smaller sentences for smoother sentence-by-sentence reading
    const sentences = cleanText.split(/(?<=[.!?])\s+/)
    speechQueueRef.current = sentences

    const processQueue = () => {
      if (speechQueueRef.current.length === 0) {
        setAssistantState('idle')
        setSpeakingExpression('neutral')
        return
      }

      const nextSentence = speechQueueRef.current.shift()
      if (!nextSentence || nextSentence.trim().length === 0) {
        processQueue()
        return
      }

      // Update spoken expression dynamically
      const calculatedExpr = getExpressionFromText(nextSentence)
      setSpeakingExpression(calculatedExpr)

      const utterance = new SpeechSynthesisUtterance(nextSentence)
      currentUtteranceRef.current = utterance

      // Load best Indian female voice
      const pickBestVoice = (voices: SpeechSynthesisVoice[], lang: string) => {
        const langPrefix = lang.split('-')[0]
        // Prefer exact language match female voices
        const exactFemale = voices.find(v =>
          (v.lang === lang || v.lang === lang.replace('-', '_')) &&
          (v.name.includes('Female') || v.name.includes('female') ||
           v.name.includes('Pooja') || v.name.includes('Priya') ||
           v.name.includes('Raveena') || v.name.includes('Neerja') ||
           v.name.includes('Heera') || v.name.includes('Meera') ||
           v.name.includes('Diya'))
        )
        if (exactFemale) return exactFemale
        // Any voice for that language
        const anyLang = voices.find(v => v.lang.startsWith(langPrefix))
        if (anyLang) return anyLang
        // Fallback to en-IN
        const enIN = voices.find(v => v.lang === 'en-IN' || v.name.includes('India'))
        if (enIN) return enIN
        // Last resort: any female English
        return voices.find(v => v.lang.startsWith('en') &&
          (v.name.includes('Zira') || v.name.includes('Google US English') || v.name.includes('Female')))
      }

      const voices = window.speechSynthesis.getVoices()
      const bestVoice = pickBestVoice(voices, ttsLanguage)
      if (bestVoice) utterance.voice = bestVoice

      // Warm educational pace
      utterance.rate = 0.87
      utterance.pitch = 1.12

      utterance.onstart = () => {
        setAssistantState('speaking')
      }

      utterance.onend = () => {
        currentUtteranceRef.current = null
        processQueue()
      }

      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('Speech synthesis issue:', e.error, e)
        }
        currentUtteranceRef.current = null
        processQueue()
      }

      window.speechSynthesis.speak(utterance)
    }

    processQueue()
  }

  // ─── Progressive streaming TTS ────────────────────────────────────────────
  // Speaks sentences one-by-one via instant browser TTS as they arrive from stream
  const getBestVoice = (voices: SpeechSynthesisVoice[], lang: string) => {
    const langPrefix = lang.split('-')[0]
    const exact = voices.find(v =>
      (v.lang === lang || v.lang === lang.replace('-', '_')) &&
      (v.name.includes('Female') || v.name.includes('Pooja') ||
       v.name.includes('Priya') || v.name.includes('Raveena') ||
       v.name.includes('Neerja') || v.name.includes('Heera') ||
       v.name.includes('Meera') || v.name.includes('Diya'))
    )
    if (exact) return exact
    const anyLang = voices.find(v => v.lang.startsWith(langPrefix))
    if (anyLang) return anyLang
    const enIN = voices.find(v => v.lang === 'en-IN' || v.name.includes('India'))
    if (enIN) return enIN
    return voices.find(v => v.lang.startsWith('en') &&
      (v.name.includes('Zira') || v.name.includes('Google US English')))
  }

  const drainStreamQueue = () => {
    if (isMuted || typeof window === 'undefined') return
    if (isStreamSpeakingRef.current) return
    if (streamQueueRef.current.length === 0) return

    const sentence = streamQueueRef.current.shift()!.trim()
    if (!sentence) { drainStreamQueue(); return }

    isStreamSpeakingRef.current = true
    setAssistantState('speaking')
    setSpeakingExpression(getExpressionFromText(sentence))

    const utterance = new SpeechSynthesisUtterance(sentence)
    const voices = window.speechSynthesis.getVoices()
    const inVoice = voices.find(v =>
      v.lang === 'en-IN' || v.name.includes('India') || v.name.includes('Indian') ||
      v.name.includes('Pooja') || v.name.includes('Heera') ||
      v.name.includes('Neerja') || v.name.includes('Priya') ||
      v.name.includes('Raveena')
    )
    if (inVoice) utterance.voice = inVoice
    else {
      const fb = voices.find(v => v.lang.startsWith('en') &&
        (v.name.includes('Zira') || v.name.includes('Google US English')))
      if (fb) utterance.voice = fb
    }
    utterance.rate = 0.95
    utterance.pitch = 1.08

    utterance.onend = () => {
      isStreamSpeakingRef.current = false
      if (streamQueueRef.current.length > 0) drainStreamQueue()
      else { setAssistantState('idle'); setSpeakingExpression('neutral') }
    }
    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted')
        console.warn('Stream TTS error:', e.error)
      isStreamSpeakingRef.current = false
      if (streamQueueRef.current.length > 0) drainStreamQueue()
    }
    window.speechSynthesis.speak(utterance)
  }

  // Parse streaming text chunks into complete sentences and enqueue them
  const feedStreamText = (chunk: string) => {
    if (isMuted || typeof window === 'undefined') return
    streamPendingRef.current += chunk

    let processed = 0
    const regex = /[^.!?\n]*[.!?]+/g
    let match
    while ((match = regex.exec(streamPendingRef.current)) !== null) {
      const sentence = match[0].trim()
      if (sentence.length > 3) {
        // High-grade progressive queue mapping
        queueSarvamText(sentence)
      }
      processed = match.index + match[0].length
    }
    if (processed > 0) streamPendingRef.current = streamPendingRef.current.slice(processed)
  }

  // Handle manual session reset
  const handleReset = () => {
    if (confirm("Reset Aɪra session?")) {
      cancelAllSpeech()
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I'm Aɪra AI Assistant. I can help you explore our platform, explain features, guide your learning journey, and answer your questions."
        }
      ])
      setInputText('')
      setIsTyping(false)
      setSpeakingExpression('neutral')
    }
  }

  // Cleanup synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Handle user toggle mic listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  // Submit Text Query to Groq Backend
  const handleSubmitText = async (text: string) => {
    if (!text.trim() || isTyping) return

    setShowSuggestions(false)

    // Detect language switch request and persist it
    const detectedLang = detectLanguageSetting(text)
    if (detectedLang) {
      setTtsLanguage(detectedLang)
      ttsLanguageRef.current = detectedLang
    }
    const activeLang = detectedLang ?? ttsLanguageRef.current

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)
    cancelAllSpeech()

    // Place placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: aiMessageId, role: 'assistant', content: '' }])

    chatAbortRef.current?.abort()
    const abort = new AbortController()
    chatAbortRef.current = abort

    try {
      // FUTURE BACKEND: POST /api/chat — NOW: mockAdapter via chatService
      void messages
      void abort
      const stub = await sendCounselorMessage(userMessage.content)
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMessageId ? { ...m, content: stub } : m)),
      )
      setIsTyping(false)
      speakResponse(stub)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('Error fetching chat response:', err)
      setIsTyping(false)
      const errorMsg = 'I apologize, but I encountered an error. Please try again.'
      setMessages(prev => 
        prev.map(m => m.id === aiMessageId ? { ...m, content: errorMsg } : m)
      )
      speakResponse(errorMsg)
    }
  }

  const handleSend = () => {
    if (inputText.trim()) {
      handleSubmitText(inputText)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isModal) {
    return (
      <div className="flex flex-col h-full w-full bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-none md:rounded-3xl overflow-hidden relative shadow-2xl animate-fade-in text-white">
        {/* Premium Title / Close Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/50 backdrop-blur-md z-30">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Aɪra AI Assistant</span>
            </h3>
            <p className="text-[10px] md:text-xs text-white/50">Your Personal Learning Counselor</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              suppressHydrationWarning
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Layout Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Dynamic Background Accents */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-[80px] -z-10 animate-[pulse-soft_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[80px] -z-10 animate-[pulse-soft_8s_ease-in-out_infinite] delay-2000" />

          {/* Digital Human Video Container - Fixed at the top */}
          <div className="flex justify-center p-4 bg-slate-950/40 border-b border-white/5 flex-shrink-0 z-20">
            <div className="relative w-full max-w-[150px] xs:max-w-[170px] sm:max-w-[200px] aspect-[3/4] flex-shrink-0">
              <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-[2rem] blur-xl -z-10" />
              <div className="relative w-full h-full rounded-[1.8rem] border border-white/12 overflow-hidden flex flex-col justify-between bg-slate-900 shadow-lg">
                <img
                  src="/aira-logo.png"
                  alt="Aɪra learning counselor"
                  className="w-full h-full object-contain p-8 bg-slate-900"
                />
                
                <div className="absolute top-2 left-2 flex items-center z-20">
                  <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-white bg-slate-950/70 px-2 py-1 rounded-full border border-white/10">
                    {assistantState === 'speaking' && !isListening && !isTyping ? (
                      <span className="flex items-end gap-[2px] h-3">
                        {[0,1,2,3].map(i => (
                          <span key={i} className="w-[2px] bg-indigo-400 rounded-full animate-[eq-bar_0.8s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.15}s`, minHeight: '3px' }} />
                        ))}
                      </span>
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isListening ? 'bg-rose-500 animate-ping' :
                        isTyping ? 'bg-purple-500 animate-pulse' :
                        'bg-emerald-500 animate-pulse'
                      }`} />
                    )}
                    {isListening ? 'Listening' : isTyping ? 'Thinking' : assistantState === 'speaking' ? 'Speaking' : 'Ready'}
                  </span>
                </div>
                
                <div className="absolute bottom-2 right-2 z-20">
                  <button
                    onClick={() => {
                      const newMute = !isMuted
                      setIsMuted(newMute)
                      if (newMute) cancelAllSpeech()
                      else if (messages.length > 0) speakResponse(messages[messages.length - 1].content)
                    }}
                    className={`p-1.5 rounded-lg border backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                      isMuted ? 'bg-rose-500/20 border-rose-500/35 text-rose-400' : 'bg-slate-950/50 border-white/10 text-white/80'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Messages & Suggested Actions Area - Scrollable */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
            
            {/* Suggested Questions */}
            <div className="w-full">
              <div className="flex justify-center">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-[9px] font-bold text-white/40 hover:text-white/60 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer py-1 select-none"
                >
                  Suggested Questions
                  {showSuggestions ? (
                    <ChevronUp className="w-3 h-3 text-blue-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-purple-400" />
                  )}
                </button>
              </div>
              {showSuggestions && (
                <div className="pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-[500px] mx-auto">
                    {SUGGESTED_CARDS.map((card, i) => {
                      const Icon = card.icon
                      return (
                        <button
                          key={i}
                          onClick={() => handleSubmitText(card.query)}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl border bg-slate-950/40 hover:bg-slate-900/60 hover:border-white/15 border-white/5 transition-all text-left group cursor-pointer"
                        >
                          <div className={`p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors flex items-center justify-center ${card.iconColor}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[10px] text-white group-hover:text-blue-400 transition-colors truncate">{card.title}</h4>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Conversation flow */}
            <div className="w-full max-w-[500px] mx-auto space-y-4">
              {(() => {
                const reversed = [...messages].reverse()
                const latest = reversed[0]
                const previous = reversed.slice(1)
                
                return (
                  <>
                    {/* Latest Bubble */}
                    {latest && (
                      <div className="space-y-1 animate-fade-in-up">
                        <div className="text-[8px] uppercase tracking-wider font-bold text-indigo-400/80 px-1">Latest response</div>
                        <div className={`p-4 rounded-2xl border transition-all duration-300 relative group shadow-lg ${
                          latest.role === 'user'
                            ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-500/20 text-white rounded-tr-none'
                            : 'bg-white/5 border-white/10 text-white/90 rounded-tl-none'
                        }`}>
                          <div className="flex items-center gap-2 mb-1.5 text-[8px] font-bold text-white/30">
                            <span>{latest.role === 'user' ? 'YOU' : 'AɪRA'}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span>RECENT</span>
                          </div>
                          
                          {isTyping && (!latest.content || latest.role === 'user') ? (
                            <div className="flex items-center gap-1.5 py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-[bounce_1.4s_infinite_0ms]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-[bounce_1.4s_infinite_200ms]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-[bounce_1.4s_infinite_400ms]" />
                            </div>
                          ) : (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">{latest.content}</p>
                          )}

                          {latest.role === 'assistant' && latest.content && (
                            <button
                              onClick={() => speakResponse(latest.content)}
                              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/5 text-white/70 hover:text-white flex items-center justify-center cursor-pointer"
                              title="Listen"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Previous Responses */}
                    {previous.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="text-[8px] uppercase tracking-wider font-bold text-white/30 px-1">Previous responses</div>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                          {previous.map((msg) => (
                            <div 
                              key={msg.id}
                              className={`p-3 rounded-xl border transition-all duration-300 text-[11px] ${
                                msg.role === 'user'
                                  ? 'bg-blue-950/20 border-blue-500/10 text-white/60'
                                  : 'bg-white/5 border-white/5 text-white/65'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[8px] font-bold tracking-wider text-white/30 uppercase">
                                  {msg.role === 'user' ? 'You' : 'Aɪra'}
                                </span>
                                {msg.role === 'assistant' && (
                                  <button
                                    onClick={() => speakResponse(msg.content)}
                                    className="text-white/40 hover:text-white transition-colors"
                                    title="Listen"
                                  >
                                    <Volume2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

          </div>

          {/* Fixed Input at Bottom */}
          <div className="p-4 border-t border-white/5 bg-slate-950/90 backdrop-blur-md flex-shrink-0">
            <div className="w-full max-w-[500px] mx-auto">
              <div className="relative flex items-center gap-2 bg-slate-900/90 rounded-full border border-white/10 focus-within:ring-2 focus-within:ring-purple-500/40 transition-all p-1.5 shadow-lg">
                <div className="pl-3 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={isListening ? "Listening to you..." : "Ask Aɪra anything..."}
                  rows={1}
                  disabled={isListening}
                  className="flex-1 bg-transparent px-2 py-1 text-xs text-white placeholder-white/30 resize-none outline-none disabled:opacity-40 min-h-[28px] max-h-[80px]"
                />
                <button
                  onClick={toggleListening}
                  className={`p-2 rounded-full border transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
                    isListening ? 'bg-rose-500 border-rose-400 text-white animate-pulse' : 'bg-white/5 border-white/10 text-white/80'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isListening}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/10 text-white rounded-full transition-all flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  return (
    <section id="talk-to-aira" className={standalone ? "h-full w-full relative overflow-hidden bg-slate-950/20 py-4 flex flex-col min-h-0" : "py-24 relative overflow-hidden bg-slate-950/20"}>
      {/* Keyframes removed (we play video at 0.08 speed for natural sways & breathing) */}

      {/* Decorative Shifting Glows */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -z-10 animate-[pulse-soft_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] -z-10 animate-[pulse-soft_8s_ease-in-out_infinite] delay-2000" />

      <div className={standalone ? "w-full max-w-7xl mx-auto px-4 md:px-6 flex-1 flex flex-col min-h-0 py-2 h-full" : "max-w-7xl mx-auto px-6"}>
        {/* Premium Concierge Header */}
        {!standalone && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-sm text-xs font-semibold text-purple-400 mb-4 bg-slate-900/60 border-white/15 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              Aɪra Premium Experience
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-sans tracking-tight mb-4 text-white">
              Meet the <span className="gradient-text font-extrabold">Aɪra AI Assistant</span>
            </h2>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Talk with Aɪra and discover smarter learning.
            </p>
          </div>
        )}
           {/* Centered Premium Digital Human Layout */}
         <div ref={standalone ? scrollContainerRef : undefined} className={`w-full flex flex-col items-center ${standalone ? "flex-1 overflow-y-auto scrollbar-thin pr-1 min-h-0" : ""}`}>
          
          {/* CENTERED COLUMN: Immersive Assistant Section */}
          <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-6 pb-8">
            
            {/* Container wrapper for Card + Glow to ensure exact alignment */}
            <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-[3/4] flex-shrink-0">
              {/* Soft Aɪra purple-blue glow surrounding the card container */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/30 to-purple-600/30 rounded-[2.8rem] blur-[40px] -z-10 pointer-events-none opacity-90 animate-[pulse-soft_8s_ease-in-out_infinite]" />
              
              {/* Immersive Avatar panel — premium glassmorphism, wider for proper human proportions */}
              <div className="relative w-full h-full rounded-[2.5rem] border border-white/12
                shadow-[0_30px_60px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)]
                overflow-hidden flex flex-col justify-between group
                bg-gradient-to-b from-slate-900/70 to-slate-950/90 backdrop-blur-sm">
                {/* Shifting Gradient Background Glow inside Avatar container */}
                <div className="absolute -inset-10 bg-gradient-to-tr from-blue-600/20 via-purple-600/15 to-transparent blur-[80px] -z-10 animate-[pulse-soft_8s_ease-in-out_infinite]" />
                
                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-blue-400/20 animate-[float-particle_6s_linear_infinite]"
                      style={{
                        left: `${15 + (i * 10)}%`,
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: `${6 + (i % 3) * 2}s`,
                        '--x-distance': `${(i % 2 === 0 ? 10 : -10) + (i % 3) * 5}px`
                      } as React.CSSProperties}
                    />
                  ))}
                </div>

                {/* Floating Header Badge */}
                <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-20">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/90 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                    {assistantState === 'speaking' && !isListening && !isTyping ? (
                      <span className="flex items-end gap-[2px] h-4">
                        {[0,1,2,3,4].map(i => (
                          <span key={i} className="w-[2.5px] bg-indigo-400 rounded-full animate-[eq-bar_0.8s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.15}s`, minHeight: '4px' }} />
                        ))}
                      </span>
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${
                        isListening
                          ? 'bg-rose-500 animate-ping'
                          : isTyping
                            ? 'bg-purple-500 animate-pulse'
                            : 'bg-emerald-500 animate-pulse'
                      }`} />
                    )}
                    {isListening ? 'Listening' : isTyping ? 'Thinking' : assistantState === 'speaking' ? 'Speaking' : 'Ready'}
                  </span>

                  <button
                    onClick={handleReset}
                    suppressHydrationWarning
                    className="flex items-center gap-1 text-[10px] font-bold text-white/80 bg-slate-900/60 hover:bg-slate-800/80 transition-all px-3 py-1.5 rounded-full shadow-lg border border-white/10 active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-purple-300" />
                    Reset
                  </button>
                </div>

                {/* Glowing ring around video (inside card) */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 transition-all duration-700 -z-10 ${
                  activeExpression === 'warm_smile'    ? 'border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]' :
                  activeExpression === 'focused'       ? 'border-indigo-500/35 shadow-[0_0_25px_rgba(99,102,241,0.25)]' :
                  activeExpression === 'encouraging'   ? 'border-emerald-500/25 shadow-[0_0_20px_rgba(16,185,129,0.15)]' :
                  activeExpression === 'confident'     ? 'border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.3)]' :
                  activeExpression === 'attentive'     ? 'border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]' :
                  activeExpression === 'thinking'      ? 'border-fuchsia-500/20 shadow-[0_0_20px_rgba(217,70,239,0.15)]' :
                  'border-white/5 shadow-[0_8px_30px_rgba(108,71,255,0.08)]'
                }`} />

                {/* Continuous Video Element Wrapper — no background so no black bars */}
                <div className="w-full h-full absolute inset-0 rounded-[2.45rem] overflow-hidden">
                   <img
                    src="/aira-logo.png"
                    alt="Aɪra learning counselor"
                    className={`w-full h-full object-contain p-10 bg-slate-900 transition-[filter] duration-500 will-change-[filter] ${
                      activeExpression === 'warm_smile'  ? 'saturate-[1.08] contrast-[1.02] sepia-[0.04]' :
                      activeExpression === 'focused'     ? 'saturate-[0.96] contrast-[1.04] -hue-rotate-3' :
                      activeExpression === 'encouraging' ? 'saturate-[1.04] contrast-100 sepia-[0.06]' :
                      activeExpression === 'confident'   ? 'saturate-[1.08] contrast-[1.03]' :
                      activeExpression === 'attentive'   ? 'saturate-100 contrast-[1.02] brightness-[1.01]' :
                      activeExpression === 'thinking'    ? 'saturate-[0.92] brightness-[0.98] contrast-[0.98]' :
                      ''
                    }`}
                  />
                </div>

                {/* Floating Mute/Reset Overlays inside Video Card Bottom */}
                <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newMute = !isMuted
                      setIsMuted(newMute)
                      if (newMute) {
                        cancelAllSpeech()
                      } else if (messages.length > 0) {
                        speakResponse(messages[messages.length - 1].content)
                      }
                    }}
                    suppressHydrationWarning
                    className={`p-2 rounded-xl border backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                      isMuted 
                        ? 'bg-rose-500/20 border-rose-500/35 text-rose-400' 
                        : 'bg-slate-950/50 hover:bg-slate-900/60 border-white/10 text-white/80'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Centered Chat Input Section (directly below video) */}
            <div className="w-full max-w-[560px] space-y-4">
              <div className="relative flex items-center gap-2 bg-slate-950/80 rounded-full border border-white/10 focus-within:ring-2 focus-within:ring-purple-500/40 focus-within:border-purple-500/30 transition-all p-1.5 shadow-2xl">
                
                {/* AI Sparkle Icon indicator */}
                <div className="pl-3.5 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>

                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={isListening ? "Listening to you..." : "Ask Aɪra anything about learning, exams, careers, or our platform..."}
                  rows={1}
                  disabled={isListening}
                  className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-white/30 resize-none outline-none disabled:opacity-40 min-h-[36px] max-h-[120px] align-middle overflow-y-auto scrollbar-none"
                />

                {/* Voice mic button */}
                <button
                  onClick={toggleListening}
                  suppressHydrationWarning
                  className={`p-2.5 rounded-full border transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
                    isListening 
                      ? 'bg-rose-500 border-rose-400 text-white animate-pulse' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                  }`}
                  title={isListening ? 'Stop voice input' : 'Speak to Aɪra'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isListening}
                  suppressHydrationWarning
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/10 disabled:border-transparent text-white rounded-full border border-blue-500/20 disabled:opacity-30 active:scale-90 transition-all shadow-lg flex items-center justify-center cursor-pointer"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Suggested Actions (collapsible / tags) */}
              <div className="w-full">
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-[10px] font-bold text-white/40 hover:text-white/60 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer py-1 select-none"
                  >
                    Suggested Questions
                    {showSuggestions ? (
                      <ChevronUp className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-purple-400" />
                    )}
                  </button>
                </div>

                {showSuggestions && (
                  <div className="pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-[560px] mx-auto">
                      {SUGGESTED_CARDS.map((card, i) => {
                        const Icon = card.icon
                        return (
                          <button
                            key={i}
                            onClick={() => handleSubmitText(card.query)}
                            suppressHydrationWarning
                            className="flex items-center gap-3 p-3 rounded-xl border bg-slate-950/40 hover:bg-slate-900/60 hover:border-white/15 border-white/5 transition-all text-left group hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                          >
                            <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors flex items-center justify-center ${card.iconColor}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[11px] text-white group-hover:text-blue-400 transition-colors truncate">{card.title}</h4>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Conversation Flow Area (Latest + History in reverse chronological order) */}
            <div className="w-full max-w-[560px] pt-4 space-y-4">
              
              {/* Latest Response Card */}
              {(() => {
                const reversed = [...messages].reverse();
                const latest = reversed[0];
                const previous = reversed.slice(1);
                
                return (
                  <>
                    {/* Latest Bubble */}
                    {latest && (
                      <div className="space-y-1.5 animate-fade-in-up">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-indigo-400/80 px-1">Latest response</div>
                        <div className={`p-5 rounded-2xl border transition-all duration-300 relative group shadow-xl ${
                          latest.role === 'user'
                            ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-500/20 text-white rounded-tr-none'
                            : 'bg-white/5 border-white/10 text-white/90 rounded-tl-none'
                        }`}>
                          <div className="flex items-center gap-2 mb-2 text-[9px] font-bold text-white/30">
                            <span>{latest.role === 'user' ? 'YOU' : 'AɪRA'}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span>RECENT</span>
                          </div>
                          
                          {/* If typing indicator is active AND the latest is user, show typing here */}
                          {isTyping && (!latest.content || latest.role === 'user') ? (
                            <div className="flex items-center gap-1.5 py-1">
                              <span className="w-2 h-2 rounded-full bg-white/40 animate-[bounce_1.4s_infinite_0ms]" />
                              <span className="w-2 h-2 rounded-full bg-white/40 animate-[bounce_1.4s_infinite_200ms]" />
                              <span className="w-2 h-2 rounded-full bg-white/40 animate-[bounce_1.4s_infinite_400ms]" />
                            </div>
                          ) : (
                            <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{latest.content}</p>
                          )}

                          {latest.role === 'assistant' && latest.content && (
                            <button
                              onClick={() => speakResponse(latest.content)}
                              suppressHydrationWarning
                              className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/5 text-white/70 hover:text-white flex items-center justify-center cursor-pointer shadow-sm"
                              title="Listen"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Previous Responses */}
                    {previous.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-white/30 px-1">Previous responses</div>
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                          {previous.map((msg) => (
                            <div 
                              key={msg.id}
                              className={`p-3.5 rounded-xl border transition-all duration-300 text-xs ${
                                msg.role === 'user'
                                  ? 'bg-blue-950/20 border-blue-500/10 text-white/60'
                                  : 'bg-white/5 border-white/5 text-white/65'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[8px] font-bold tracking-wider text-white/30 uppercase">
                                  {msg.role === 'user' ? 'You' : 'Aɪra'}
                                </span>
                                {msg.role === 'assistant' && (
                                  <button
                                    onClick={() => speakResponse(msg.content)}
                                    suppressHydrationWarning
                                    className="text-white/40 hover:text-white transition-colors"
                                    title="Listen"
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}

            </div>

          </div>
        </div>
        {/* Working Plan / Architecture Section with branding sweep */}
        {!standalone && (
          <div className="mt-20 border-t border-white/10 pt-16">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h3 className="text-2xl font-bold text-white mb-3">Aɪra Assistant Working Plan & Architecture</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Experience zero-latency, secure voice and chat counseling powered by state-of-the-art AI pipelines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
              {/* Connection line (Desktop only) */}
              <div className="hidden md:block absolute top-1/2 left-4 right-4 h-0.5 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-teal-500/30 -translate-y-1/2 -z-10" />

              {/* Step 1 */}
              <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col items-center text-center group hover:border-blue-500/30 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-base font-bold text-blue-400">01</span>
                </div>
                <h4 className="font-semibold text-sm text-white mb-2">User Query</h4>
                <p className="text-xs text-white/50 leading-relaxed">Speak or type a question about Aɪra curriculum or prep.</p>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col items-center text-center group hover:border-indigo-500/30 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-base font-bold text-indigo-400">02</span>
                </div>
                <h4 className="font-semibold text-sm text-white mb-2">Secure API</h4>
                <p className="text-xs text-white/50 leading-relaxed">Backend routes process requests, keeping API keys private.</p>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col items-center text-center group hover:border-purple-500/30 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-base font-bold text-purple-400">03</span>
                </div>
                <h4 className="font-semibold text-sm text-white mb-2">Groq Llama 3.3</h4>
                <p className="text-xs text-white/50 leading-relaxed">Accelerated LLM generates streaming educational context.</p>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col items-center text-center group hover:border-pink-500/30 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-pink-600/10 border border-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-base font-bold text-pink-400">04</span>
                </div>
                <h4 className="font-semibold text-sm text-white mb-2">Aɪra Video Sync</h4>
                <p className="text-xs text-white/50 leading-relaxed">Digital human mouth movements and sways automatically play synced to voice synthesis.</p>
              </div>

              {/* Step 5 */}
              <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col items-center text-center group hover:border-teal-500/30 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-teal-600/10 border border-teal-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-base font-bold text-teal-400">05</span>
                </div>
                <h4 className="font-semibold text-sm text-white mb-2">Live Response</h4>
                <p className="text-xs text-white/50 leading-relaxed">Counselor responds in real-time with Indian English accent.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
