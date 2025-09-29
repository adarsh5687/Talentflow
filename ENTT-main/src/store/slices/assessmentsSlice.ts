import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { saveToLocalStorage, getFromLocalStorage } from '../../lib/utils.ts'
import { assessmentFileAPI } from '../../lib/assessmentFileAPI'
import type { Assessment, AssessmentSection, Question, QuestionOption, AssessmentResponse } from '../../lib/database'
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
// Async thunks using file API
export const fetchAssessment = createAsyncThunk(
  'assessments/fetchAssessment',
  async (jobId: string) => {
    try {
      return await assessmentFileAPI.getAssessmentByJobId(jobId)
    } catch (error) {
      throw new Error('Failed to fetch assessment')
    }
  }
)
export const fetchAssessments = createAsyncThunk(
  'assessments/fetchAssessments',
  async (params: any = {}) => {
    try {
      const result = await assessmentFileAPI.getAssessments(params)
      return result.assessments
    } catch (error) {
      throw new Error('Failed to fetch assessments')
    }
  }
)
export const saveAssessment = createAsyncThunk(
  'assessments/saveAssessment',
  async (assessment: Assessment) => {
    try {
      let result
      if (assessment.id && assessment.id !== 'new') {
        // Update existing assessment
        result = await assessmentFileAPI.updateAssessment(assessment.id, assessment)
      } else {
        // Create new assessment
        const { id, ...assessmentData } = assessment
        result = await assessmentFileAPI.addAssessment(assessmentData)
      }
      return result
    } catch (error) {
      console.error('Failed to save assessment:', error)
      throw new Error('Failed to save assessment')
    }
  }
)
export const deleteAssessment = createAsyncThunk(
  'assessments/deleteAssessment',
  async (assessmentId: string) => {
    try {
      await assessmentFileAPI.deleteAssessment(assessmentId)
      return assessmentId
    } catch (error) {
      throw new Error('Failed to delete assessment')
    }
  }
)
export const submitAssessmentResponse = createAsyncThunk(
  'assessments/submitAssessmentResponse',
  async ({ assessmentId, candidateId, responses }: {
    assessmentId: string
    candidateId: string
    responses: Record<string, any>
  }) => {
    try {
      const newResponse: AssessmentResponse = {
        id: `response-${assessmentId}-${candidateId}-${Date.now()}`,
        assessmentId,
        candidateId,
        responses,
        submittedAt: new Date().toISOString(),
        score: calculateResponseScore(responses)
      }
      const allResponses: AssessmentResponse[] = getFromLocalStorage('assessment_responses', [])
      allResponses.push(newResponse)
      saveToLocalStorage('assessment_responses', allResponses)
      return newResponse
    } catch (error) {
      throw new Error('Failed to submit assessment response')
    }
  }
)
export const fetchAssessmentResponses = createAsyncThunk(
  'assessments/fetchAssessmentResponses',
  async (assessmentId?: string) => {
    try {
      const allResponses = getFromLocalStorage('assessment_responses', [])
      return assessmentId 
        ? allResponses.filter((r: AssessmentResponse) => r.assessmentId === assessmentId)
        : allResponses
    } catch (error) {
      throw new Error('Failed to fetch assessment responses')
    }
  }
)
// Helper function to calculate basic score
const calculateResponseScore = (responses: Record<string, any>): number => {
  const answeredCount = Object.values(responses).filter(value => 
    value !== null && value !== undefined && value.toString().trim() !== ''
  ).length
  const totalCount = Object.keys(responses).length
  return totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0
}
const assessmentsSlice = createSlice({
  name: 'assessments',
  initialState,
  reducers: {
    setCurrentAssessment: (state, action: PayloadAction<Assessment | null>) => {
      state.currentAssessment = action.payload
    },
    updateCurrentAssessment: (state, action: PayloadAction<Partial<Assessment>>) => {
      if (state.currentAssessment) {
        state.currentAssessment = { ...state.currentAssessment, ...action.payload }
      }
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
          section => section.id !== action.payload
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
    updateQuestion: (state, action: PayloadAction<{ 
      sectionId: string; 
      questionId: string; 
      updates: Partial<Question> 
    }>) => {
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
    addQuestionOption: (state, action: PayloadAction<{ 
      sectionId: string; 
      questionId: string; 
      option: Omit<QuestionOption, 'id'> 
    }>) => {
      if (state.currentAssessment) {
        const section = state.currentAssessment.sections.find(s => s.id === action.payload.sectionId)
        if (section) {
          const question = section.questions.find(q => q.id === action.payload.questionId)
          if (question) {
            if (!question.options) question.options = []
            const newOption: QuestionOption = {
              ...action.payload.option,
              id: `option-${Date.now()}`
            }
            question.options.push(newOption)
          }
        }
      }
    },
    updateQuestionOption: (state, action: PayloadAction<{ 
      sectionId: string; 
      questionId: string; 
      optionId: string; 
      updates: Partial<QuestionOption> 
    }>) => {
      if (state.currentAssessment) {
        const section = state.currentAssessment.sections.find(s => s.id === action.payload.sectionId)
        if (section) {
          const question = section.questions.find(q => q.id === action.payload.questionId)
          if (question && question.options) {
            const option = question.options.find(o => o.id === action.payload.optionId)
            if (option) {
              Object.assign(option, action.payload.updates)
            }
          }
        }
      }
    },
    deleteQuestionOption: (state, action: PayloadAction<{ 
      sectionId: string; 
      questionId: string; 
      optionId: string 
    }>) => {
      if (state.currentAssessment) {
        const section = state.currentAssessment.sections.find(s => s.id === action.payload.sectionId)
        if (section) {
          const question = section.questions.find(q => q.id === action.payload.questionId)
          if (question && question.options) {
            question.options = question.options.filter(o => o.id !== action.payload.optionId)
          }
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
      // Fetch assessments
      .addCase(fetchAssessments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAssessments.fulfilled, (state, action) => {
        state.loading = false
        state.assessments = action.payload
      })
      .addCase(fetchAssessments.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch assessments'
      })
      // Save assessment
      .addCase(saveAssessment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(saveAssessment.fulfilled, (state, action) => {
        state.loading = false
        state.currentAssessment = action.payload
        // Update assessments list
        const existingIndex = state.assessments.findIndex(a => a.id === action.payload.id)
        if (existingIndex >= 0) {
          state.assessments[existingIndex] = action.payload
        } else {
          state.assessments.push(action.payload)
        }
      })
      .addCase(saveAssessment.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to save assessment'
      })
      // Delete assessment
      .addCase(deleteAssessment.fulfilled, (state, action) => {
        state.assessments = state.assessments.filter(a => a.id !== action.payload)
        if (state.currentAssessment?.id === action.payload) {
          state.currentAssessment = null
        }
      })
      // Submit response
      .addCase(submitAssessmentResponse.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitAssessmentResponse.fulfilled, (state, action) => {
        state.loading = false
        state.assessmentResponses.push(action.payload)
      })
      .addCase(submitAssessmentResponse.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to submit response'
      })
      // Fetch responses
      .addCase(fetchAssessmentResponses.fulfilled, (state, action) => {
        state.assessmentResponses = action.payload
      })
  }
})
export const {
  setCurrentAssessment,
  updateCurrentAssessment,
  setBuilderMode,
  addSection,
  updateSection,
  deleteSection,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  addQuestionOption,
  updateQuestionOption,
  deleteQuestionOption,
  clearError
} = assessmentsSlice.actions
export default assessmentsSlice.reducer
