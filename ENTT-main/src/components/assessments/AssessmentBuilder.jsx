import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { saveAssessment } from '../../store/slices/assessmentsSlice'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { 
  Plus, 
  Save, 
  Eye, 
  Edit3, 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  ChevronRight,
  Settings,
  FileText,
  CheckSquare,
  Hash,
  Upload,
  Copy,
  Move3D
} from 'lucide-react'
import AssessmentPreview from './AssessmentPreview'
const questionTypes = [
  { value: 'single-choice', label: 'Single Choice', icon: CheckSquare },
  { value: 'multi-choice', label: 'Multiple Choice', icon: CheckSquare },
  { value: 'short-text', label: 'Short Text', icon: FileText },
  { value: 'long-text', label: 'Long Text', icon: FileText },
  { value: 'numeric', label: 'Numeric', icon: Hash },
  { value: 'file-upload', label: 'File Upload', icon: Upload }
]
export default function AssessmentBuilder({ assessment, loading, jobId, onSave }) {
  const dispatch = useAppDispatch()
  const { loading: saveLoading, error: saveError } = useAppSelector(state => state.assessments)
  const [previewMode, setPreviewMode] = useState(false)
  const [localAssessment, setLocalAssessment] = useState(null)
  const [expandedSections, setExpandedSections] = useState(new Set())
  const [expandedQuestions, setExpandedQuestions] = useState(new Set())
  const [showSuccess, setShowSuccess] = useState(false)
  useEffect(() => {
    if (assessment) {
      setLocalAssessment(assessment)
      setExpandedSections(new Set(assessment.sections?.map(s => s.id) || []))
    } else if (jobId) {
      setLocalAssessment({
        id: 'new',
        jobId,
        title: 'New Assessment',
        description: 'Assessment description',
        sections: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  }, [assessment, jobId])
  const handleSave = async () => {
    if (localAssessment) {
      if (!localAssessment.title || localAssessment.title.trim() === '') {
        console.error('Assessment title is required')
        return
      }
      if (!localAssessment.jobId) {
        console.error('Job ID is required')
        return
      }
      const updatedAssessment = {
        ...localAssessment,
        title: localAssessment.title.trim(),
        updatedAt: new Date().toISOString()
      }
      setLocalAssessment(updatedAssessment)
      try {
        const result = await dispatch(saveAssessment(updatedAssessment))
        if (result.payload) {
          setLocalAssessment(result.payload)
          setShowSuccess(true)
          setTimeout(() => {
            setShowSuccess(false)
          }, 3000)
          if (onSave) {
            onSave()
          }
        } else if (result.error) {
          console.error('Save failed with error:', result.error)
        } else if (result.type && result.type.endsWith('/rejected')) {
          console.error('Save was rejected:', result)
        } else {
          console.warn('Unexpected save result:', result)
        }
      } catch (error) {
        console.error('Failed to save assessment:', error)
      }
    }
  }
  const updateAssessment = (updates) => {
    setLocalAssessment(prev => ({ ...prev, ...updates }))
  }
  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      description: '',
      questions: [],
      order: localAssessment.sections.length
    }
    updateAssessment({
      sections: [...localAssessment.sections, newSection]
    })
    setExpandedSections(prev => new Set([...prev, newSection.id]))
  }
  const updateSection = (sectionId, updates) => {
    updateAssessment({
      sections: localAssessment.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    })
  }
  const deleteSection = (sectionId) => {
    updateAssessment({
      sections: localAssessment.sections.filter(section => section.id !== sectionId)
    })
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      newSet.delete(sectionId)
      return newSet
    })
  }
  const addQuestion = (sectionId) => {
    const newQuestion = {
      id: `question-${Date.now()}`,
      type: 'short-text',
      title: 'New Question',
      description: '',
      required: false,
      options: [],
      validation: {},
      conditional: null
    }
    updateSection(sectionId, {
      questions: [
        ...localAssessment.sections.find(s => s.id === sectionId).questions,
        newQuestion
      ]
    })
    setExpandedQuestions(prev => new Set([...prev, newQuestion.id]))
  }
  const updateQuestion = (sectionId, questionId, updates) => {
    const section = localAssessment.sections.find(s => s.id === sectionId)
    const updatedQuestions = section.questions.map(question =>
      question.id === questionId ? { ...question, ...updates } : question
    )
    updateSection(sectionId, { questions: updatedQuestions })
  }
  const deleteQuestion = (sectionId, questionId) => {
    const section = localAssessment.sections.find(s => s.id === sectionId)
    const updatedQuestions = section.questions.filter(question => question.id !== questionId)
    updateSection(sectionId, { questions: updatedQuestions })
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      newSet.delete(questionId)
      return newSet
    })
  }
  const addOption = (sectionId, questionId) => {
    const section = localAssessment.sections.find(s => s.id === sectionId)
    const question = section.questions.find(q => q.id === questionId)
    const newOption = {
      id: `option-${Date.now()}`,
      text: 'New Option',
      value: `option-${question.options?.length || 0}`
    }
    updateQuestion(sectionId, questionId, {
      options: [...(question.options || []), newOption]
    })
  }
  const updateOption = (sectionId, questionId, optionId, updates) => {
    const section = localAssessment.sections.find(s => s.id === sectionId)
    const question = section.questions.find(q => q.id === questionId)
    const updatedOptions = question.options.map(option =>
      option.id === optionId ? { ...option, ...updates } : option
    )
    updateQuestion(sectionId, questionId, { options: updatedOptions })
  }
  const deleteOption = (sectionId, questionId, optionId) => {
    const section = localAssessment.sections.find(s => s.id === sectionId)
    const question = section.questions.find(q => q.id === questionId)
    const updatedOptions = question.options.filter(option => option.id !== optionId)
    updateQuestion(sectionId, questionId, { options: updatedOptions })
  }
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }
  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }
  const getAllQuestions = () => {
    if (!localAssessment?.sections) return []
    return localAssessment.sections.flatMap(section => 
      section.questions.map(question => ({
        ...question,
        sectionTitle: section.title
      }))
    )
  }
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    )
  }
  if (previewMode && localAssessment) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Assessment Preview</h2>
          <Button onClick={() => setPreviewMode(false)} variant="outline">
            <Edit3 className="h-4 w-4 mr-2" />
            Back to Builder
          </Button>
        </div>
        <AssessmentPreview assessment={localAssessment} />
      </div>
    )
  }
  if (!localAssessment) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No assessment data available</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Builder Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Assessment Builder</h2>
          <div className="flex gap-2">
            <Button onClick={() => setPreviewMode(true)} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={saveLoading}>
              <Save className="h-4 w-4 mr-2" />
              {saveLoading ? 'Saving...' : 'Save Assessment'}
            </Button>
          </div>
        </div>
        {/* Error Display */}
        {saveError && (
          <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive font-medium">Error saving assessment:</p>
            <p className="text-destructive text-sm">{saveError}</p>
          </div>
        )}
        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-medium">Assessment saved successfully!</p>
            <p className="text-green-600 text-sm">ID: {localAssessment?.id}</p>
          </div>
        )}
        {/* Assessment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={localAssessment.title}
                onChange={(e) => updateAssessment({ title: e.target.value })}
                placeholder="Assessment title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={localAssessment.description || ''}
                onChange={(e) => updateAssessment({ description: e.target.value })}
                placeholder="Assessment description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        {/* Sections */}
        <div className="space-y-4">
          {localAssessment.sections.map((section, sectionIndex) => (
            <Card key={section.id} className="border-l-4 border-l-black">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection(section.id)}
                    >
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">Section {sectionIndex + 1}</h3>
                      <p className="text-sm text-muted-foreground">
                        {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addQuestion(section.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Question
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedSections.has(section.id) && (
                <CardContent className="space-y-4">
                  {/* Section Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`section-title-${section.id}`}>Section Title</Label>
                      <Input
                        id={`section-title-${section.id}`}
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder="Section title"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`section-desc-${section.id}`}>Description</Label>
                      <Input
                        id={`section-desc-${section.id}`}
                        value={section.description || ''}
                        onChange={(e) => updateSection(section.id, { description: e.target.value })}
                        placeholder="Section description"
                      />
                    </div>
                  </div>
                  {/* Questions */}
                  <div className="space-y-3">
                    {section.questions.map((question, questionIndex) => (
                      <QuestionBuilder
                        key={question.id}
                        question={question}
                        questionIndex={questionIndex}
                        sectionId={section.id}
                        expanded={expandedQuestions.has(question.id)}
                        onToggle={() => toggleQuestion(question.id)}
                        onUpdate={(updates) => updateQuestion(section.id, question.id, updates)}
                        onDelete={() => deleteQuestion(section.id, question.id)}
                        onAddOption={() => addOption(section.id, question.id)}
                        onUpdateOption={(optionId, updates) => updateOption(section.id, question.id, optionId, updates)}
                        onDeleteOption={(optionId) => deleteOption(section.id, question.id, optionId)}
                        allQuestions={getAllQuestions()}
                      />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
          {/* Add Section Button */}
          <Button
            onClick={addSection}
            variant="outline"
            className="w-full h-12 border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      </div>
      {/* Preview Panel */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AssessmentPreview assessment={localAssessment} compact />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
function QuestionBuilder({ 
  question, 
  questionIndex, 
  sectionId, 
  expanded, 
  onToggle, 
  onUpdate, 
  onDelete,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  allQuestions 
}) {
  const questionType = questionTypes.find(type => type.value === question.type)
  const Icon = questionType?.icon || FileText
  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <Icon className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Q{questionIndex + 1}: {question.title}</h4>
                {question.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{questionType?.label}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4">
          {/* Basic Question Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Question Type</Label>
              <Select value={question.type} onValueChange={(value) => onUpdate({ type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map(type => {
                    const TypeIcon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`required-${question.id}`}
                checked={question.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor={`required-${question.id}`}>Required</Label>
            </div>
          </div>
          <div>
            <Label>Question Title</Label>
            <Input
              value={question.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Question title"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={question.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Question description (optional)"
              rows={2}
            />
          </div>
          {/* Options for choice questions */}
          {(question.type === 'single-choice' || question.type === 'multi-choice') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Options</Label>
                <Button onClick={onAddOption} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {question.options?.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      value={option.text}
                      onChange={(e) => onUpdateOption(option.id, { text: e.target.value })}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteOption(option.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Validation Settings */}
          <ValidationSettings 
            question={question} 
            onUpdate={onUpdate} 
          />
          {/* Conditional Logic */}
          <ConditionalLogic 
            question={question} 
            allQuestions={allQuestions}
            onUpdate={onUpdate} 
          />
        </CardContent>
      )}
    </Card>
  )
}
function ValidationSettings({ question, onUpdate }) {
  const updateValidation = (field, value) => {
    onUpdate({
      validation: {
        ...question.validation,
        [field]: value === '' ? undefined : value
      }
    })
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Validation Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Text validation */}
        {(question.type === 'short-text' || question.type === 'long-text') && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Min Length</Label>
              <Input
                type="number"
                placeholder="0"
                value={question.validation?.minLength || ''}
                onChange={(e) => updateValidation('minLength', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label className="text-xs">Max Length</Label>
              <Input
                type="number"
                placeholder="1000"
                value={question.validation?.maxLength || ''}
                onChange={(e) => updateValidation('maxLength', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>
        )}
        {/* Numeric validation */}
        {question.type === 'numeric' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Min Value</Label>
              <Input
                type="number"
                placeholder="0"
                value={question.validation?.min || ''}
                onChange={(e) => updateValidation('min', parseFloat(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label className="text-xs">Max Value</Label>
              <Input
                type="number"
                placeholder="100"
                value={question.validation?.max || ''}
                onChange={(e) => updateValidation('max', parseFloat(e.target.value) || undefined)}
              />
            </div>
          </div>
        )}
        {/* Pattern validation */}
        {question.type === 'short-text' && (
          <div>
            <Label className="text-xs">Pattern (RegEx)</Label>
            <Input
              placeholder="^[a-zA-Z]+$"
              value={question.validation?.pattern || ''}
              onChange={(e) => updateValidation('pattern', e.target.value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ConditionalLogic({ question, allQuestions, onUpdate }) {
  const availableQuestions = allQuestions.filter(q => q.id !== question.id)
  const updateConditional = (field, value) => {
    if (field === null) {
      if (value) {
        onUpdate({ 
          conditional: {
            dependsOn: '',
            condition: 'equals',
            value: ''
          }
        })
      } else {
        onUpdate({ conditional: null })
      }
    } else {
      onUpdate({
        conditional: {
          ...question.conditional,
          [field]: value
        }
      })
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Move3D className="h-4 w-4" />
          Conditional Logic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`conditional-${question.id}`}
            checked={!!question.conditional}
            onChange={(e) => updateConditional(null, e.target.checked)}
          />
          <Label htmlFor={`conditional-${question.id}`} className="text-xs">
            Show this question conditionally
          </Label>
        </div>
        {question.conditional && (
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Show when</Label>
              <Select
                value={question.conditional.dependsOn || ''}
                onValueChange={(value) => updateConditional('dependsOn', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a question" />
                </SelectTrigger>
                <SelectContent>
                  {availableQuestions.map(q => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.title} ({q.sectionTitle})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Condition</Label>
                <Select
                  value={question.conditional.condition || 'equals'}
                  onValueChange={(value) => updateConditional('condition', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not-equals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Value</Label>
                <Input
                  placeholder="Value"
                  value={question.conditional.value || ''}
                  onChange={(e) => updateConditional('value', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
