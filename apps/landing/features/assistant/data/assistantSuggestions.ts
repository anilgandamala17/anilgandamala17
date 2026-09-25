import { ASSISTANT_ROUTES } from './assistantKnowledge'
import type { AssistantAction } from '../types/assistant'

export const WELCOME_MESSAGE =
  "Hi! I'm AIra — your learning companion. I can help you explore the platform, find the right path, or answer questions about curriculum and competitive prep."

export const INITIAL_ACTIONS: AssistantAction[] = [
  {
    id: 'explore',
    label: 'Explore AIra',
    description: 'What AIra offers',
    query: 'What is AIra?',
  },
  {
    id: 'tutor',
    label: 'AI Tutor',
    description: 'How teaching works',
    query: 'How does AIra Tutor work?',
  },
  {
    id: 'curriculum',
    label: 'Curriculum',
    description: 'Grades 6–12',
    query: 'Explain Curriculum Mode',
  },
  {
    id: 'competitive',
    label: 'Competitive exams',
    description: 'JEE, NEET & more',
    query: 'Which competitive exams does AIra support?',
  },
]

/** Contextual follow-ups derived from the last user query / topic id */
export function suggestionsForContext(query: string): AssistantAction[] {
  const q = query.toLowerCase()

  if (/class\s*11|class\s*12|mpc|bipc|stream/.test(q)) {
    return [
      { id: 'mpc', label: 'Explore MPC', query: 'Tell me about MPC stream' },
      { id: 'bipc', label: 'Explore BiPC', query: 'Tell me about BiPC stream' },
      {
        id: 'open-curr',
        label: 'Open Curriculum',
        href: ASSISTANT_ROUTES.curriculum,
      },
    ]
  }

  if (/subject|grade\s*[6-9]|class\s*[6-9]|class\s*10|what subjects/.test(q)) {
    return [
      {
        id: 'subjects',
        label: 'Subjects by grade',
        query: 'What subjects are available?',
      },
      {
        id: 'open-curr',
        label: 'Open Curriculum',
        href: ASSISTANT_ROUTES.curriculum,
      },
      { id: 'streams', label: 'Class 11 & 12', query: 'Show me Class 11 and 12 options' },
    ]
  }

  if (/jee|neet|exam|competitive|mock|pyq|eamcet|gate|olympiad/.test(q)) {
    return [
      { id: 'jee', label: 'JEE Main', query: 'How can AIra help with JEE Main?' },
      { id: 'neet', label: 'NEET', query: 'How can AIra help with NEET?' },
      {
        id: 'open-comp',
        label: 'Open Competitive',
        href: ASSISTANT_ROUTES.competitive,
      },
    ]
  }

  if (/tutor|teach|voice|visual|lesson|diagram|narration/.test(q)) {
    return [
      {
        id: 'start',
        label: 'Start learning',
        href: ASSISTANT_ROUTES.modeSelection,
      },
      { id: 'voice', label: 'Voice & visuals', query: 'How does voice and visual learning work?' },
      { id: 'curr', label: 'Curriculum path', query: 'Explain Curriculum Mode' },
    ]
  }

  if (/price|pricing|cost|plan|subscription|₹|rupee/.test(q)) {
    return [
      { id: 'pricing', label: 'View pricing', href: ASSISTANT_ROUTES.pricing },
      { id: 'signup', label: 'Start free', href: ASSISTANT_ROUTES.signup },
      { id: 'enterprise', label: 'For schools', href: ASSISTANT_ROUTES.contact },
    ]
  }

  if (/start|sign\s*up|trial|demo|login|account|onboard/.test(q)) {
    return [
      { id: 'signup', label: 'Start free trial', href: ASSISTANT_ROUTES.signup },
      { id: 'pricing', label: 'View pricing', href: ASSISTANT_ROUTES.pricing },
      { id: 'demo', label: 'Book a demo', href: ASSISTANT_ROUTES.contact },
    ]
  }

  if (/teacher|school|admin|institution/.test(q)) {
    return [
      { id: 'demo', label: 'Book a demo', href: ASSISTANT_ROUTES.contact },
      { id: 'signup', label: 'Student sign up', href: ASSISTANT_ROUTES.signup },
      { id: 'school', label: 'School login', href: '/login?intent=school' },
    ]
  }

  if (/dashboard|progress|analytics/.test(q)) {
    return [
      { id: 'dash', label: 'Open dashboard', href: ASSISTANT_ROUTES.dashboard },
      { id: 'modes', label: 'Learning modes', query: 'What learning modes does AIra have?' },
    ]
  }

  return INITIAL_ACTIONS.slice(0, 3)
}
