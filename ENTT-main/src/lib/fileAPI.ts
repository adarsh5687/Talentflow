import type { Job } from './database'
interface JobsData {
  jobs: Job[]
}
class FileBasedAPI {
  private baseDelay = 300
  private jobsData: JobsData | null = null
  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.baseDelay + Math.random() * 200))
  }
  private async loadJobsData(): Promise<JobsData> {
    if (this.jobsData) {
      return this.jobsData
    }
    try {
      const response = await fetch('/data/jobs.json')
      if (!response.ok) {
        throw new Error(`Failed to load jobs: ${response.statusText}`)
      }
      this.jobsData = await response.json()
      return this.jobsData!
    } catch (error) {
      console.error('Failed to load jobs data:', error)
      return { jobs: [] }
    }
  }
  private async saveJobsData(data: JobsData): Promise<void> {
    this.jobsData = data
  }
  async getJobs(params: any = {}) {
    await this.delay()
    const data = await this.loadJobsData()
    let jobs = [...data.jobs]
    if (params.search) {
      const search = params.search.toLowerCase()
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(search) ||
        (job.description?.toLowerCase().includes(search) || false) ||
        (job.company?.toLowerCase().includes(search) || false) ||
        (job.location?.toLowerCase().includes(search) || false)
      )
    }
    if (params.location) {
      jobs = jobs.filter(job => 
        job.location?.toLowerCase().includes(params.location.toLowerCase()) || false
      )
    }
    if (params.type) {
      jobs = jobs.filter(job => 
        job.type?.toLowerCase() === params.type.toLowerCase()
      )
    }
    if (params.status) {
      jobs = jobs.filter(job => job.status === params.status)
    }
    if (params.sortBy) {
      jobs.sort((a, b) => {
        const aVal = a[params.sortBy as keyof Job] as string
        const bVal = b[params.sortBy as keyof Job] as string
        return params.sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
      })
    }
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const paginatedJobs = jobs.slice(start, start + pageSize)
    const result = {
      jobs: paginatedJobs,
      total: jobs.length,
      page,
      pageSize,
      totalPages: Math.ceil(jobs.length / pageSize)
    }
    return result
  }
  async getJob(id: string): Promise<Job | null> {
    await this.delay()
    const data = await this.loadJobsData()
    const job = data.jobs.find(j => j.id === id)
    if (!job) {
      return null
    }
    return job
  }
  async addJob(jobData: Omit<Job, 'id'>) {
    await this.delay()
    const data = await this.loadJobsData()
    const maxId = Math.max(0, ...data.jobs.map(j => parseInt(j.id) || 0))
    const newId = (maxId + 1).toString()
    const newJob: Job = {
      ...jobData,
      id: newId,
      status: jobData.status || 'active'
    }
    data.jobs.unshift(newJob)
    await this.saveJobsData(data)
    return newJob
  }
  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    await this.delay()
    const data = await this.loadJobsData()
    const jobIndex = data.jobs.findIndex(j => j.id === id)
    if (jobIndex === -1) {
      throw new Error(`Job with id ${id} not found`)
    }
    const updatedJob = {
      ...data.jobs[jobIndex],
      ...updates,
      id, 
    }
    data.jobs[jobIndex] = updatedJob
    await this.saveJobsData(data)
    return updatedJob
  }
  async deleteJob(id: string): Promise<boolean> {
    await this.delay()
    const data = await this.loadJobsData()
    const jobIndex = data.jobs.findIndex(j => j.id === id)
    if (jobIndex === -1) {
      return false
    }
    const deletedJob = data.jobs[jobIndex]
    data.jobs.splice(jobIndex, 1)
    await this.saveJobsData(data)
    return true
  }
  async getJobStats() {
    await this.delay()
    const data = await this.loadJobsData()
    const jobs = data.jobs
    const stats = {
      total: jobs.length,
      active: jobs.filter(j => j.status === 'active').length,
      archived: jobs.filter(j => j.status === 'archived').length,
      byType: jobs.reduce((acc, job) => {
        if (job.type) {
          acc[job.type] = (acc[job.type] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      byLocation: jobs.reduce((acc, job) => {
        if (job.location) {
          acc[job.location] = (acc[job.location] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      byCompany: jobs.reduce((acc, job) => {
        if (job.company) {
          acc[job.company] = (acc[job.company] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
    }
    return stats
  }
  async searchJobs(query: string) {
    return this.getJobs({ search: query, pageSize: 100 })
  }
  async getJobsByCompany(company: string) {
    await this.delay()
    const data = await this.loadJobsData()
    const jobs = data.jobs.filter(job => 
      job.company?.toLowerCase().includes(company.toLowerCase()) || false
    )
    return {
      jobs,
      total: jobs.length,
      company
    }
  }
  async getJobsByLocation(location: string) {
    await this.delay()
    const data = await this.loadJobsData()
    const jobs = data.jobs.filter(job => 
      job.location && job.location.toLowerCase().includes(location.toLowerCase())
    )
    return {
      jobs,
      total: jobs.length,
      location
    }
  }
  async updateMultipleJobs(updates: { id: string; updates: Partial<Job> }[]) {
    await this.delay()
    const data = await this.loadJobsData()
    const updatedJobs: Job[] = []
    for (const { id, updates: jobUpdates } of updates) {
      const jobIndex = data.jobs.findIndex(j => j.id === id)
      if (jobIndex !== -1) {
        data.jobs[jobIndex] = {
          ...data.jobs[jobIndex],
          ...jobUpdates,
          id 
        }
        updatedJobs.push(data.jobs[jobIndex])
      }
    }
    await this.saveJobsData(data)
    return updatedJobs
  }
  async deleteMultipleJobs(ids: string[]) {
    await this.delay()
    const data = await this.loadJobsData()
    const deletedJobs: Job[] = []
    data.jobs = data.jobs.filter(job => {
      if (ids.includes(job.id)) {
        deletedJobs.push(job)
        return false
      }
      return true
    })
    await this.saveJobsData(data)
    return deletedJobs
  }
}
export const fileAPI = new FileBasedAPI()
