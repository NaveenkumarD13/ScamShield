import type { AnalysisResult } from '../types.js'

export interface AnalysisRepository {
  create(analysis: AnalysisResult): Promise<void>
  list(): Promise<AnalysisResult[]>
  findById(id: string): Promise<AnalysisResult | null>
  deleteById(id: string): Promise<boolean>
}
