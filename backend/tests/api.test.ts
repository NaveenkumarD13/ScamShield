import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../src/app.js'

describe('ScamShield API', () => {
  it('analyzes text and stores result', async () => {
    const response = await request(app)
      .post('/api/analyze/text')
      .send({
        text: 'Urgent: update your payroll account now and share OTP to avoid suspension. Pay 1000 to keep service active.'
      })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('riskScore')

    const listResponse = await request(app).get('/api/analyses')
    expect(listResponse.status).toBe(200)
    expect(Array.isArray(listResponse.body)).toBe(true)
    expect(listResponse.body.length).toBeGreaterThan(0)
  })

  it('validates short input', async () => {
    const response = await request(app).post('/api/analyze/text').send({ text: 'short' })
    expect(response.status).toBe(400)
  })
})
