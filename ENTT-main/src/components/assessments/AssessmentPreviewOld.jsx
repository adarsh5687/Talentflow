import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { CheckCircle, AlertCircle, Upload, FileText } from 'lucide-react'
export default function AssessmentPreview({ assessment, compact = false, onSubmit }) {
  const [answers, setAnswers] = useState({})
  const [validationErrors, setValidationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  if (!assessment) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No assessment to preview
        </CardContent>
      </Card>
    )
  }
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }
  const validateAnswers = () => {
    const errors = {}
    assessment.sections?.forEach(section => {
      section.questions?.forEach(question => {
        if (question.required && !answers[question.id]) {
          errors[question.id] = 'This field is required'
        }
        if (question.type === 'numeric' && answers[question.id]) {
          const value = parseFloat(answers[question.id])
          if (isNaN(value)) {
            errors[question.id] = 'Please enter a valid number'
          } else if (question.minValue && value < question.minValue) {
            errors[question.id] = `Value must be at least ${question.minValue}`
          } else if (question.maxValue && value > question.maxValue) {
            errors[question.id] = `Value must be at most ${question.maxValue}`
          }
        }
      })
    })
    return errors
  }
  const handleSubmit = async () => {
    const errors = validateAnswers()
    setValidationErrors(errors)
    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true)
      try {
        await onSubmit?.(answers)
      } finally {
        setIsSubmitting(false)
      }
    }
  }
  const getCompletionPercentage = () => {
    const totalQuestions = assessment.sections?.reduce((total, section) => 
      total + (section.questions?.length || 0), 0) || 0
    if (totalQuestions === 0) return 0
    const answeredQuestions = Object.keys(answers).filter(questionId => 
      answers[questionId] !== undefined && answers[questionId] !== '').length
    return Math.round((answeredQuestions / totalQuestions) * 100)
  }
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{assessment.title}</CardTitle>
          {assessment.description && (
            <p className="text-sm text-muted-foreground">{assessment.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Completion</span>
            <Badge variant="outline">{getCompletionPercentage()}%</Badge>
          </div>
          <div className="space-y-3">
            {assessment.sections?.map((section, sectionIndex) => (
              <div key={section.id} className="space-y-2">
                <h4 className="text-sm font-medium">{section.title}</h4>
                {section.questions?.map((question) => (
                  <div key={question.id} className="pl-3 border-l-2 border-muted">
                    <QuestionPreview
                      question={question}
                      value={answers[question.id]}
                      onChange={(value) => handleAnswerChange(question.id, value)}
                      error={validationErrors[question.id]}
                      compact
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {assessment.title}
            <Badge variant="outline">{getCompletionPercentage()}% Complete</Badge>
          </CardTitle>
          {assessment.description && (
            <p className="text-muted-foreground">{assessment.description}</p>
          )}
        </CardHeader>
      </Card>
      {assessment.sections?.map((section, sectionIndex) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="text-lg">
              {sectionIndex + 1}. {section.title}
            </CardTitle>
            {section.description && (
              <p className="text-muted-foreground">{section.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {section.questions?.map((question, questionIndex) => (
              <div key={question.id} className="space-y-2">
                <QuestionPreview
                  question={question}
                  questionNumber={questionIndex + 1}
                  value={answers[question.id]}
                  onChange={(value) => handleAnswerChange(question.id, value)}
                  error={validationErrors[question.id]}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {onSubmit && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getCompletionPercentage() === 100 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-medium">
                  {getCompletionPercentage() === 100 
                    ? 'Assessment Complete' 
                    : `${getCompletionPercentage()}% Complete`}
                </span>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="min-w-24"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
function QuestionPreview({ 
  question, 
  questionNumber, 
  value, 
  onChange, 
  error, 
  compact = false 
}) {
  const renderQuestionInput = () => {
    switch (question.type) {
      case 'short-text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer"
            className={error ? 'border-destructive' : ''}
          />
        )
      case 'long-text':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer"
            rows={compact ? 2 : 4}
            className={error ? 'border-destructive' : ''}
          />
        )
      case 'single-choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="text-primary"
                />
                <span className={compact ? 'text-sm' : ''}>{option.text}</span>
              </label>
            ))}
          </div>
        )
      case 'multi-choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    if (e.target.checked) {
                      onChange([...currentValues, option.value])
                    } else {
                      onChange(currentValues.filter(v => v !== option.value))
                    }
                  }}
                  className="text-primary"
                />
                <span className={compact ? 'text-sm' : ''}>{option.text}</span>
              </label>
            ))}
          </div>
        )
      case 'numeric':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter a number"
            min={question.minValue}
            max={question.maxValue}
            className={error ? 'border-destructive' : ''}
          />
        )
      case 'file-upload':
        return (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Click to upload or drag and drop
            </p>
            <input
              type="file"
              onChange={(e) => onChange(e.target.files?.[0])}
              className="hidden"
              id={`file-${question.id}`}
            />
            <label
              htmlFor={`file-${question.id}`}
              className="inline-block px-4 py-2 border border-muted-foreground/25 rounded cursor-pointer hover:bg-muted/50"
            >
              Choose File
            </label>
            {value && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                <span>{value.name || 'File selected'}</span>
              </div>
            )}
          </div>
        )
      default:
        return (
          <div className="text-muted-foreground italic">
            Unsupported question type: {question.type}
          </div>
        )
    }
  }
  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{question.title}</span>
          {question.required && <span className="text-destructive text-xs">*</span>}
        </div>
        <div className="text-xs">
          {renderQuestionInput()}
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <Label className="text-base font-medium">
          {questionNumber && `${questionNumber}. `}{question.title}
          {question.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">
          {question.type.replace('-', ' ')}
        </Badge>
      </div>
      {renderQuestionInput()}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
