import { randomUUID } from 'node:crypto'
import { extractStructuredClaims } from '../ai/claimExtractor.js'
import { runSignalAnalyzers } from './analyzers.js'
import { buildEvidence } from './evidence.js'
import { buildExplanation } from './explanation.js'
import { calculateDeterministicRisk } from './riskEngine.js'
import { buildRecommendation } from './recommendation.js'
import type { AnalysisResult, TimelineStep } from '../types.js'

function step(stage: string, details: string): TimelineStep {
  return {
    stage,
    details,
    status: 'completed',
    timestamp: new Date().toISOString()
  }
}

export async function runTextInvestigation(text: string): Promise<AnalysisResult> {
  const timeline: TimelineStep[] = [step('Input received', 'Text payload accepted and validated.')]

  const extractedClaims = extractStructuredClaims(text)
  timeline.push(step('Claims extracted', 'Structured claim extraction completed and schema-validated.'))

  const scores = runSignalAnalyzers(text, extractedClaims)
  timeline.push(step('Signals analyzed', 'Text, pattern, identity, and URL safety signals evaluated.'))

  const risk = calculateDeterministicRisk(scores)
  timeline.push(step('Risk calculated', 'Deterministic weighted scoring engine produced final risk score.'))

  const evidence = buildEvidence(extractedClaims, scores.signals)
  timeline.push(step('Evidence collected', 'Claim/evidence/impact evidence cards generated.'))

  const explanation = buildExplanation(risk.classification, risk.score, scores.signals)
  const recommendation = buildRecommendation(risk.classification, extractedClaims)
  timeline.push(step('Recommendation generated', 'Recommendation and final report summary generated.'))

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    inputType: 'text',
    category: scores.category,
    summary: explanation,
    sourcePreview: text.slice(0, 240),
    riskScore: risk.score,
    riskClassification: risk.classification,
    confidence: risk.confidence,
    uncertainty: risk.uncertainty,
    extractedClaims,
    detectedSignals: scores.signals,
    evidence,
    explanation,
    recommendation,
    investigationTimeline: timeline
  }
}
