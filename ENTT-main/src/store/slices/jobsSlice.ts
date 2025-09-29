import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Job } from '../../lib/database'
import { api } from '../../lib/api'
export type { Job } from '../../lib/database'
export interface JobsState {
  jobs: Job[]
  loading: boolean
  error: string | null
  filters: {
    search: string
    status: 'all' | 'active' | 'archived'
    tags: string[]
  }
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  sort: {
    field: 'title' | 'createdAt' | 'order'
    direction: 'asc' | 'desc'
  }
}
const initialState: JobsState = {
  jobs: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    tags: []
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0
  },
  sort: {
    field: 'order',
    direction: 'asc'
  }
}
// Async thunks
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (params: {
    search?: string
    status?: string
    page?: number
    pageSize?: number
    sort?: string
  }) => {
    return await api.getJobs(params)
  }
)
export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData: Omit<Job, 'id'>) => {
    return await api.addJob(jobData)
  }
)
export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ id, ...jobData }: Partial<Job> & { id: string }) => {
    return await api.updateJob(id, jobData)
  }
)
export const reorderJobs = createAsyncThunk(
  'jobs/reorderJobs',
  async ({ jobId, fromOrder, toOrder }: { jobId: string; fromOrder: number; toOrder: number }) => {
    return await api.reorderJobs({ jobId, fromOrder, toOrder })
  }
)
export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId: string) => {
    await api.deleteJob(jobId)
    return jobId
  }
)
const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<JobsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setPagination: (state, action: PayloadAction<Partial<JobsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setSort: (state, action: PayloadAction<JobsState['sort']>) => {
      state.sort = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    // Optimistic update for reordering
    optimisticReorder: (state, action: PayloadAction<{ jobId: string; fromOrder: number; toOrder: number }>) => {
      const { jobId, fromOrder, toOrder } = action.payload
      const job = state.jobs.find(j => j.id === jobId)
      if (job) {
        job.order = toOrder
        // Reorder other jobs accordingly
        state.jobs.forEach(j => {
          if (j.id !== jobId && j.order !== undefined) {
            if (fromOrder < toOrder && j.order > fromOrder && j.order <= toOrder) {
              j.order -= 1
            } else if (fromOrder > toOrder && j.order >= toOrder && j.order < fromOrder) {
              j.order += 1
            }
          }
        })
        state.jobs.sort((a, b) => (a.order || 0) - (b.order || 0))
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch jobs
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false
        state.jobs = action.payload.jobs
        state.pagination.total = action.payload.total
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch jobs'
      })
      // Create job
      .addCase(createJob.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.loading = false
        state.jobs.push(action.payload)
      })
      .addCase(createJob.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create job'
      })
      // Update job
      .addCase(updateJob.fulfilled, (state, action) => {
        const index = state.jobs.findIndex(job => job.id === action.payload.id)
        if (index !== -1) {
          state.jobs[index] = action.payload
        }
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update job'
      })
      // Delete job
      .addCase(deleteJob.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.loading = false
        state.jobs = state.jobs.filter(job => job.id !== action.payload)
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete job'
      })
      // Reorder jobs
      .addCase(reorderJobs.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to reorder job'
        // Rollback optimistic update on error
        // We could implement a more sophisticated rollback mechanism here
      })
  }
})
export const { setFilters, setPagination, setSort, clearError, optimisticReorder } = jobsSlice.actions
export default jobsSlice.reducer
