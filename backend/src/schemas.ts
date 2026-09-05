import { z } from 'zod'

export const textAnalyzeRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(15, 'Please provide more context (at least 15 characters).')
    .max(5000, 'Input is too long for Phase 1 analysis (max 5000 characters).')
})

const sanitizedStringArray = z.array(z.string().trim().min(1)).default([])

export const claimExtractionSchema = z.object({
  sender: z.string().trim().default('Unknown'),
  organization: z.string().trim().default('Unknown'),
  claims: sanitizedStringArray,
  requested_action: z.string().trim().default('No direct action detected'),
  payment_requested: z.boolean().default(false),
  credential_requested: z.boolean().default(false),
  urgency_detected: z.boolean().default(false),
  urls: sanitizedStringArray,
  phone_numbers: sanitizedStringArray,
  email_addresses: sanitizedStringArray,
  dates: sanitizedStringArray,
  locations: sanitizedStringArray
})

export const idParamSchema = z.object({
  id: z.uuid()
})
