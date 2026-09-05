import { claimExtractionSchema } from '../schemas.js'
import type { ClaimExtraction } from '../types.js'

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const PHONE_REGEX = /(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){9,12}\d/g
const URL_REGEX = /https?:\/\/[^\s]+/gi
const DATE_REGEX = /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g

function extractClaims(text: string): string[] {
  return text
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20)
    .slice(0, 5)
}

function detectRequestedAction(text: string): string {
  const candidates = [
    'pay',
    'transfer',
    'verify',
    'click',
    'share',
    'reply',
    'confirm',
    'update'
  ]
  const lowered = text.toLowerCase()
  const found = candidates.find((action) => lowered.includes(action))
  if (!found) return 'No explicit action detected'
  return `User is being asked to ${found} immediately or through a provided channel.`
}

function detectOrganization(text: string): string {
  const orgPattern = /\b(?:from|by|at)\s+([A-Z][\w&.-]{1,30}(?:\s+[A-Z][\w&.-]{1,30}){0,3})/g
  const match = orgPattern.exec(text)
  return match?.[1]?.trim() ?? 'Unknown'
}

function detectSender(text: string): string {
  const senderPattern = /\b(?:dear|hello|hi)\s+([A-Z][\w.-]{1,30})/i
  const match = senderPattern.exec(text)
  return match?.[1] ?? 'Unknown'
}

function extractLocations(text: string): string[] {
  const locationPattern = /\b(?:in|at|near)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/g
  const values: string[] = []
  let match: RegExpExecArray | null
  while ((match = locationPattern.exec(text)) !== null) {
    values.push(match[1])
  }
  return Array.from(new Set(values)).slice(0, 5)
}

export function extractStructuredClaims(text: string): ClaimExtraction {
  const lowered = text.toLowerCase()
  const rawOutput: unknown = {
    sender: detectSender(text),
    organization: detectOrganization(text),
    claims: extractClaims(text),
    requested_action: detectRequestedAction(text),
    payment_requested: /(pay|fee|registration|upi|bank transfer|deposit|₹|\$|money)/i.test(text),
    credential_requested: /(otp|password|pin|cvv|login|credential|verify account)/i.test(text),
    urgency_detected: /(immediate|urgent|within\s+\d+|now|asap|last chance|expires today)/i.test(text),
    urls: Array.from(new Set(text.match(URL_REGEX) ?? [])),
    phone_numbers: Array.from(new Set(text.match(PHONE_REGEX) ?? [])),
    email_addresses: Array.from(new Set(text.match(EMAIL_REGEX) ?? [])),
    dates: Array.from(new Set(text.match(DATE_REGEX) ?? [])),
    locations: extractLocations(text)
  }

  return claimExtractionSchema.parse(rawOutput)
}
