import Dexie, { Table } from 'dexie'
export interface Job {
  id: string
  title: string
  slug: string
  status: 'active' | 'archived'
  tags: string[]
  order: number
  company?: string
  location?: string
  type?: string
  salary?: string
  description?: string
  requirements?: string[]
  benefits?: string[]
  postedDate?: string
  applicationDeadline?: string
  createdAt?: string
  updatedAt?: string
}
export interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  stage: 'applied' | 'screen' | 'tech' | 'offer' | 'hired' | 'rejected'
  jobId: string
  appliedAt: string
  updatedAt: string
  resume?: string
  notes: CandidateNote[]
  timeline: CandidateTimelineEvent[]
}
export interface CandidateNote {
  id: string
  content: string
  author: string
  createdAt: string
  mentions: string[]
}
export interface CandidateTimelineEvent {
  id: string
  type: 'stage_change' | 'note_added' | 'assessment_completed' | 'interview_scheduled'
  description: string
  timestamp: string
  data?: Record<string, any>
}
export interface Assessment {
  id: string
  jobId: string
  title: string
  description?: string
  sections: AssessmentSection[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}
export interface AssessmentSection {
  id: string
  title: string
  description?: string
  questions: Question[]
  order: number
}
export interface Question {
  id: string
  type: 'single-choice' | 'multi-choice' | 'short-text' | 'long-text' | 'numeric' | 'file-upload'
  title: string
  description?: string
  required: boolean
  options?: QuestionOption[]
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
  }
  conditional?: {
    dependsOn: string
    condition: 'equals' | 'not-equals' | 'contains'
    value: string
  }
}
export interface QuestionOption {
  id: string
  text: string
  value: string
}
export interface AssessmentResponse {
  id: string
  assessmentId: string
  candidateId: string
  responses: Record<string, any>
  submittedAt: string
  score?: number
}
class TalentFlowDatabase extends Dexie {
  jobs!: Table<Job>
  candidates!: Table<Candidate>
  assessments!: Table<Assessment>
  assessmentResponses!: Table<AssessmentResponse>
  constructor() {
    super('TalentFlowDatabase')
    this.version(1).stores({
      jobs: 'id, title, status, order, *tags, createdAt',
      candidates: 'id, name, email, stage, jobId, appliedAt',
      assessments: 'id, jobId, isActive, createdAt',
      assessmentResponses: 'id, assessmentId, candidateId, submittedAt'
    })
  }
}
export const db = new TalentFlowDatabase()
export const persistenceHelpers = {
  async saveJob(job: Job): Promise<Job> {
    await db.jobs.put(job)
    return job
  },
  async getJobs(filters?: {
    search?: string
    status?: string
    page?: number
    pageSize?: number
    sort?: string
  }): Promise<{ jobs: Job[]; total: number }> {
    const sortParam = filters?.sort || 'order:asc'
    const [sortField, sortDirection] = sortParam.split(':')
    let query = db.jobs.orderBy(sortField === 'createdAt' ? 'createdAt' : 'order')
    if (sortDirection === 'desc') {
      query = query.reverse()
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.filter(job => job.status === filters.status)
    }
    if (filters?.search) {
      query = query.filter(job => {
        const searchTerm = filters.search!.toLowerCase()
        return job.title.toLowerCase().includes(searchTerm) ||
               (job.description?.toLowerCase().includes(searchTerm) || false) ||
               (job.company?.toLowerCase().includes(searchTerm) || false) ||
               (job.location?.toLowerCase().includes(searchTerm) || false) ||
               (job.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm)) || false)
      })
    }
    const total = await query.count()
    if (filters?.page && filters?.pageSize) {
      const offset = (filters.page - 1) * filters.pageSize
      query = query.offset(offset).limit(filters.pageSize)
    }
    const jobs = await query.toArray()
    return { jobs, total }
  },
  async deleteJob(id: string): Promise<void> {
    await db.jobs.delete(id)
  },
  async saveCandidate(candidate: Candidate): Promise<Candidate> {
    await db.candidates.put(candidate)
    return candidate
  },
  async getCandidates(filters?: {
    search?: string
    stage?: string
    jobId?: string
    page?: number
    pageSize?: number
  }): Promise<{ candidates: Candidate[]; total: number }> {
    let query = db.candidates.orderBy('appliedAt').reverse()
    if (filters?.stage) {
      query = query.filter(candidate => candidate.stage === filters.stage)
    }
    if (filters?.jobId) {
      query = query.filter(candidate => candidate.jobId === filters.jobId)
    }
    if (filters?.search) {
      query = query.filter(candidate => 
        candidate.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        candidate.email.toLowerCase().includes(filters.search!.toLowerCase())
      )
    }
    const total = await query.count()
    if (filters?.page && filters?.pageSize) {
      const offset = (filters.page - 1) * filters.pageSize
      query = query.offset(offset).limit(filters.pageSize)
    }
    const candidates = await query.toArray()
    return { candidates, total }
  },
  async getCandidate(id: string): Promise<Candidate | undefined> {
    return await db.candidates.get(id)
  },
  async saveAssessment(assessment: Assessment): Promise<Assessment> {
    await db.assessments.put(assessment)
    return assessment
  },
  async getAssessment(jobId: string): Promise<Assessment | undefined> {
    return await db.assessments.where('jobId').equals(jobId).first()
  },
  async saveAssessmentResponse(response: AssessmentResponse): Promise<AssessmentResponse> {
    await db.assessmentResponses.put(response)
    return response
  },
  async getAssessmentResponses(assessmentId: string): Promise<AssessmentResponse[]> {
    return await db.assessmentResponses.where('assessmentId').equals(assessmentId).toArray()
  }
}
