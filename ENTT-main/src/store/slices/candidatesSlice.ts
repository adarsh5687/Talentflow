import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Candidate, CandidateNote } from '../../lib/database'
export type { Candidate, CandidateNote, CandidateTimelineEvent } from '../../lib/database'
export interface CandidatesState {
  candidates: Candidate[]
  selectedCandidate: Candidate | null
  loading: boolean
  error: string | null
  filters: {
    search: string
    stage: string
    jobId: string
  }
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  kanbanView: {
    stages: Array<{
      id: string
      name: string
      candidates: string[]
    }>
  }
}
const initialState: CandidatesState = {
  candidates: [],
  selectedCandidate: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    stage: '',
    jobId: ''
  },
  pagination: {
    page: 1,
    pageSize: 50,
    total: 0
  },
  kanbanView: {
    stages: [
      { id: 'applied', name: 'Applied', candidates: [] },
      { id: 'screening', name: 'Screening', candidates: [] },
      { id: 'technical', name: 'Technical', candidates: [] },
      { id: 'final', name: 'Final Interview', candidates: [] },
      { id: 'offer', name: 'Offer', candidates: [] },
      { id: 'hired', name: 'Hired', candidates: [] },
      { id: 'rejected', name: 'Rejected', candidates: [] }
    ]
  }
}
// Async thunks
export const fetchCandidates = createAsyncThunk(
  'candidates/fetchCandidates',
  async (params: {
    search?: string
    stage?: string
    jobId?: string
    page?: number
    pageSize?: number
  } = {}) => {
    const { api } = await import('../../lib/api')
    return await api.getCandidates(params)
  }
)
export const fetchCandidateTimeline = createAsyncThunk(
  'candidates/fetchCandidateTimeline',
  async (candidateId: string) => {
    const response = await fetch(`/api/candidates/${candidateId}/timeline`)
    if (!response.ok) throw new Error('Failed to fetch candidate timeline')
    return response.json()
  }
)
export const fetchCandidate = createAsyncThunk(
  'candidates/fetchCandidate',
  async (candidateId: string) => {
    const { api } = await import('../../lib/api')
    return await api.getCandidate(candidateId)
  }
)
export const updateCandidateStage = createAsyncThunk(
  'candidates/updateCandidateStage',
  async ({ candidateId, stage, note }: { candidateId: string; stage: string; note?: string }) => {
    const { api } = await import('../../lib/api')
    return await api.updateCandidateStage(candidateId, stage, note)
  }
)
export const addCandidateNote = createAsyncThunk(
  'candidates/addCandidateNote',
  async ({ candidateId, note }: { candidateId: string; note: CandidateNote }) => {
    const { api } = await import('../../lib/api')
    return await api.addCandidateNote(candidateId, note)
  }
)
const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<CandidatesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setPagination: (state, action: PayloadAction<Partial<CandidatesState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setSelectedCandidate: (state, action: PayloadAction<Candidate | null>) => {
      state.selectedCandidate = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    // Optimistic update for stage changes
    optimisticStageUpdate: (state, action: PayloadAction<{ candidateId: string; stage: string }>) => {
      const { candidateId, stage } = action.payload
      const candidate = state.candidates.find(c => c.id === candidateId)
      if (candidate) {
        candidate.stage = stage as Candidate['stage']
        candidate.updatedAt = new Date().toISOString()
      }
      // Update kanban view
      state.kanbanView.stages.forEach(stageObj => {
        stageObj.candidates = stageObj.candidates.filter(id => id !== candidateId)
      })
      const targetStage = state.kanbanView.stages.find(s => s.id === stage)
      if (targetStage) {
        targetStage.candidates.push(candidateId)
      }
    },
    updateKanbanStages: (state, action: PayloadAction<CandidatesState['kanbanView']['stages']>) => {
      state.kanbanView.stages = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch candidates
      .addCase(fetchCandidates.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.loading = false
        state.candidates = action.payload.candidates
        state.pagination.total = action.payload.total
        // Update kanban view
        state.kanbanView.stages.forEach(stage => {
          stage.candidates = action.payload.candidates
            .filter((c: Candidate) => c.stage === stage.id)
            .map((c: Candidate) => c.id)
        })
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch candidates'
      })
      // Update candidate stage
      .addCase(updateCandidateStage.fulfilled, (state, action) => {
        const candidate = state.candidates.find(c => c.id === action.payload.id)
        if (candidate) {
          Object.assign(candidate, action.payload)
        }
        if (state.selectedCandidate?.id === action.payload.id) {
          state.selectedCandidate = action.payload
        }
      })
      .addCase(updateCandidateStage.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update candidate stage'
      })
      // Add candidate note
      .addCase(addCandidateNote.fulfilled, (state, action) => {
        // action.payload is the updated candidate
        const candidate = state.candidates.find(c => c.id === action.payload.id)
        if (candidate) {
          Object.assign(candidate, action.payload)
        }
        if (state.selectedCandidate?.id === action.payload.id) {
          state.selectedCandidate = action.payload
        }
      })
      // Fetch candidate
      .addCase(fetchCandidate.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCandidate.fulfilled, (state, action) => {
        state.loading = false
        state.selectedCandidate = action.payload || null
      })
      .addCase(fetchCandidate.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch candidate'
      })
      // Fetch candidate timeline
      .addCase(fetchCandidateTimeline.fulfilled, (state, action) => {
        if (state.selectedCandidate) {
          state.selectedCandidate.timeline = action.payload.timeline
        }
      })
  }
})
export const { 
  setFilters, 
  setPagination, 
  setSelectedCandidate, 
  clearError, 
  optimisticStageUpdate,
  updateKanbanStages
} = candidatesSlice.actions
export default candidatesSlice.reducer
