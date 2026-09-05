import type { ClaimExtraction, Signal } from '../types.js'

export interface AnalyzerScores {
  aiAssessment: number
  urlSignals: number
  identityVerification: number
  manipulationUrgency: number
  requestedActionRisk: number
  category: string
  signals: Signal[]
}

function safeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) return false
    return true
  } catch {
    return false
  }
}

export function runSignalAnalyzers(text: string, claims: ClaimExtraction): AnalyzerScores {
  const lowered = text.toLowerCase()
  const signals: Signal[] = []

  const aiAssessment = Math.min(
    100,
    20 +
      (claims.payment_requested ? 24 : 0) +
      (claims.credential_requested ? 24 : 0) +
      (claims.urgency_detected ? 16 : 0) +
      (claims.claims.some((c) => /(winner|selected|reward|suspended|penalty)/i.test(c)) ? 16 : 0)
  )

  if (claims.payment_requested) {
    signals.push({
      key: 'payment-request',
      label: 'Upfront payment requested',
      score: 88,
      severity: 'danger',
      details: 'The content asks for money before providing trustable verification.'
    })
  }

  if (claims.credential_requested) {
    signals.push({
      key: 'credential-request',
      label: 'Sensitive credentials requested',
      score: 90,
      severity: 'danger',
      details: 'Request for OTP/password/PIN indicates possible credential theft.'
    })
  }

  const invalidUrls = claims.urls.filter((url) => !safeUrl(url))
  const suspiciousUrlKeywords = claims.urls.filter((url) => /(bit\.ly|tinyurl|free|bonus|verify|secure-login|update-now)/i.test(url))
  const urlSignals = Math.min(100, invalidUrls.length * 35 + suspiciousUrlKeywords.length * 30 + (claims.urls.length > 0 ? 30 : 0))

  if (claims.urls.length > 0) {
    signals.push({
      key: 'url-presence',
      label: 'External URL present',
      score: 55,
      severity: suspiciousUrlKeywords.length > 0 ? 'warning' : 'info',
      details: suspiciousUrlKeywords.length > 0
        ? 'URL contains urgency or lure-style patterns often used in phishing campaigns.'
        : 'Links in unsolicited messages should be independently verified.'
    })
  }

  if (invalidUrls.length > 0) {
    signals.push({
      key: 'unsafe-url',
      label: 'Potentially unsafe URL pattern',
      score: 80,
      severity: 'danger',
      details: 'One or more URLs use unsupported or local/private host patterns.'
    })
  }

  const identityMismatch = claims.organization === 'Unknown' ||
    (claims.email_addresses.length > 0 && claims.organization !== 'Unknown' && claims.email_addresses.every((email) => !email.toLowerCase().includes(claims.organization.toLowerCase().replace(/\s+/g, ''))))

  const identityVerification = identityMismatch ? 78 : 28
  if (identityMismatch) {
    signals.push({
      key: 'identity-mismatch',
      label: 'Identity inconsistency detected',
      score: 75,
      severity: 'warning',
      details: 'Claimed organization and contact details cannot be confidently linked.'
    })
  }

  const manipulationUrgency = claims.urgency_detected || /(limited time|act now|last warning|immediately)/i.test(lowered) ? 82 : 18
  if (manipulationUrgency > 70) {
    signals.push({
      key: 'urgency-pressure',
      label: 'Urgency / pressure language',
      score: 74,
      severity: 'warning',
      details: 'The message applies urgency pressure that can reduce careful decision-making.'
    })
  }

  const requestedActionRisk = claims.payment_requested || claims.credential_requested
    ? 84
    : /click|download|install|share|reply/i.test(claims.requested_action)
      ? 50
      : 15

  const category = claims.payment_requested
    ? 'payment-fraud'
    : claims.credential_requested
      ? 'credential-phishing'
      : claims.urls.length > 0
        ? 'link-verification'
        : 'general-verification'

  return {
    aiAssessment,
    urlSignals,
    identityVerification,
    manipulationUrgency,
    requestedActionRisk,
    category,
    signals
  }
}
