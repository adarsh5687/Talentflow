import { useState, useEffect } from 'react'
import { useAppDispatch } from '../../hooks/redux'
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
  Upload
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
export default function AssessmentBuilder({ assessment, loading, jobId }) {
  const dispatch = useAppDispatch()
  const [previewMode, setPreviewMode] = useState(false)
  const [localAssessment, setLocalAssessment] = useState(null)
  const [expandedSections, setExpandedSections] = useState(new Set())
  const [expandedQuestions, setExpandedQuestions] = useState(new Set())
  useEffect(() => {
    if (assessment) {
      setLocalAssessment(assessment)
      setExpandedSections(new Set(assessment.sections?.map(s => s.id) || []))
    } else if (jobId) {
      setLocalAssessment({
        id: `assessment-${jobId}`,
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
  const handleSave = () => {
    if (localAssessment) {
      const updatedAssessment = {
        ...localAssessment,
        updatedAt: new Date().toISOString()
      }
      setLocalAssessment(updatedAssessment)
      dispatch(saveAssessment(updatedAssessment))
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
  const handleAddSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      description: 'Section description',
      order: localAssessment.sections.length,
      questions: []
    }
    setLocalAssessment(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }))
    setExpandedSections(prev => new Set([...prev, newSection.id]))
  }
  const handleUpdateSection = (sectionId, updates) => {
    setLocalAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }))
  }
  const handleRemoveSection = (sectionId) => {
    setLocalAssessment(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }))
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      newSet.delete(sectionId)
      return newSet
    })
  }
  const handleAddQuestion = (sectionId) => {
    const newQuestion = {
      id: `question-${Date.now()}`,
      type: 'short-text',
      title: 'New Question',
      required: false,
      options: []
    }
    setLocalAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      )
    }))
  }
  const handleUpdateQuestion = (sectionId, questionId, updates) => {
    setLocalAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map(question =>
                question.id === questionId ? { ...question, ...updates } : question
              )
            }
          : section
      )
    }))
  }
  const handleRemoveQuestion = (sectionId, questionId) => {
    setLocalAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.filter(question => question.id !== questionId)
            }
          : section
      )
    }))
  }
  const toggleSectionExpanded = (sectionId) => {
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
  if (loading) {
    return <AssessmentBuilderSkeleton />
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
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Assessment
            </Button>
          </div>
        </div>
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
                value={localAssessment?.title || ''}
                onChange={(e) => setLocalAssessment(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Assessment title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={localAssessment?.description || ''}
                onChange={(e) => setLocalAssessment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Assessment description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        {/* Sections */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Sections</h3>
            <Button onClick={handleAddSection} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
          {localAssessment?.sections?.map((section, sectionIndex) => (
            <SectionEditor
              key={section.id}
              section={section}
              sectionIndex={sectionIndex}
              isExpanded={expandedSections.has(section.id)}
              onToggleExpanded={() => toggleSectionExpanded(section.id)}
              onUpdateSection={(updates) => handleUpdateSection(section.id, updates)}
              onRemoveSection={() => handleRemoveSection(section.id)}
              onAddQuestion={() => handleAddQuestion(section.id)}
              onUpdateQuestion={(questionId, updates) => handleUpdateQuestion(section.id, questionId, updates)}
              onRemoveQuestion={(questionId) => handleRemoveQuestion(section.id, questionId)}
            />
          ))}
          {localAssessment?.sections?.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">No sections yet</p>
                <Button onClick={handleAddSection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first section
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Live Preview Panel */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Live Preview</h3>
        <div className="sticky top-4">
          <AssessmentPreview assessment={localAssessment} compact />
        </div>
      </div>
    </div>
  )
}
function SectionEditor({ 
  section, 
  sectionIndex, 
  isExpanded, 
  onToggleExpanded, 
  onUpdateSection, 
  onRemoveSection, 
  onAddQuestion, 
  onUpdateQuestion, 
  onRemoveQuestion 
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="p-1 h-auto"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <Input
              value={section.title}
              onChange={(e) => onUpdateSection({ title: e.target.value })}
              className="font-semibold border-none shadow-none p-0 h-auto bg-transparent"
              placeholder="Section title"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{section.questions?.length || 0} questions</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemoveSection}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div>
            <Label>Description</Label>
            <Textarea
              value={section.description}
              onChange={(e) => onUpdateSection({ description: e.target.value })}
              placeholder="Section description"
              rows={2}
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Questions</Label>
              <Button onClick={onAddQuestion} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
            {section.questions?.map((question, questionIndex) => (
              <QuestionEditor
                key={question.id}
                question={question}
                questionIndex={questionIndex}
                onUpdateQuestion={(updates) => onUpdateQuestion(question.id, updates)}
                onRemoveQuestion={() => onRemoveQuestion(question.id)}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
function QuestionEditor({ question, questionIndex, onUpdateQuestion, onRemoveQuestion }) {
  const questionTypes = [
    { value: 'short-text', label: 'Short Text' },
    { value: 'long-text', label: 'Long Text' },
    { value: 'single-choice', label: 'Single Choice' },
    { value: 'multi-choice', label: 'Multiple Choice' },
    { value: 'numeric', label: 'Numeric' },
    { value: 'file-upload', label: 'File Upload' }
  ]
  const handleAddOption = () => {
    const newOption = {
      id: `option-${Date.now()}`,
      text: 'New Option',
      value: `option-${question.options?.length || 0}`
    }
    onUpdateQuestion({
      options: [...(question.options || []), newOption]
    })
  }
  const handleUpdateOption = (optionId, updates) => {
    onUpdateQuestion({
      options: question.options.map(option =>
        option.id === optionId ? { ...option, ...updates } : option
      )
    })
  }
  const handleRemoveOption = (optionId) => {
    onUpdateQuestion({
      options: question.options.filter(option => option.id !== optionId)
    })
  }
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              <Input
                value={question.title}
                onChange={(e) => onUpdateQuestion({ title: e.target.value })}
                placeholder="Question title"
                className="flex-1"
              />
              <select
                value={question.type}
                onChange={(e) => onUpdateQuestion({ type: e.target.value })}
                className="px-3 py-1 border rounded text-sm"
              >
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => onUpdateQuestion({ required: e.target.checked })}
                />
                Required
              </label>
            </div>
            {/* Options for choice questions */}
            {(question.type === 'single-choice' || question.type === 'multi-choice') && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Options</Label>
                  <Button onClick={handleAddOption} variant="outline" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
                </div>
                {question.options?.map((option, optionIndex) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      value={option.text}
                      onChange={(e) => handleUpdateOption(option.id, { text: e.target.value })}
                      placeholder={`Option ${optionIndex + 1}`}
                      size="sm"
                    />
                    <Button
                      onClick={() => handleRemoveOption(option.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={onRemoveQuestion}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
function AssessmentBuilderSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-muted rounded animate-pulse"></div>
            <div className="h-20 bg-muted rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
        <Card>
          <CardContent className="p-4">
            <div className="h-4 bg-muted rounded w-full mb-2 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
