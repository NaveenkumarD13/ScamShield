import cors from 'cors'
import express, { type Request, type Response, type NextFunction } from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { resolve } from 'node:path'
import { z } from 'zod'
import { runTextInvestigation } from './analysis/orchestrator.js'
import { textAnalyzeRequestSchema, idParamSchema } from './schemas.js'
import { FileAnalysisRepository } from './storage/fileRepository.js'

const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS ?? 12000)
const repositoryPath =
  process.env.ANALYSIS_STORE_PATH ??
  (process.env.NODE_ENV === 'test'
    ? resolve('/tmp/scamshield-tests/analyses.dev.json')
    : resolve(process.cwd(), '../database/analyses.dev.json'))
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const repository = new FileAnalysisRepository(repositoryPath)

export const app = express()

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('Origin not allowed by CORS policy'))
    }
  })
)
app.use(express.json({ limit: '50kb' }))
app.use(
  rateLimit({
    windowMs: 60_000,
    max: Number(process.env.RATE_LIMIT_MAX ?? 30),
    standardHeaders: true,
    legacyHeaders: false
  })
)

app.use((req, res, next) => {
  req.setTimeout(timeoutMs)
  res.setTimeout(timeoutMs, () => {
    if (!res.headersSent) {
      res.status(503).json({ error: 'Request timed out. Please try again.' })
    }
  })
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'scamshield-api',
    timestamp: new Date().toISOString()
  })
})

app.post('/api/analyze/text', async (req, res, next) => {
  try {
    const payload = textAnalyzeRequestSchema.parse(req.body)
    const report = await runTextInvestigation(payload.text)
    await repository.create(report)
    res.status(201).json(report)
  } catch (error) {
    next(error)
  }
})

app.get('/api/analyses', async (_req, res, next) => {
  try {
    const items = await repository.list()
    res.json(items)
  } catch (error) {
    next(error)
  }
})

app.get('/api/analyses/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params)
    const analysis = await repository.findById(id)
    if (!analysis) {
      res.status(404).json({ error: 'Analysis not found.' })
      return
    }
    res.json(analysis)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/analyses/:id', async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params)
    const deleted = await repository.deleteById(id)
    if (!deleted) {
      res.status(404).json({ error: 'Analysis not found.' })
      return
    }
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => issue.message)
    })
    return
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error'
  res.status(500).json({ error: message })
})
