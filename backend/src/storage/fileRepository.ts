import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { AnalysisResult } from '../types.js'
import type { AnalysisRepository } from './repository.js'

export class FileAnalysisRepository implements AnalysisRepository {
  constructor(private readonly filePath: string) {}

  private async readAll(): Promise<AnalysisResult[]> {
    try {
      const raw = await readFile(this.filePath, 'utf-8')
      const parsed = JSON.parse(raw) as AnalysisResult[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  private async writeAll(items: AnalysisResult[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    await writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8')
  }

  async create(analysis: AnalysisResult): Promise<void> {
    const all = await this.readAll()
    all.unshift(analysis)
    await this.writeAll(all)
  }

  async list(): Promise<AnalysisResult[]> {
    return this.readAll()
  }

  async findById(id: string): Promise<AnalysisResult | null> {
    const all = await this.readAll()
    return all.find((item) => item.id === id) ?? null
  }

  async deleteById(id: string): Promise<boolean> {
    const all = await this.readAll()
    const next = all.filter((item) => item.id !== id)
    if (next.length === all.length) {
      return false
    }
    await this.writeAll(next)
    return true
  }
}
