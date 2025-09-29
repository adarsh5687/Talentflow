import type { Assessment } from './database'
interface AssessmentsData {
  assessments: Assessment[]
}
class AssessmentFileAPI {
  private baseDelay = 300
  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.baseDelay + Math.random() * 200))
  }
  private async loadAssessmentsData(): Promise<AssessmentsData> {
    try {
      
      const response = await fetch('/data/assessments.json')
      if (!response.ok) {
        throw new Error(`Failed to load assessments: ${response.statusText}`)
      }
      const fileData = await response.json()
      const backupData = localStorage.getItem('assessments_backup')
      if (backupData) {
        try {
          const parsedBackup = JSON.parse(backupData)
          const newAssessments = parsedBackup.assessments.filter((backupAssessment: any) => 
            !fileData.assessments.some((fileAssessment: any) => fileAssessment.id === backupAssessment.id)
          )
          if (newAssessments.length > 0) {
            fileData.assessments = [...newAssessments, ...fileData.assessments]
          }
        } catch (error) {
          console.error('Failed to parse localStorage backup:', error)
        }
      }
      const assessmentUpdates = localStorage.getItem('assessment_updates')
      if (assessmentUpdates) {
        try {
          const updates = JSON.parse(assessmentUpdates)
          updates.forEach((updatedAssessment: any) => {
            const index = fileData.assessments.findIndex((a: any) => a.id === updatedAssessment.id)
            if (index >= 0) {
              fileData.assessments[index] = updatedAssessment
            }
          })
          if (updates.length > 0) {
          }
        } catch (error) {
          console.error('Failed to parse assessment updates:', error)
        }
      }
      return fileData
    } catch (error) {
      console.error('Failed to load assessments data from file, trying localStorage backup:', error)
      const backupData = localStorage.getItem('assessments_backup')
      if (backupData) {
        try {
          return JSON.parse(backupData)
        } catch (parseError) {
          console.error('Failed to parse localStorage backup:', parseError)
        }
      }
      return { assessments: [] }
    }
  }
  private async saveAssessmentsData(data: AssessmentsData): Promise<void> {
    try {
      localStorage.setItem('assessments_backup', JSON.stringify(data))
      const updatedAssessments = data.assessments.filter(assessment => {
        const updatedAt = new Date(assessment.updatedAt)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        return updatedAt > oneHourAgo
      })
      if (updatedAssessments.length > 0) {
        const existingUpdates = JSON.parse(localStorage.getItem('assessment_updates') || '[]')
        updatedAssessments.forEach(assessment => {
          const existingIndex = existingUpdates.findIndex((u: any) => u.id === assessment.id)
          if (existingIndex >= 0) {
            existingUpdates[existingIndex] = assessment
          } else {
            existingUpdates.push(assessment)
          }
        })
        localStorage.setItem('assessment_updates', JSON.stringify(existingUpdates))
      }
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }
  async getAssessments(params: any = {}) {
    await this.delay()
    const data = await this.loadAssessmentsData()
    let assessments = [...data.assessments]
    
    if (params.jobId) {
      assessments = assessments.filter(assessment => assessment.jobId === params.jobId)
    }
    if (params.isActive !== undefined) {
      assessments = assessments.filter(assessment => assessment.isActive === params.isActive)
    }
    if (params.search) {
      const search = params.search.toLowerCase()
      assessments = assessments.filter(assessment => 
        assessment.title.toLowerCase().includes(search) ||
        (assessment.description && assessment.description.toLowerCase().includes(search))
      )
    }
    if (params.sortBy) {
      assessments.sort((a, b) => {
        const aVal = a[params.sortBy as keyof Assessment] as string
        const bVal = b[params.sortBy as keyof Assessment] as string
        return params.sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
      })
    }
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const paginatedAssessments = assessments.slice(start, start + pageSize)
    const result = {
      assessments: paginatedAssessments,
      total: assessments.length,
      page,
      pageSize,
      totalPages: Math.ceil(assessments.length / pageSize)
    }
    return result
  }
  async getAssessment(id: string): Promise<Assessment | null> {
    await this.delay()
    const data = await this.loadAssessmentsData()
    const assessment = data.assessments.find(a => a.id === id)
    if (!assessment) {
      return null
    }
    return assessment
  }
  async getAssessmentByJobId(jobId: string): Promise<Assessment | null> {
    await this.delay()
    const data = await this.loadAssessmentsData()
    const assessment = data.assessments.find(a => a.jobId === jobId)
    if (!assessment) {
      return null
    }
    return assessment
  }
  async addAssessment(assessmentData: Omit<Assessment, 'id'>): Promise<Assessment> {
    await this.delay()
    const data = await this.loadAssessmentsData()
    const maxId = Math.max(0, ...data.assessments.map(a => parseInt(a.id) || 0))
    const newId = (maxId + 1).toString()
    const newAssessment: Assessment = {
      ...assessmentData,
      id: newId,
      createdAt: assessmentData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: assessmentData.isActive !== undefined ? assessmentData.isActive : true
    }
    data.assessments.unshift(newAssessment)
    await this.saveAssessmentsData(data)
    return newAssessment
  }
  async updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment> {
    await this.delay()
    const data = await this.loadAssessmentsData()
    const assessmentIndex = data.assessments.findIndex(a => a.id === id)
    if (assessmentIndex === -1) {
      console.error('❌ Assessment not found:', id)
      throw new Error(`Assessment with id ${id} not found`)
    }
    const updatedAssessment = {
      ...data.assessments[assessmentIndex],
      ...updates,
      id, 
      updatedAt: new Date().toISOString()
    }
    data.assessments[assessmentIndex] = updatedAssessment
    await this.saveAssessmentsData(data)
    return updatedAssessment
  }
  async deleteAssessment(id: string): Promise<boolean> {
    await this.delay()
    const data = await this.loadAssessmentsData()
    const assessmentIndex = data.assessments.findIndex(a => a.id === id)
    if (assessmentIndex === -1) {
      return false
    }
    const deletedAssessment = data.assessments[assessmentIndex]
    data.assessments.splice(assessmentIndex, 1)
    await this.saveAssessmentsData(data)
    return true
  }
 
  async getAssessmentStats() {
    await this.delay()
    const data = await this.loadAssessmentsData()
    const assessments = data.assessments
    const stats = {
      total: assessments.length,
      active: assessments.filter(a => a.isActive).length,
      inactive: assessments.filter(a => !a.isActive).length,
      byJob: assessments.reduce((acc, assessment) => {
        acc[assessment.jobId] = (acc[assessment.jobId] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      questionsPerAssessment: assessments.map(a => ({
        id: a.id,
        title: a.title,
        questionCount: a.sections?.reduce((count, section) => count + (section.questions?.length || 0), 0) || 0
      }))
    }
    return stats
  }
  async duplicateAssessment(id: string, newJobId?: string): Promise<Assessment> {
    await this.delay()
    const originalAssessment = await this.getAssessment(id)
    if (!originalAssessment) {
      throw new Error(`Assessment with id ${id} not found`)
    }
    const duplicatedAssessment = {
      ...originalAssessment,
      title: `Copy of ${originalAssessment.title}`,
      jobId: newJobId || originalAssessment.jobId,
      isActive: false, 
    }
    const { id: _, ...assessmentWithoutId } = duplicatedAssessment
    return await this.addAssessment(assessmentWithoutId)
  }
  async getAssessmentsByStatus(isActive: boolean) {
    return this.getAssessments({ isActive, pageSize: 100 })
  }
  async getJobsWithAssessments() {
    await this.delay()
    const data = await this.loadAssessmentsData()
    const jobsWithAssessments = data.assessments.reduce((acc, assessment) => {
      if (!acc[assessment.jobId]) {
        acc[assessment.jobId] = []
      }
      acc[assessment.jobId].push(assessment)
      return acc
    }, {} as Record<string, Assessment[]>)
    return {
      jobsWithAssessments,
      totalJobs: Object.keys(jobsWithAssessments).length,
      totalAssessments: data.assessments.length
    }
  }
  clearCache() {
  }
}
export const assessmentFileAPI = new AssessmentFileAPI()
