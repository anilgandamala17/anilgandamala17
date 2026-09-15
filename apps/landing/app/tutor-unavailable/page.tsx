/**
 * FRONTEND-ONLY: replaces former /api/tutor-health rewrite target.
 * Shown when Landing cannot reach the Vite tutor.
 */
export default function TutorUnavailablePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Tutor app not running</h1>
        <p className="text-slate-600">
          The tutor app is not reachable right now. Start the full stack with{' '}
          <code className="text-sm">npm run dev</code> from the frontend root, then reload.
        </p>
      </div>
    </main>
  )
}
