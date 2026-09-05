export type RiskClassification = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ClaimExtraction {
  sender: string
  organization: string
  claims: string[]
  requested_action: string
  payment_requested: boolean
  credential_requested: boolean
  urgency_detected: boolean
  urls: string[]
  phone_numbers: string[]
  email_addresses: string[]
  dates: string[]
  locations: string[]
}

export interface Signal {
  key: string
  label: string
  score: number
  severity: 'info' | 'warning' | 'danger'
  details: string
}

export interface EvidenceItem {
  claim: string
  evidence: string
  impact: string
}

export interface TimelineStep {
  stage: string
  status: 'completed'
  details: string
  timestamp: string
}

export interface AnalysisResult {
  id: string
  createdAt: string
  inputType: 'text'
  category: string
  summary: string
  sourcePreview: string
  riskScore: number
  riskClassification: RiskClassification
  confidence: number
  uncertainty: number
  extractedClaims: ClaimExtraction
  detectedSignals: Signal[]
  evidence: EvidenceItem[]
  explanation: string
  recommendation: string
  investigationTimeline: TimelineStep[]
}
