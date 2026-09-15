/** Mirrors landing `lib/analytics/admin-report` response (client-safe types). */

export type MetricPoint = { date: string; value: number }

export type NamedCount = { name: string; count: number; users?: number }

export type KpiValue = {
  value: number | null
  previous: number | null
  changePercent: number | null
}

export type AdminAnalyticsReport = {
  configured: boolean
  source: 'ga4' | 'none'
  message?: string
  error?: string
  error_category?: string
  range: {
    preset: string
    startDate: string
    endDate: string
    previousStartDate: string
    previousEndDate: string
  }
  kpis: Record<string, KpiValue>
  timeseries: {
    users: MetricPoint[]
    sessions: MetricPoint[]
    newUsers: MetricPoint[]
  }
  topPages: Array<{ page: string; views: number; users: number }>
  events: Array<{
    event: string
    count: number
    users: number
    eventsPerUser: number | null
  }>
  modeUsage: NamedCount[]
  curriculum: {
    classes: NamedCount[]
    subjects: NamedCount[]
    topics: NamedCount[]
    lessonStarted: number
    lessonCompleted: number
    lessonExit: number
  }
  competitive: {
    testsStarted: number
    testsCompleted: number
    testsAbandoned: number
    questionsAttempted: number
    answersCorrect: number
    answersIncorrect: number
    modeOpened?: number
    examSelected?: number
    sectionViews?: NamedCount[]
    byFlowType?: NamedCount[]
    topExams?: NamedCount[]
    explanationsStarted?: number
    explanationsCompleted?: number
    explanationsExit?: number
    performanceViews?: number
  }
  aiTeacher: {
    teachingPageViews: number
    lessonsStarted: number
    lessonsCompleted: number
    questionsAsked: number
    answersReceived: number
    errors: number
  }
  auth: {
    signUps: number
    logins: number
    loginFailed: number
    logouts: number
  }
  cache: {
    contentLoaded: number
    cacheHits: number
    cacheMisses: number
  }
  performance: {
    pagePerformanceEvents: number
    apiPerformanceEvents: number
    apiSlowOrCritical?: number
  }
  funnel: Array<{
    stage: string
    event: string
    users: number
    dropOffPercent: number | null
  }>
  devices: NamedCount[]
  browsers: NamedCount[]
  os: NamedCount[]
  countries: NamedCount[]
  errors: NamedCount[]
  realtime: {
    activeUsers: number | null
    label: string
  }
  firestore: {
    registeredUsers: number | null
  }
  propertyId?: string | null
}
