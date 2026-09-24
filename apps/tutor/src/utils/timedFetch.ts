import { analytics } from '@/services/analyticsService'
import type { ApiEndpointName } from '@/services/analyticsTypes'

/** Timed fetch that reports api_performance without logging URLs or bodies. */
export async function timedFetch(
  endpointName: ApiEndpointName,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const started = performance.now()
  try {
    const res = await fetch(input, init)
    analytics.apiPerformance({
      endpointName,
      durationMs: Math.round(performance.now() - started),
      statusCode: res.status,
      success: res.ok,
    })
    return res
  } catch (err) {
    analytics.apiPerformance({
      endpointName,
      durationMs: Math.round(performance.now() - started),
      statusCode: 0,
      success: false,
    })
    analytics.error({
      errorArea: 'api',
      errorType: 'network',
      severity: 'error',
    })
    throw err
  }
}
