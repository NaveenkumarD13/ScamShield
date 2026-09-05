import { describe, expect, it } from 'vitest'
import { runTextInvestigation } from '../src/analysis/orchestrator.js'

describe('runTextInvestigation', () => {
  it('returns deterministic structured report for risky message', async () => {
    const result = await runTextInvestigation(
      'Congratulations! You have been selected for a work-from-home internship. Pay ₹999 registration fee immediately to confirm your position. Contact hr-team@career-fasttrack.biz now.'
    )

    expect(result.riskScore).toBeGreaterThanOrEqual(61)
    expect(['HIGH', 'CRITICAL']).toContain(result.riskClassification)
    expect(result.extractedClaims.payment_requested).toBe(true)
    expect(result.detectedSignals.length).toBeGreaterThan(0)
    expect(result.evidence.length).toBeGreaterThan(0)
    expect(result.investigationTimeline.length).toBeGreaterThanOrEqual(5)
  })
})
