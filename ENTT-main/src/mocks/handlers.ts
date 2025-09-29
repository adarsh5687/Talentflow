import { http, HttpResponse } from 'msw'
import { persistenceHelpers } from '../lib/database'
const withLatencyAndErrors = async <T>(
  operation: () => Promise<T>,
  errorRate = 0.05
): Promise<T> => {
  const latency = Math.random() * 1000 + 200
  await new Promise(resolve => setTimeout(resolve, latency))
  if (Math.random() < errorRate) {
    throw new Error('Simulated network error')
  }
  return operation()
}
export const handlers = [
  http.get('/api/jobs', async ({ request }) => {
    try {
      const url = new URL(request.url)
      const search = url.searchParams.get('search') || ''
      const status = url.searchParams.get('status') || 'all'
      const page = parseInt(url.searchParams.get('page') || '1')
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
      const sort = url.searchParams.get('sort') || 'createdAt:desc'
      const result = await withLatencyAndErrors(() =>
        persistenceHelpers.getJobs({ search, status, page, pageSize, sort })
      )
      return HttpResponse.json(result as any)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      return new HttpResponse(null, { status: 500 })
    }
  }),
  http.post('/api/jobs', async ({ request }) => {
    try {
      const jobData = await request.json() as any
      const { jobs } = await persistenceHelpers.getJobs()
      const maxOrder = Math.max(...jobs.map((j: any) => j.order || 0), 0)
      const newJob = {
        ...jobData,
        id: `job-${Date.now()}`,
        slug: jobData.slug || jobData.title.toLowerCase().replace(/\s+/g, '-'),
        order: jobData.order ?? maxOrder + 1,
        tags: jobData.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      const job = await withLatencyAndErrors(() =>
        persistenceHelpers.saveJob(newJob)
      )
      return HttpResponse.json(job as any, { status: 201 })
    } catch (error) {
      return new HttpResponse(null, { status: 500 })
    }
  }),
  http.patch('/api/jobs/:id', async ({ request, params }) => {
    try {
      const { id } = params
      const updates = await request.json() as any
      const { jobs } = await persistenceHelpers.getJobs()
      const existingJob = jobs.find((j: any) => j.id === id)
      if (!existingJob) {
        return new HttpResponse(null, { status: 404 })
      }
      const updatedJob = {
        ...existingJob,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      const job = await withLatencyAndErrors(() =>
        persistenceHelpers.saveJob(updatedJob)
      )
      return HttpResponse.json(job as any)
    } catch (error) {
      return new HttpResponse(null, { status: 500 })
    }
  }),
  http.patch('/api/jobs/:id/reorder', async ({ request, params }) => {
    try {
      const { id } = params
      const { fromOrder, toOrder } = await request.json() as any
      const result = await withLatencyAndErrors(async () => {
        const { jobs } = await persistenceHelpers.getJobs()
        const job = jobs.find((j: any) => j.id === id)
        if (!job) throw new Error('Job not found')
        job.order = toOrder
        await persistenceHelpers.saveJob(job)
        const otherJobs = jobs.filter((j: any) => j.id !== id)
        for (const otherJob of otherJobs) {
          const currentOrder = otherJob.order || 0
          if (fromOrder < toOrder && currentOrder > fromOrder && currentOrder <= toOrder) {
            otherJob.order = currentOrder - 1
            await persistenceHelpers.saveJob(otherJob)
          } else if (fromOrder > toOrder && currentOrder >= toOrder && currentOrder < fromOrder) {
            otherJob.order = currentOrder + 1
            await persistenceHelpers.saveJob(otherJob)
          }
        }
        return job
      }, 0.1) 
      return HttpResponse.json(result as any)
    } catch (error) {
      return new HttpResponse(null, { status: 500 })
    }
  }),
  http.get('/api/candidates', async ({ request }) => {
    try {
      const url = new URL(request.url)
      const search = url.searchParams.get('search') || ''
      const stage = url.searchParams.get('stage') || ''
      const jobId = url.searchParams.get('jobId') || ''
      const page = parseInt(url.searchParams.get('page') || '1')
      const pageSize = parseInt(url.searchParams.get('pageSize') || '50')
      const result = await withLatencyAndErrors(() =>
        persistenceHelpers.getCandidates({ search, stage, jobId, page, pageSize })
      )
      return HttpResponse.json(result as any)
    } catch (error) {
      return new HttpResponse(null, { status: 500 })
    }
  }),
  http.post('/api/candidates', async ({ request }) => {
    try {
      const candidateData = await request.json() as any
      const newCandidate = {
        ...candidateData,
        id: `candidate-${Date.now()}`,
        appliedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: [],
        timeline: [{
          id: `timeline-${Date.now()}`,
          type: 'stage_change',
          description: `Application submitted with stage: ${candidateData.stage}`,
          timestamp: new Date().toISOString(),
          data: { toStage: candidateData.stage }
        }]
      }
      const candidate = await withLatencyAndErrors(() =>
        persistenceHelpers.saveCandidate(newCandidate)
      )
      return HttpResponse.json(candidate as any, { status: 201 })
    } catch (error) {
      return new HttpResponse(null, { status: 500 })
    }
  }),
  http.patch('/api/candidates/:id', async ({ request, params }) => {
    try {
      const { id } = params
      const updates = await request.json() as any
      const existingCandidate = await persistenceHelpers.getCandidate(id as string)
      if (!existingCandidate) {
        return new HttpResponse(null, { status: 404 })
      }
      const updatedCandidate = {
        ...existingCandidate,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      if (updates.stage && updates.stage !== existingCandidate.stage) {
        updatedCandidate.timeline.push({
          id: `timeline-${Date.now()}`,
          type: 'stage_change',
          description: `Stage changed from ${existingCandidate.stage} to ${updates.stage}`,
          timestamp: new Date().toISOString(),
          data: { fromStage: existingCandidate.stage, toStage: updates.stage }
        })
      }
      const candidate = await withLatencyAndErrors(() =>
        persistenceHelpers.saveCandidate(updatedCandidate)
      )
      return HttpResponse.json(candidate as any)
    } catch (error) {
      return new HttpResponse(null, { status: 500 })
    }
  }),
  http.get('/api/candidates/:id/timeline', async ({ params }) => {
    try {
      const { id } = params
      const candidate = await persistenceHelpers.getCandidate(id as string)
      if (!candidate) {
        return new HttpResponse(null, { status: 404 })
      }
      return HttpResponse.json({ timeline: candidate.timeline })
    } catch (error) {
      return new HttpResponse(null, { status: 500 })
    }
  }),
  http.get('/api/assessments/:jobId', async ({ params }) => {
    try {
      const { jobId } = params
      const assessment = await withLatencyAndErrors(() =>
        persistenceHelpers.getAssessment(jobId as string)
      )
      if (!assessment) {
        return new HttpResponse(null, { status: 404 })
      }
      return HttpResponse.json(assessment as any)
    } catch (error) {
      return new HttpResponse(null, { status: 500 })
    }
  }),
  http.put('/api/assessments/:jobId', async ({ request, params }) => {
    try {
      const { jobId } = params
      const assessmentData = await request.json() as any
      const assessment = {
        ...assessmentData,
        jobId: jobId as string,
        updatedAt: new Date().toISOString()
      }
      const result = await withLatencyAndErrors(() =>
        persistenceHelpers.saveAssessment(assessment)
      )
      return HttpResponse.json(result as any)
    } catch (error) {
      return new HttpResponse(null, { status: 500 })
    }
  }),
  http.post('/api/assessments/:assessmentId/submit', async ({ request, params }) => {
    try {
      const { assessmentId } = params
      const { candidateId, responses } = await request.json() as any
      const response = {
        id: `response-${Date.now()}`,
        assessmentId: assessmentId as string,
        candidateId,
        responses,
        submittedAt: new Date().toISOString()
      }
      const result = await withLatencyAndErrors(() =>
        persistenceHelpers.saveAssessmentResponse(response)
      )
      return HttpResponse.json(result as any)
    } catch (error) {
      return new HttpResponse(null, { status: 500 })
    }
  })
]
