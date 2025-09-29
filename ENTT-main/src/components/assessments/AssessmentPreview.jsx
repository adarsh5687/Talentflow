import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { CheckCircle, AlertCircle, Upload, FileText, Send } from 'lucide-react'
export default function AssessmentPreview({ assessment, compact = false, onSubmit }) {
  const [answers, setAnswers] = useState({})
  const [validationErrors, setValidationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visibleQuestions, setVisibleQuestions] = useState(new Set())
  useEffect(() => {
    updateVisibleQuestions()
  }, [answers, assessment])
  const updateVisibleQuestions = () => {
    const visible = new Set()
    assessment?.sections?.forEach(section => {
      section.questions?.forEach(question => {
        if (!question.conditional) {
          visible.add(question.id)
        } else {
          const dependentAnswer = answers[question.conditional.dependsOn]
          if (shouldShowQuestion(question.conditional, dependentAnswer)) {
            visible.add(question.id)
          }
        }
      })
    })
    setVisibleQuestions(visible)
  }
  const shouldShowQuestion = (conditional, dependentAnswer) => {
    if (!dependentAnswer) return false
    switch (conditional.condition) {
      case 'equals':
        return dependentAnswer === conditional.value
      case 'not-equals':
        return dependentAnswer !== conditional.value
      case 'contains':
        return dependentAnswer.toString().toLowerCase().includes(conditional.value.toLowerCase())
      default:
        return false
    }
  }
  if (!assessment) {
    return (
      <Card>
        <CardContent className={`text-center text-muted-foreground ${compact ? 'p-4' : 'p-6'}`}>
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
    // Clear validation error when user provides answer
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }
  const validateAnswer = (question, answer) => {
    const errors = []
    if (question.required && (!answer || answer.toString().trim() === '')) {
      errors.push('This field is required')
    }
    if (answer && question.validation) {
      const validation = question.validation
      // Text validation
      if (question.type === 'short-text' || question.type === 'long-text') {
        if (validation.minLength && answer.length < validation.minLength) {
          errors.push(`Minimum length is ${validation.minLength} characters`)
        }
        if (validation.maxLength && answer.length > validation.maxLength) {
          errors.push(`Maximum length is ${validation.maxLength} characters`)
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(answer)) {
          errors.push('Invalid format')
        }
      }
      // Numeric validation
      if (question.type === 'numeric') {
        const numValue = parseFloat(answer)
        if (isNaN(numValue)) {
          errors.push('Must be a valid number')
        } else {
          if (validation.min !== undefined && numValue < validation.min) {
            errors.push(`Minimum value is ${validation.min}`)
          }
          if (validation.max !== undefined && numValue > validation.max) {
            errors.push(`Maximum value is ${validation.max}`)
          }
        }
      }
    }
    return errors
  }
  const validateAllAnswers = () => {
    const errors = {}
    assessment.sections?.forEach(section => {
      section.questions?.forEach(question => {
        if (visibleQuestions.has(question.id)) {
          const questionErrors = validateAnswer(question, answers[question.id])
          if (questionErrors.length > 0) {
            errors[question.id] = questionErrors[0]
          }
        }
      })
    })
    return errors
  }
  const handleSubmit = async () => {
    const errors = validateAllAnswers()
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
  const renderQuestion = (question) => {
    if (!visibleQuestions.has(question.id)) {
      return null
    }
    const answer = answers[question.id]
    const error = validationErrors[question.id]
    return (
      <div key={question.id} className={`space-y-2 ${compact ? 'mb-4' : 'mb-6'}`}>
        <div className="flex items-start gap-2">
          <Label className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
            {question.title}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>
        {question.description && (
          <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
            {question.description}
          </p>
        )}
        <div className="space-y-2">
          {renderQuestionInput(question, answer, (value) => handleAnswerChange(question.id, value))}
          {error && (
            <div className="flex items-center gap-1 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }
  const renderQuestionInput = (question, value, onChange) => {
    switch (question.type) {
      case 'short-text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer"
            className={compact ? 'text-sm' : ''}
          />
        )
      case 'long-text':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer"
            rows={compact ? 3 : 4}
            className={compact ? 'text-sm' : ''}
          />
        )
      case 'numeric':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter a number"
            min={question.validation?.min}
            max={question.validation?.max}
            className={compact ? 'text-sm' : ''}
          />
        )
      case 'single-choice':
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${question.id}-${option.id}`}
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="rounded"
                />
                <Label 
                  htmlFor={`${question.id}-${option.id}`}
                  className={compact ? 'text-sm' : ''}
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        )
      case 'multi-choice':
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${question.id}-${option.id}`}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    if (e.target.checked) {
                      onChange([...currentValues, option.value])
                    } else {
                      onChange(currentValues.filter(v => v !== option.value))
                    }
                  }}
                  className="rounded"
                />
                <Label 
                  htmlFor={`${question.id}-${option.id}`}
                  className={compact ? 'text-sm' : ''}
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        )
      case 'file-upload':
        return (
          <div className="space-y-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'} mb-2`}>
                {answers[question.id] ? 'File selected' : 'Drop your file here or click to browse'}
              </p>
              <input
                type="file"
                id={`file-${question.id}`}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setAnswers(prev => ({
                      ...prev,
                      [question.id]: {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified
                      }
                    }))
                  }
                }}
                accept="*/*"
              />
              <label
                htmlFor={`file-${question.id}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 cursor-pointer"
              >
                Choose File
              </label>
            </div>
            {answers[question.id] && (
              <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className={`text-green-700 ${compact ? 'text-xs' : 'text-sm'}`}>
                    {answers[question.id].name}
                  </span>
                  <span className={`text-green-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                    ({Math.round(answers[question.id].size / 1024)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAnswers(prev => {
                      const newAnswers = { ...prev }
                      delete newAnswers[question.id]
                      return newAnswers
                    })
                  }}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  ×
                </Button>
              </div>
            )}
          </div>
        )
      default:
        return (
          <div className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
            Unsupported question type: {question.type}
          </div>
        )
    }
  }
  if (compact) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-semibold text-sm">{assessment.title}</h3>
          {assessment.description && (
            <p className="text-xs text-muted-foreground mt-1">{assessment.description}</p>
          )}
        </div>
        <div className="space-y-3">
          {assessment.sections?.slice(0, 1).map(section => (
            <div key={section.id}>
              <h4 className="font-medium text-sm mb-2">{section.title}</h4>
              {section.questions?.slice(0, 2).map(renderQuestion)}
              {section.questions?.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{section.questions.length - 2} more questions...
                </p>
              )}
            </div>
          ))}
          {assessment.sections?.length > 1 && (
            <p className="text-xs text-muted-foreground text-center">
              +{assessment.sections.length - 1} more sections...
            </p>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{assessment.title}</h1>
        {assessment.description && (
          <p className="text-muted-foreground mt-2">{assessment.description}</p>
        )}
      </div>
      {assessment.sections?.map((section, sectionIndex) => (
        <Card key={section.id} className="border-l-4 border-l-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Section {sectionIndex + 1}: {section.title}
            </CardTitle>
            {section.description && (
              <p className="text-muted-foreground text-sm">{section.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {section.questions?.map(renderQuestion)}
          </CardContent>
        </Card>
      ))}
      {onSubmit && (
        <div className="flex justify-center">
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Assessment
              </>
            )}
          </Button>
        </div>
      )}
      {/* Answer Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(answers).map(([questionId, answer]) => {
              const question = assessment.sections
                ?.flatMap(s => s.questions)
                ?.find(q => q.id === questionId)
              if (!question || !visibleQuestions.has(questionId)) return null
              return (
                <div key={questionId} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm font-medium">{question.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {Array.isArray(answer) ? answer.join(', ') : answer?.toString() || 'No answer'}
                  </span>
                </div>
              )
            })}
            {Object.keys(answers).length === 0 && (
              <p className="text-muted-foreground text-sm text-center">
                No responses yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
