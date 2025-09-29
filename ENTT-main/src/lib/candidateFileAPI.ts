import type { Candidate } from './database'
interface CandidatesData {
  candidates: Candidate[]
}
class CandidateFileAPI {
  private baseDelay = 300
  private candidatesData: CandidatesData | null = null
  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.baseDelay + Math.random() * 200))
  }
  private async loadCandidatesData(): Promise<CandidatesData> {
    if (this.candidatesData) {
      return this.candidatesData
    }
    try {
      const response = await fetch('/data/candidates.json')
      if (!response.ok) {
        throw new Error(`Failed to load candidates: ${response.statusText}`)
      }
      this.candidatesData = await response.json()
      return this.candidatesData!
    } catch (error) {
      console.error('Failed to load candidates data:', error)
      return { candidates: [] }
    }
  }
  private async saveCandidatesData(data: CandidatesData): Promise<void> {
    this.candidatesData = data
  }
  async getCandidates(params: any = {}) {
    await this.delay()
    const data = await this.loadCandidatesData()
    let candidates = [...data.candidates]
    if (params.search) {
      const search = params.search.toLowerCase()
      candidates = candidates.filter(candidate => 
        candidate.name.toLowerCase().includes(search) ||
        candidate.email.toLowerCase().includes(search) ||
        (candidate.phone && candidate.phone.toLowerCase().includes(search))
      )
    }
    if (params.stage) {
      candidates = candidates.filter(candidate => candidate.stage === params.stage)
    }
    if (params.jobId) {
      candidates = candidates.filter(candidate => candidate.jobId === params.jobId)
    }
    if (params.sortBy) {
      candidates.sort((a, b) => {
        const aVal = a[params.sortBy as keyof Candidate] as string
        const bVal = b[params.sortBy as keyof Candidate] as string
        return params.sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
      })
    } else {
      candidates.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    }
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const paginatedCandidates = candidates.slice(start, start + pageSize)
    const result = {
      candidates: paginatedCandidates,
      total: candidates.length,
      page,
      pageSize,
      totalPages: Math.ceil(candidates.length / pageSize)
    }
    return result
  }
  async getCandidate(id: string): Promise<Candidate | null> {
    await this.delay()
    const data = await this.loadCandidatesData()
    const candidate = data.candidates.find(c => c.id === id)
    if (!candidate) {
      return null
    }
    return candidate
  }
  async addCandidate(candidateData: Omit<Candidate, 'id'>) {
    await this.delay()
    const data = await this.loadCandidatesData()
    const maxId = Math.max(0, ...data.candidates.map(c => parseInt(c.id) || 0))
    const newId = (maxId + 1).toString()
    const newCandidate: Candidate = {
      ...candidateData,
      id: newId,
      appliedAt: candidateData.appliedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: candidateData.notes || [],
      timeline: candidateData.timeline || [
        {
          id: crypto.randomUUID(),
          type: 'stage_change',
          description: 'Application submitted',
          timestamp: new Date().toISOString(),
          data: {
            newStage: candidateData.stage || 'applied',
            author: 'System'
          }
        }
      ]
    }
    data.candidates.unshift(newCandidate)
    await this.saveCandidatesData(data)
    return newCandidate
  }
  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    await this.delay()
    const data = await this.loadCandidatesData()
    const candidateIndex = data.candidates.findIndex(c => c.id === id)
    if (candidateIndex === -1) {
      throw new Error(`Candidate with id ${id} not found`)
    }
    const updatedCandidate = {
      ...data.candidates[candidateIndex],
      ...updates,
      id, 
      updatedAt: new Date().toISOString()
    }
    data.candidates[candidateIndex] = updatedCandidate
    await this.saveCandidatesData(data)
    return updatedCandidate
  }
  async updateCandidateStage(candidateId: string, stage: string, note?: string): Promise<Candidate> {
    await this.delay()
    const data = await this.loadCandidatesData()
    const candidateIndex = data.candidates.findIndex(c => c.id === candidateId)
    if (candidateIndex === -1) {
      throw new Error(`Candidate with id ${candidateId} not found`)
    }
    const candidate = data.candidates[candidateIndex]
    const previousStage = candidate.stage
    const updatedCandidate = {
      ...candidate,
      stage: stage as any,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...(candidate.timeline || []),
        {
          id: crypto.randomUUID(),
          type: 'stage_change' as const,
          description: note || `Candidate moved to ${stage} stage`,
          timestamp: new Date().toISOString(),
          data: { 
            previousStage,
            newStage: stage,
            author: 'Current User'
          }
        }
      ]
    }
    data.candidates[candidateIndex] = updatedCandidate
    await this.saveCandidatesData(data)
    return updatedCandidate
  }
  async addCandidateNote(candidateId: string, note: any): Promise<Candidate> {
    await this.delay()
    const data = await this.loadCandidatesData()
    const candidateIndex = data.candidates.findIndex(c => c.id === candidateId)
    if (candidateIndex === -1) {
      throw new Error(`Candidate with id ${candidateId} not found`)
    }
    const candidate = data.candidates[candidateIndex]
    const updatedCandidate = {
      ...candidate,
      updatedAt: new Date().toISOString(),
      notes: [
        ...(candidate.notes || []),
        note
      ],
      timeline: [
        ...(candidate.timeline || []),
        {
          id: crypto.randomUUID(),
          type: 'note_added' as const,
          description: `Note: ${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}`,
          timestamp: new Date().toISOString(),
          data: { 
            author: note.author,
            noteId: note.id
          }
        }
      ]
    }
    data.candidates[candidateIndex] = updatedCandidate
    await this.saveCandidatesData(data)
    return updatedCandidate
  }
  async deleteCandidate(id: string): Promise<boolean> {
    await this.delay()
    const data = await this.loadCandidatesData()
    const candidateIndex = data.candidates.findIndex(c => c.id === id)
    if (candidateIndex === -1) {
      return false
    }
    const deletedCandidate = data.candidates[candidateIndex]
    data.candidates.splice(candidateIndex, 1)
    await this.saveCandidatesData(data)
    return true
  }
  async getCandidateStats() {
    await this.delay()
    const data = await this.loadCandidatesData()
    const candidates = data.candidates
    const stats = {
      total: candidates.length,
      byStage: candidates.reduce((acc, candidate) => {
        acc[candidate.stage] = (acc[candidate.stage] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byJob: candidates.reduce((acc, candidate) => {
        acc[candidate.jobId] = (acc[candidate.jobId] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentApplications: candidates.filter(c => {
        const appliedDate = new Date(c.appliedAt)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return appliedDate > weekAgo
      }).length
    }
    return stats
  }
  async searchCandidates(query: string) {
    return this.getCandidates({ search: query, pageSize: 100 })
  }
  async getCandidatesByJob(jobId: string) {
    return this.getCandidates({ jobId, pageSize: 100 })
  }
  async getCandidatesByStage(stage: string) {
    return this.getCandidates({ stage, pageSize: 100 })
  }
  async updateMultipleCandidates(updates: { id: string; updates: Partial<Candidate> }[]) {
    await this.delay()
    const data = await this.loadCandidatesData()
    const updatedCandidates: Candidate[] = []
    for (const { id, updates: candidateUpdates } of updates) {
      const candidateIndex = data.candidates.findIndex(c => c.id === id)
      if (candidateIndex !== -1) {
        data.candidates[candidateIndex] = {
          ...data.candidates[candidateIndex],
          ...candidateUpdates,
          id, 
          updatedAt: new Date().toISOString()
        }
        updatedCandidates.push(data.candidates[candidateIndex])
      }
    }
    await this.saveCandidatesData(data)
    return updatedCandidates
  }
  async deleteMultipleCandidates(ids: string[]) {
    await this.delay()
    const data = await this.loadCandidatesData()
    const deletedCandidates: Candidate[] = []
    data.candidates = data.candidates.filter(candidate => {
      if (ids.includes(candidate.id)) {
        deletedCandidates.push(candidate)
        return false
      }
      return true
    })
    await this.saveCandidatesData(data)
    return deletedCandidates
  }
}
export const candidateFileAPI = new CandidateFileAPI()
