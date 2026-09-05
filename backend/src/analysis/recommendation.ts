import type { ClaimExtraction, RiskClassification } from '../types.js'

export function buildRecommendation(classification: RiskClassification, claims: ClaimExtraction): string {
  if (classification === 'CRITICAL' || classification === 'HIGH') {
    return 'Do not proceed with the requested action. Verify using an independently trusted channel and avoid sharing money, credentials, or OTP details.'
  }

  if (claims.urls.length > 0) {
    return 'Before acting, verify the URL through the official organization website and do not log in through links from unsolicited messages.'
  }

  if (classification === 'MEDIUM') {
    return 'Pause and verify sender identity, organization details, and request legitimacy before taking any action.'
  }

  return 'No major risk signals were found, but continue with normal caution and verify unexpected requests independently.'
}
