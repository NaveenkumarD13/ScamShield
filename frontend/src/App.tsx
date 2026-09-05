import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2
} from 'lucide-react'
import type { AnalysisResult, RiskClassification } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

type ViewMode = 'home' | 'analysis' | 'history'

type Filters = {
  risk: 'ALL' | RiskClassification
  inputType: 'ALL' | 'text'
  category: 'ALL' | string
  date: 'ALL' | 'TODAY' | 'WEEK'
}

const defaultFilters: Filters = {
  risk: 'ALL',
  inputType: 'ALL',
  category: 'ALL',
  date: 'ALL'
}

function riskTone(classification: RiskClassification): string {
  switch (classification) {
    case 'LOW':
      return 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
    case 'MEDIUM':
      return 'text-amber-300 border-amber-500/40 bg-amber-500/10'
    case 'HIGH':
      return 'text-orange-300 border-orange-500/40 bg-orange-500/10'
    case 'CRITICAL':
      return 'text-rose-300 border-rose-500/40 bg-rose-500/10'
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Request failed')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

function App() {
  const [view, setView] = useState<ViewMode>('home')
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [activeReport, setActiveReport] = useState<AnalysisResult | null>(null)
  const [filters, setFilters] = useState<Filters>(defaultFilters)

  async function loadHistory(): Promise<void> {
    try {
      const items = await api<AnalysisResult[]>('/api/analyses')
      setHistory(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch analyses')
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  const filteredHistory = useMemo(() => {
    const now = new Date()
    return history.filter((item) => {
      const createdAt = new Date(item.createdAt)
      const dayDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

      if (filters.risk !== 'ALL' && item.riskClassification !== filters.risk) return false
      if (filters.inputType !== 'ALL' && item.inputType !== filters.inputType) return false
      if (filters.category !== 'ALL' && item.category !== filters.category) return false
      if (filters.date === 'TODAY' && dayDiff > 1) return false
      if (filters.date === 'WEEK' && dayDiff > 7) return false
      return true
    })
  }, [filters, history])

  async function analyzeText(): Promise<void> {
    setLoading(true)
    setError(null)

    try {
      const report = await api<AnalysisResult>('/api/analyze/text', {
        method: 'POST',
        body: JSON.stringify({ text: inputText })
      })
      setActiveReport(report)
      setView('analysis')
      setInputText('')
      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze input')
    } finally {
      setLoading(false)
    }
  }

  async function deleteAnalysis(id: string): Promise<void> {
    try {
      await api(`/api/analyses/${id}`, { method: 'DELETE' })
      if (activeReport?.id === id) {
        setActiveReport(null)
      }
      await loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete analysis')
    }
  }

  const categories = Array.from(new Set(history.map((item) => item.category)))

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-900/20 backdrop-blur">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-200">
                <ShieldCheck className="h-4 w-4" />
                AI ScamShield
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Verify Before You Trust.</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Analyze suspicious messages before you act. ScamShield combines structured claim extraction,
                deterministic risk scoring, and evidence-backed recommendations.
              </p>
            </div>
            <nav className="flex gap-2">
              {(['home', 'analysis', 'history'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    view === mode ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {mode[0].toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        )}

        {view === 'home' && (
          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-6">
              <h2 className="text-xl font-semibold text-white">Paste suspicious content</h2>
              <p className="mt-2 text-sm text-slate-300">ScamShield currently supports Phase 1 text analysis.</p>
              <label htmlFor="message" className="sr-only">
                Suspicious message
              </label>
              <textarea
                id="message"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                rows={8}
                className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-100 outline-none ring-cyan-500 transition focus:ring"
                placeholder="Paste suspicious text here..."
              />
              <button
                type="button"
                onClick={() => void analyzeText()}
                disabled={loading || inputText.trim().length < 15}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Clock3 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                Analyze with ScamShield
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <article className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                  <Sparkles className="h-4 w-4" /> How it works
                </h3>
                <ol className="mt-3 space-y-2 text-xs text-slate-300">
                  <li>1. Validate input and extract structured claims.</li>
                  <li>2. Run risk analyzers and collect evidence.</li>
                  <li>3. Apply deterministic weighted scoring.</li>
                  <li>4. Generate recommendations and save history.</li>
                </ol>
              </article>
              <article className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
                <h3 className="text-sm font-semibold text-cyan-200">Supported content types</h3>
                <p className="mt-2 text-xs text-slate-300">Text (active), URL/screenshot/document pipelines are planned next.</p>
              </article>
              <article className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
                <h3 className="text-sm font-semibold text-cyan-200">Privacy & safety</h3>
                <p className="mt-2 text-xs text-slate-300">
                  Avoid submitting unnecessary personal data. You can delete stored analyses from history at any time.
                </p>
              </article>
            </div>
          </section>
        )}

        {view === 'analysis' && activeReport && (
          <section className="space-y-5">
            <article className={`rounded-2xl border p-6 ${riskTone(activeReport.riskClassification)}`}>
              <p className="text-sm uppercase tracking-widest">Risk assessment</p>
              <h2 className="mt-2 text-3xl font-bold">
                {activeReport.riskClassification} — {activeReport.riskScore}/100
              </h2>
              <p className="mt-2 text-sm text-slate-100">{activeReport.summary}</p>
              <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                <p>Confidence: {activeReport.confidence}%</p>
                <p>Uncertainty: {activeReport.uncertainty}%</p>
              </div>
            </article>

            <div className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
                <h3 className="text-sm font-semibold text-white">Detected signals</h3>
                <ul className="mt-3 space-y-2">
                  {activeReport.detectedSignals.map((signal) => (
                    <li key={signal.key} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">
                      <p className="font-medium">{signal.label}</p>
                      <p className="mt-1 text-xs text-slate-400">{signal.details}</p>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
                <h3 className="text-sm font-semibold text-white">Recommendation</h3>
                <p className="mt-3 text-sm text-slate-200">{activeReport.recommendation}</p>
                <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-cyan-200">Extracted claims</h4>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  <li>Organization: {activeReport.extractedClaims.organization}</li>
                  <li>Sender: {activeReport.extractedClaims.sender}</li>
                  <li>Requested action: {activeReport.extractedClaims.requested_action}</li>
                  <li>Payment requested: {activeReport.extractedClaims.payment_requested ? 'Yes' : 'No'}</li>
                  <li>Credential requested: {activeReport.extractedClaims.credential_requested ? 'Yes' : 'No'}</li>
                </ul>
                {activeReport.extractedClaims.claims.length > 0 && (
                  <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Claim statements</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                      {activeReport.extractedClaims.claims.map((claim, index) => (
                        <li key={`${claim}-${index}`}>{claim}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            </div>

            <article className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
              <h3 className="text-sm font-semibold text-white">Evidence (claim → evidence → impact)</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {activeReport.evidence.map((item, index) => (
                  <div key={`${item.claim}-${index}`} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm">
                    <p className="font-semibold text-cyan-100">{item.claim}</p>
                    <p className="mt-2 text-xs text-slate-300">Evidence: {item.evidence}</p>
                    <p className="mt-2 text-xs text-slate-400">Impact: {item.impact}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
              <h3 className="text-sm font-semibold text-white">Investigation timeline</h3>
              <ol className="mt-3 space-y-2">
                {activeReport.investigationTimeline.map((step, index) => (
                  <li key={`${step.stage}-${index}`} className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
                    <div>
                      <p className="font-medium text-slate-100">{step.stage}</p>
                      <p className="text-xs text-slate-400">{step.details}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          </section>
        )}

        {view === 'history' && (
          <section className="space-y-5">
            <article className="grid gap-4 rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5 sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Total analyses</p>
                <p className="mt-1 text-2xl font-semibold text-white">{history.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">High + critical</p>
                <p className="mt-1 text-2xl font-semibold text-rose-200">
                  {history.filter((item) => ['HIGH', 'CRITICAL'].includes(item.riskClassification)).length}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Medium</p>
                <p className="mt-1 text-2xl font-semibold text-amber-200">
                  {history.filter((item) => item.riskClassification === 'MEDIUM').length}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Low</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-200">
                  {history.filter((item) => item.riskClassification === 'LOW').length}
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Filter className="h-4 w-4" /> Filters
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <select
                  aria-label="Filter by risk"
                  className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm"
                  value={filters.risk}
                  onChange={(event) => setFilters((prev) => ({ ...prev, risk: event.target.value as Filters['risk'] }))}
                >
                  <option value="ALL">All risk levels</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <select
                  aria-label="Filter by date"
                  className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm"
                  value={filters.date}
                  onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value as Filters['date'] }))}
                >
                  <option value="ALL">All dates</option>
                  <option value="TODAY">Today</option>
                  <option value="WEEK">Last 7 days</option>
                </select>
                <select
                  aria-label="Filter by input type"
                  className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm"
                  value={filters.inputType}
                  onChange={(event) => setFilters((prev) => ({ ...prev, inputType: event.target.value as Filters['inputType'] }))}
                >
                  <option value="ALL">All input types</option>
                  <option value="text">Text</option>
                </select>
                <select
                  aria-label="Filter by category"
                  className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm"
                  value={filters.category}
                  onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                >
                  <option value="ALL">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Database className="h-4 w-4" /> Analysis history
              </h3>
              <div className="mt-4 space-y-3">
                {filteredHistory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveReport(item)
                      setView('analysis')
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-left transition hover:border-cyan-500/50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-100">{new Date(item.createdAt).toLocaleString()}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.summary}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.inputType} · {item.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-lg border px-3 py-1 text-xs font-semibold ${riskTone(item.riskClassification)}`}>
                          {item.riskClassification} · {item.riskScore}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation()
                            void deleteAnalysis(item.id)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.stopPropagation()
                              void deleteAnalysis(item.id)
                            }
                          }}
                          className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-rose-400 hover:text-rose-200"
                          aria-label={`Delete analysis ${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredHistory.length === 0 && (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-6 text-center text-sm text-slate-300">
                    <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-300" />
                    No analyses match the selected filters.
                  </div>
                )}
              </div>
            </article>
          </section>
        )}

        {!activeReport && view === 'analysis' && (
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-6 text-center text-sm text-slate-300">
            <ShieldAlert className="mx-auto mb-2 h-5 w-5 text-cyan-300" />
            Analyze a message or select an existing report from history.
          </div>
        )}
      </div>
    </div>
  )
}

export default App
