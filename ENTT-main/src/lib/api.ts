import { persistenceHelpers } from './database'
import { fileAPI } from './fileAPI'
import { candidateFileAPI } from './candidateFileAPI'
import type { Job, Candidate, Assessment } from './database'
class SimpleAPI {
  baseDelay = 300 
  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.baseDelay + Math.random() * 200))
  }
  async getJobs(params: any = {}) {
    await this.delay()
    return await fileAPI.getJobs(params)
  }
  async getCandidates(params: any = {}) {
    await this.delay()
    return await candidateFileAPI.getCandidates(params)
  }
  async getAssessments() {
    await this.delay()
    const { jobs } = await persistenceHelpers.getJobs({ pageSize: 100 })
    const assessments = []
    for (const job of jobs) {
      const assessment = await persistenceHelpers.getAssessment(job.id)
      if (assessment) {
        assessments.push(assessment)
      }
    }
    return assessments
  }
  async addJob(job: Omit<Job, 'id'>) {
    await this.delay()
    return await fileAPI.addJob(job)
  }
  async updateJob(id: string, updates: Partial<Job>) {
    await this.delay()
    return await fileAPI.updateJob(id, updates)
  }
  async deleteJob(id: string) {
    await this.delay()
    return await fileAPI.deleteJob(id)
  }
  async reorderJobs({ jobId, fromOrder, toOrder }: { jobId: string; fromOrder: number; toOrder: number }) {
    await this.delay()
    return await this.updateJob(jobId, { order: toOrder })
  }
  async updateCandidate(id: string, updates: Partial<Candidate>) {
    await this.delay()
    return await candidateFileAPI.updateCandidate(id, updates)
  }
  async addAssessment(assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>) {
    await this.delay()
    const newAssessment: Assessment = {
      ...assessment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return await persistenceHelpers.saveAssessment(newAssessment)
  }
  async updateAssessment(id: string, updates: Partial<Assessment>) {
    await this.delay()
    const assessment = updates as Assessment
    return await persistenceHelpers.saveAssessment(assessment)
  }
  async deleteAssessment(id: string) {
    await this.delay()
    throw new Error('Delete assessment not implemented')
  }
 
  async getCandidate(candidateId: string) {
    await this.delay()
    return await candidateFileAPI.getCandidate(candidateId)
  }
  async updateCandidateStage(candidateId: string, stage: string, note?: string) {
    await this.delay()
    return await candidateFileAPI.updateCandidateStage(candidateId, stage, note)
  }
  async addCandidateNote(candidateId: string, note: any) {
    await this.delay()
    return await candidateFileAPI.addCandidateNote(candidateId, note)
  }
}
export const api = new SimpleAPI()
