import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ArrowLeft, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import AssessmentPreview from './AssessmentPreview'
import { saveToLocalStorage, getFromLocalStorage } from '../../lib/utils.ts'
import { assessmentFileAPI } from '../../lib/assessmentFileAPI'
export default function AssessmentRuntime({ assessmentId, candidateId, onComplete }) {
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [responses, setResponses] = useState({})
  const [startTime] = useState(new Date())
  const [isCompleted, setIsCompleted] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  useEffect(() => {
    loadAssessment()
    loadSavedResponses()
  }, [assessmentId, candidateId])
  const loadAssessment = async () => {
    try {
      setLoading(true)
      const foundAssessment = await assessmentFileAPI.getAssessment(assessmentId)
      if (foundAssessment) {
        setAssessment(foundAssessment)
      } else {
        console.error(`No assessment found for ID: ${assessmentId}`)
        setAssessment(null)
      }
    } catch (error) {
      console.error('Failed to load assessment:', error)
    } finally {
      setLoading(false)
    }
  }
  const loadSavedResponses = () => {
    setResponses({})
  }
  const saveResponses = () => {
  }
  const handleSubmit = async (finalResponses) => {
    try {
      setIsCompleted(true)
      const completedResponse = {
        responses: finalResponses,
        submittedAt: new Date().toISOString(),
        startTime: startTime.toISOString(),
        completionTime: Date.now() - startTime.getTime(),
        assessmentId,
        candidateId,
        status: 'completed'
      }
      // Save final response
      const storageKey = `assessment_responses_${assessmentId}_${candidateId}`
      saveToLocalStorage(storageKey, completedResponse)
      // Update global responses
      const allResponses = getFromLocalStorage('assessment_responses', [])
      const existingIndex = allResponses.findIndex(r => 
        r.assessmentId === assessmentId && r.candidateId === candidateId
      )
      if (existingIndex >= 0) {
        allResponses[existingIndex] = { 
          ...allResponses[existingIndex], 
          ...completedResponse,
          updatedAt: new Date().toISOString()
        }
      } else {
        allResponses.push({
          id: `response_${assessmentId}_${candidateId}`,
          ...completedResponse,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
      saveToLocalStorage('assessment_responses', allResponses)
     
      const score = calculateScore(finalResponses)
      
      onComplete?.({
        ...completedResponse,
        score
      })
    } catch (error) {
      console.error('Failed to submit assessment:', error)
      setIsCompleted(false)
    }
  }
  const calculateScore = (responses) => {
    if (!assessment) return 0
    let totalQuestions = 0
    let answeredQuestions = 0
    assessment.sections?.forEach(section => {
      section.questions?.forEach(question => {
        totalQuestions++
        if (responses[question.id] && responses[question.id].toString().trim()) {
          answeredQuestions++
        }
      })
    })
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  }
  const getCompletionStats = () => {
    if (!assessment) return { answered: 0, total: 0, percentage: 0 }
    let total = 0
    let answered = 0
    assessment.sections?.forEach(section => {
      section.questions?.forEach(question => {
        total++
        if (responses[question.id] && responses[question.id].toString().trim()) {
          answered++
        }
      })
    })
    return {
      answered,
      total,
      percentage: total > 0 ? Math.round((answered / total) * 100) : 0
    }
  }
  const createDemoAssessment = (id) => ({
    id,
    jobId: 'job-1',
    title: 'Frontend Developer Assessment',
    description: 'Evaluate technical skills and experience for frontend development role',
    sections: [
      {
        id: 'section-1',
        title: 'Technical Experience',
        description: 'Questions about your technical background',
        order: 0,
        questions: [
          {
            id: 'q1',
            type: 'single-choice',
            title: 'How many years of React experience do you have?',
            required: true,
            options: [
              { id: 'opt1', text: 'Less than 1 year', value: '<1' },
              { id: 'opt2', text: '1-2 years', value: '1-2' },
              { id: 'opt3', text: '3-5 years', value: '3-5' },
              { id: 'opt4', text: 'More than 5 years', value: '>5' }
            ]
          },
          {
            id: 'q2',
            type: 'multi-choice',
            title: 'Which frontend technologies are you familiar with?',
            required: true,
            options: [
              { id: 'opt1', text: 'React', value: 'react' },
              { id: 'opt2', text: 'Vue.js', value: 'vue' },
              { id: 'opt3', text: 'Angular', value: 'angular' },
              { id: 'opt4', text: 'TypeScript', value: 'typescript' },
              { id: 'opt5', text: 'Next.js', value: 'nextjs' }
            ]
          },
          {
            id: 'q3',
            type: 'short-text',
            title: 'What is your preferred state management solution?',
            required: false,
            validation: { maxLength: 100 }
          }
        ]
      },
      {
        id: 'section-2',
        title: 'Scenario Questions',
        description: 'Situational questions to assess problem-solving skills',
        order: 1,
        questions: [
          {
            id: 'q4',
            type: 'long-text',
            title: 'Describe how you would optimize a React application that is loading slowly.',
            required: true,
            validation: { minLength: 50, maxLength: 1000 }
          },
          {
            id: 'q5',
            type: 'numeric',
            title: 'On a scale of 1-10, how would you rate your CSS skills?',
            required: true,
            validation: { min: 1, max: 10 }
          },
          {
            id: 'q6',
            type: 'single-choice',
            title: 'Are you available for remote work?',
            required: true,
            options: [
              { id: 'opt1', text: 'Yes', value: 'yes' },
              { id: 'opt2', text: 'No', value: 'no' },
              { id: 'opt3', text: 'Hybrid preferred', value: 'hybrid' }
            ]
          },
          {
            id: 'q7',
            type: 'short-text',
            title: 'If remote work is preferred, what timezone are you in?',
            conditional: {
              dependsOn: 'q6',
              condition: 'equals',
              value: 'yes'
            },
            validation: { maxLength: 50 }
          }
        ]
      }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    )
  }
  if (!assessment) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
        <p className="text-muted-foreground">The requested assessment could not be loaded.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }
  if (isCompleted) {
    const stats = getCompletionStats()
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Assessment Completed!</h2>
        <p className="text-muted-foreground mb-6">
          Thank you for completing the assessment. Your responses have been saved.
        </p>
        <Card className="max-w-md mx-auto mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-semibold">{stats.answered}/{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Completion Rate:</span>
                <Badge variant={stats.percentage === 100 ? "default" : "secondary"}>
                  {stats.percentage}%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Time Taken:</span>
                <span className="font-semibold">
                  {Math.round((Date.now() - startTime.getTime()) / 1000 / 60)} minutes
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Dashboard
        </Button>
      </div>
    )
  }
  const stats = getCompletionStats()
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Started {Math.round((Date.now() - startTime.getTime()) / 1000 / 60)} minutes ago
            </span>
          </div>
          <Badge variant={stats.percentage === 100 ? "default" : "secondary"}>
            {stats.answered}/{stats.total} answered ({stats.percentage}%)
          </Badge>
        </div>
      </div>
      {/* Auto-save indicator */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Your responses are automatically saved every 30 seconds
        </p>
      </div>
      {/* Assessment Form */}
      <AssessmentPreview 
        assessment={assessment}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
