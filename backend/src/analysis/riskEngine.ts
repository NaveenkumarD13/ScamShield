import type { RiskClassification } from '../types.js'

export interface RiskInputs {
  aiAssessment: number
  urlSignals: number
  identityVerification: number
  manipulationUrgency: number
  requestedActionRisk: number
}

export interface RiskOutput {
  score: number
  classification: RiskClassification
  confidence: number
  uncertainty: number
}

const WEIGHTS = {
  aiAssessment: 0.3,
  urlSignals: 0.2,
  identityVerification: 0.2,
  manipulationUrgency: 0.15,
  requestedActionRisk: 0.15
} as const

function classify(score: number): RiskClassification {
  if (score <= 30) return 'LOW'
  if (score <= 60) return 'MEDIUM'
  if (score <= 80) return 'HIGH'
  return 'CRITICAL'
}

export function calculateDeterministicRisk(input: RiskInputs): RiskOutput {
  const score = Math.round(
    input.aiAssessment * WEIGHTS.aiAssessment +
      input.urlSignals * WEIGHTS.urlSignals +
      input.identityVerification * WEIGHTS.identityVerification +
      input.manipulationUrgency * WEIGHTS.manipulationUrgency +
      input.requestedActionRisk * WEIGHTS.requestedActionRisk
  )

  const normalized = Math.max(0, Math.min(100, score))
  const confidence = Math.max(
    15,
    Math.min(
      95,
      Math.round(
        65 +
          (input.aiAssessment + input.urlSignals + input.identityVerification + input.manipulationUrgency) / 12 -
          Math.abs(input.aiAssessment - input.identityVerification) / 8
      )
    )
  )

  return {
    score: normalized,
    classification: classify(normalized),
    confidence,
    uncertainty: 100 - confidence
  }
}
