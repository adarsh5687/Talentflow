import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Assessment, AssessmentSection, Question, AssessmentResponse } from '../../lib/database'
export type { Assessment, AssessmentSection, Question, QuestionOption, AssessmentResponse } from '../../lib/database'
export interface AssessmentsState {
  assessments: Assessment[]
  currentAssessment: Assessment | null
  assessmentResponses: AssessmentResponse[]
  loading: boolean
  error: string | null
  builder: {
    isEditing: boolean
    previewMode: boolean
    currentSection: string | null
  }
}
const initialState: AssessmentsState = {
  assessments: [],
  currentAssessment: null,
  assessmentResponses: [],
  loading: false,
  error: null,
  builder: {
    isEditing: false,
    previewMode: false,
    currentSection: null
  }
}
// Async thunks
export const fetchAssessment = createAsyncThunk(
  'assessments/fetchAssessment',
  async (jobId: string) => {
    const response = await fetch(`/api/assessments/${jobId}`)
    if (!response.ok) throw new Error('Failed to fetch assessment')
    return response.json()
  }
)
export const saveAssessment = createAsyncThunk(
  'assessments/saveAssessment',
  async (assessment: Assessment) => {
    const response = await fetch(`/api/assessments/${assessment.jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessment)
    })
    if (!response.ok) throw new Error('Failed to save assessment')
    return response.json()
  }
)
export const submitAssessmentResponse = createAsyncThunk(
  'assessments/submitAssessmentResponse',
  async ({ assessmentId, candidateId, responses }: {
    assessmentId: string
    candidateId: string
    responses: Record<string, any>
  }) => {
    const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, responses })
    })
    if (!response.ok) throw new Error('Failed to submit assessment')
    return response.json()
  }
)
const assessmentsSlice = createSlice({
  name: 'assessments',
  initialState,
  reducers: {
    setCurrentAssessment: (state, action: PayloadAction<Assessment | null>) => {
      state.currentAssessment = action.payload
    },
    setBuilderMode: (state, action: PayloadAction<Partial<AssessmentsState['builder']>>) => {
      state.builder = { ...state.builder, ...action.payload }
    },
    addSection: (state, action: PayloadAction<{ title: string; description?: string }>) => {
      if (state.currentAssessment) {
        const newSection: AssessmentSection = {
          id: `section-${Date.now()}`,
          title: action.payload.title,
          description: action.payload.description,
          questions: [],
          order: state.currentAssessment.sections.length
        }
        state.currentAssessment.sections.push(newSection)
      }
    },
    updateSection: (state, action: PayloadAction<{ sectionId: string; updates: Partial<AssessmentSection> }>) => {
      if (state.currentAssessment) {
        const section = state.currentAssessment.sections.find(s => s.id === action.payload.sectionId)
        if (section) {
          Object.assign(section, action.payload.updates)
        }
      }
    },
    deleteSection: (state, action: PayloadAction<string>) => {
      if (state.currentAssessment) {
        state.currentAssessment.sections = state.currentAssessment.sections.filter(
          s => s.id !== action.payload
        )
      }
    },
    addQuestion: (state, action: PayloadAction<{ sectionId: string; question: Omit<Question, 'id'> }>) => {
      if (state.currentAssessment) {
        const section = state.currentAssessment.sections.find(s => s.id === action.payload.sectionId)
        if (section) {
          const newQuestion: Question = {
            ...action.payload.question,
            id: `question-${Date.now()}`
          }
          section.questions.push(newQuestion)
        }
      }
    },
    updateQuestion: (state, action: PayloadAction<{ sectionId: string; questionId: string; updates: Partial<Question> }>) => {
      if (state.currentAssessment) {
        const section = state.currentAssessment.sections.find(s => s.id === action.payload.sectionId)
        if (section) {
          const question = section.questions.find(q => q.id === action.payload.questionId)
          if (question) {
            Object.assign(question, action.payload.updates)
          }
        }
      }
    },
    deleteQuestion: (state, action: PayloadAction<{ sectionId: string; questionId: string }>) => {
      if (state.currentAssessment) {
        const section = state.currentAssessment.sections.find(s => s.id === action.payload.sectionId)
        if (section) {
          section.questions = section.questions.filter(q => q.id !== action.payload.questionId)
        }
      }
    },
    reorderSections: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      if (state.currentAssessment) {
        const { fromIndex, toIndex } = action.payload
        const sections = [...state.currentAssessment.sections]
        const [removed] = sections.splice(fromIndex, 1)
        sections.splice(toIndex, 0, removed)
        // Update order values
        sections.forEach((section, index) => {
          section.order = index
        })
        state.currentAssessment.sections = sections
      }
    },
    reorderQuestions: (state, action: PayloadAction<{ 
      sectionId: string; 
      fromIndex: number; 
      toIndex: number 
    }>) => {
      if (state.currentAssessment) {
        const section = state.currentAssessment.sections.find(s => s.id === action.payload.sectionId)
        if (section) {
          const { fromIndex, toIndex } = action.payload
          const questions = [...section.questions]
          const [removed] = questions.splice(fromIndex, 1)
          questions.splice(toIndex, 0, removed)
          section.questions = questions
        }
      }
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch assessment
      .addCase(fetchAssessment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAssessment.fulfilled, (state, action) => {
        state.loading = false
        state.currentAssessment = action.payload
      })
      .addCase(fetchAssessment.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch assessment'
      })
      // Save assessment
      .addCase(saveAssessment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(saveAssessment.fulfilled, (state, action) => {
        state.loading = false
        state.currentAssessment = action.payload
        // Update in assessments list
        const index = state.assessments.findIndex(a => a.id === action.payload.id)
        if (index !== -1) {
          state.assessments[index] = action.payload
        } else {
          state.assessments.push(action.payload)
        }
      })
      .addCase(saveAssessment.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to save assessment'
      })
      // Submit assessment response
      .addCase(submitAssessmentResponse.fulfilled, (state, action) => {
        state.assessmentResponses.push(action.payload)
      })
      .addCase(submitAssessmentResponse.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to submit assessment'
      })
  }
})
export const {
  setCurrentAssessment,
  setBuilderMode,
  addSection,
  updateSection,
  deleteSection,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderSections,
  reorderQuestions,
  clearError
} = assessmentsSlice.actions
export default assessmentsSlice.reducer
