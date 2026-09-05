import type { ClaimExtraction, EvidenceItem, Signal } from '../types.js'

export function buildEvidence(claims: ClaimExtraction, signals: Signal[]): EvidenceItem[] {
  const evidence: EvidenceItem[] = signals.map((signal) => ({
    claim: signal.label,
    evidence: signal.details,
    impact: signal.severity === 'danger'
      ? 'Strongly increases risk and requires verification before any action.'
      : signal.severity === 'warning'
        ? 'Raises risk and suggests further validation is needed.'
        : 'Provides contextual information for cautious handling.'
  }))

  if (claims.payment_requested) {
    evidence.push({
      claim: 'Payment request detected',
      evidence: 'Message includes payment keywords such as fee, transfer, deposit, or currency markers.',
      impact: 'Advance payment requests are frequently associated with social engineering scams.'
    })
  }

  if (claims.credential_requested) {
    evidence.push({
      claim: 'Credential request detected',
      evidence: 'Message asks for sensitive authentication details (OTP/password/PIN).',
      impact: 'Sharing credentials can directly compromise accounts and identity.'
    })
  }

  return evidence.slice(0, 8)
}
