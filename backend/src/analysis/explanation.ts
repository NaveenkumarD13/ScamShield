import type { RiskClassification, Signal } from '../types.js'

export function buildExplanation(classification: RiskClassification, score: number, signals: Signal[]): string {
  const topSignals = signals
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((signal) => signal.label.toLowerCase())

  if (topSignals.length === 0) {
    return `ScamShield classified this as ${classification} (${score}/100) with no high-impact scam signals detected in Phase 1 text analysis.`
  }

  return `ScamShield classified this as ${classification} (${score}/100) due to ${topSignals.join(', ')}.`
}
