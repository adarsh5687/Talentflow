import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchCandidate, updateCandidateStage, addCandidateNote } from '../../store/slices/candidatesSlice'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare, 
  ChevronRight,
  FileText,
  Clock,
  Edit,
  Send,
  AtSign,
  Briefcase
} from 'lucide-react'
const stageColors = {
  applied: 'bg-gray-100 text-black',
  screening: 'bg-yellow-100 text-yellow-800',
  technical: 'bg-purple-100 text-purple-800',
  final: 'bg-orange-100 text-orange-800',
  offer: 'bg-green-100 text-green-800',
  hired: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800'
}
const stages = [
  { id: 'applied', name: 'Applied' },
  { id: 'screening', name: 'Screening' },
  { id: 'technical', name: 'Technical' },
  { id: 'final', name: 'Final Interview' },
  { id: 'offer', name: 'Offer' },
  { id: 'hired', name: 'Hired' },
  { id: 'rejected', name: 'Rejected' }
]
const teamMembers = [
  { id: '1', name: 'John Smith', email: 'john@company.com' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com' },
  { id: '3', name: 'Mike Chen', email: 'mike@company.com' },
  { id: '4', name: 'Emily Davis', email: 'emily@company.com' },
  { id: '5', name: 'Alex Wilson', email: 'alex@company.com' }
]
const MentionSuggestions = ({ suggestions, onSelect }) => {
  if (suggestions.length === 0) return null
  return (
    <div 
      className="absolute top-full left-0 z-50 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto min-w-48 mt-1"
    >
      {suggestions.map((member, index) => (
        <div
          key={member.id}
          className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
          onClick={() => onSelect(member)}
        >
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-black">
            {member.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-sm">{member.name}</div>
            <div className="text-xs text-muted-foreground">{member.email}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
const NotesSection = ({ candidate, onAddNote }) => {
  const [newNote, setNewNote] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef(null)
  const handleNoteChange = (e) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    setNewNote(value)
    setCursorPosition(cursorPos)
    const lastAtIndex = value.lastIndexOf('@', cursorPos - 1)
    if (lastAtIndex !== -1) {
      const searchTerm = value.substring(lastAtIndex + 1, cursorPos)
      if (searchTerm.length === 0 || /^\w*$/.test(searchTerm)) {
        const filtered = teamMembers.filter(member =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setMentionSuggestions(filtered)
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }
  const handleMentionSelect = (member) => {
    const lastAtIndex = newNote.lastIndexOf('@', cursorPosition - 1)
    const beforeMention = newNote.substring(0, lastAtIndex)
    const afterMention = newNote.substring(cursorPosition)
    const newValue = `${beforeMention}@${member.name} ${afterMention}`
    setNewNote(newValue)
    setShowMentions(false)
    textareaRef.current?.focus()
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newNote.trim()) return
    const mentions = []
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g
    let match
    while ((match = mentionRegex.exec(newNote)) !== null) {
      mentions.push(match[1])
    }
    onAddNote({
      content: newNote,
      mentions
    })
    setNewNote('')
  }
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Notes ({candidate.notes?.length || 0})
      </h3>
      {/* Add new note */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={newNote}
            onChange={handleNoteChange}
            placeholder="Add a note... Use @name to mention team members"
            className="min-h-20 resize-none"
          />
          {showMentions && (
            <MentionSuggestions
              suggestions={mentionSuggestions}
              onSelect={handleMentionSelect}
            />
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            <AtSign className="h-3 w-3 inline mr-1" />
            Use @name to mention team members
          </p>
          <Button type="submit" size="sm" disabled={!newNote.trim()}>
            <Send className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        </div>
      </form>
      {/* Existing notes */}
      <div className="space-y-3">
        {candidate.notes?.map((note) => (
          <Card key={note.id} className="border-l-4 border-l-black">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {note.author.charAt(0)}
                  </div>
                  <span className="font-medium text-sm">{note.author}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'No date'}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{note.content}</p>
              {note.mentions && note.mentions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {note.mentions.map(mention => (
                    <Badge key={mention} variant="secondary" className="text-xs">
                      @{mention}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )) || (
          <p className="text-muted-foreground text-center py-4">No notes yet</p>
        )}
      </div>
    </div>
  )
}
const TimelineSection = ({ candidate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Timeline
      </h3>
      <div className="space-y-3">
        {candidate.timeline?.map((event, index) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${
                event.type === 'stage_change' ? 'bg-black' : 
                event.type === 'note_added' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              {index < candidate.timeline.length - 1 && (
                <div className="w-px h-8 bg-gray-200 mt-1" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{event.title}</span>
                <span className="text-xs text-muted-foreground">
                  {event.author}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
              <span className="text-xs text-muted-foreground">
                {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'No date'}
              </span>
            </div>
          </div>
        )) || (
          <p className="text-muted-foreground text-center py-4">No timeline events</p>
        )}
      </div>
    </div>
  )
}
export default function CandidateDetails() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { selectedCandidate, loading } = useAppSelector(state => state.candidates)
  const [job, setJob] = useState(null)
  const [jobLoading, setJobLoading] = useState(true)
  useEffect(() => {
    if (candidateId) {
      dispatch(fetchCandidate(candidateId))
    }
  }, [candidateId, dispatch])
  useEffect(() => {
    const fetchJobInfo = async () => {
      if (selectedCandidate?.jobId) {
        try {
          setJobLoading(true)
          const response = await fetch('/data/jobs.json')
          const data = await response.json()
          const jobInfo = data.jobs.find(j => j.id === selectedCandidate.jobId)
          setJob(jobInfo || null)
        } catch (error) {
          console.error('Failed to fetch job info:', error)
          setJob(null)
        } finally {
          setJobLoading(false)
        }
      } else {
        setJob(null)
        setJobLoading(false)
      }
    }
    fetchJobInfo()
  }, [selectedCandidate?.jobId])
  const handleStageChange = (newStage) => {
    if (selectedCandidate) {
      dispatch(updateCandidateStage({ 
        candidateId: selectedCandidate.id, 
        stage: newStage 
      }))
    }
  }
  const handleAddNote = (noteData) => {
    if (selectedCandidate) {
      dispatch(addCandidateNote({
        candidateId: selectedCandidate.id,
        note: {
          id: crypto.randomUUID(),
          content: noteData.content,
          author: 'Current User', 
          createdAt: new Date().toISOString(),
          mentions: noteData.mentions
        }
      }))
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading candidate...</p>
        </div>
      </div>
    )
  }
  if (!selectedCandidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Candidate not found</h2>
          <Button onClick={() => navigate('/candidates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Candidates
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/candidates')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Candidates
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{selectedCandidate.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{selectedCandidate.email}</span>
              </div>
              {selectedCandidate.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{selectedCandidate.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Applied {selectedCandidate.appliedAt ? new Date(selectedCandidate.appliedAt).toLocaleDateString() : 'No date'}</span>
              </div>
            </div>
            {/* Job Information */}
            {jobLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Briefcase className="h-4 w-4" />
                <span>Loading job information...</span>
              </div>
            ) : job ? (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="font-medium">Applied for:</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                      <p className="text-gray-600">{job.company}</p>
                      <p className="text-sm text-gray-500">{job.location} • {job.type}</p>
                      <p className="text-sm text-gray-500 mt-1">{job.salary}</p>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      Job ID: {selectedCandidate.jobId}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : selectedCandidate.jobId ? (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Briefcase className="h-4 w-4" />
                <span>Job ID: {selectedCandidate.jobId} (Job details not found)</span>
              </div>
            ) : null}
          </div>
          <div className="text-right">
            <Badge className={`mb-2 ${stageColors[selectedCandidate.stage] || 'bg-gray-100 text-gray-800'}`}>
              {selectedCandidate.stage.charAt(0).toUpperCase() + selectedCandidate.stage.slice(1)}
            </Badge>
            <div className="space-x-2">
              {stages.map(stage => (
                <Button
                  key={stage.id}
                  variant={selectedCandidate.stage === stage.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStageChange(stage.id)}
                  className="text-xs"
                >
                  {stage.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notes & Communication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotesSection candidate={selectedCandidate} onAddNote={handleAddNote} />
          </CardContent>
        </Card>
        {/* Right Column - Timeline & Resume */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineSection candidate={selectedCandidate} />
            </CardContent>
          </Card>
          {selectedCandidate.resume && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Resume
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
