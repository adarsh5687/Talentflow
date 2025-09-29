import { useMemo, useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../hooks/redux'
import { updateCandidateStage } from '../../store/slices/candidatesSlice'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { User, Mail, Calendar, Briefcase } from 'lucide-react'
const stages = [
  { id: 'applied', name: 'Applied', color: 'bg-gray-50 border-gray-200' },
  { id: 'screening', name: 'Screening', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'technical', name: 'Technical', color: 'bg-purple-50 border-purple-200' },
  { id: 'final', name: 'Final Interview', color: 'bg-orange-50 border-orange-200' },
  { id: 'offer', name: 'Offer', color: 'bg-green-50 border-green-200' },
  { id: 'hired', name: 'Hired', color: 'bg-emerald-50 border-emerald-200' },
  { id: 'rejected', name: 'Rejected', color: 'bg-red-50 border-red-200' }
]
const stageColors = {
  applied: 'bg-gray-100 text-black',
  screening: 'bg-yellow-100 text-yellow-800',
  technical: 'bg-purple-100 text-purple-800',
  final: 'bg-orange-100 text-orange-800',
  offer: 'bg-green-100 text-green-800',
  hired: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800'
}
const CandidateCard = ({ candidate, index, jobsMap }) => {
  const navigate = useNavigate()
  const job = jobsMap[candidate.jobId]
  const handleClick = (e) => {
    if (e.defaultPrevented) return
    navigate(`/candidates/${candidate.id}`)
  }
  return (
    <Draggable draggableId={candidate.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 ${snapshot.isDragging ? 'rotate-2 scale-105' : ''}`}
        >
          <Card 
            className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
              snapshot.isDragging ? 'shadow-lg ring-2 ring-black' : ''
            }`}
            onClick={handleClick}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate">{candidate.name}</h4>
                <Badge className={`text-xs ${stageColors[candidate.stage] || 'bg-gray-100 text-gray-800'}`}>
                  {candidate.stage}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{candidate.email}</span>
              </div>
              {job && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Briefcase className="h-3 w-3" />
                  <span className="truncate">{job.title}</span>
                  <Badge variant="outline" className="text-xs ml-1">
                    {candidate.jobId}
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Applied {candidate.appliedAt ? new Date(candidate.appliedAt).toLocaleDateString() : 'No date'}</span>
              </div>
              {candidate.notes && candidate.notes.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{candidate.notes.length}</span> note{candidate.notes.length !== 1 ? 's' : ''}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  )
}
const StageColumn = ({ stage, candidates, jobsMap }) => {
  const stageCandidates = candidates.filter(candidate => candidate.stage === stage.id)
  return (
    <div className="flex-1 min-w-0">
      <Card className={`h-full ${stage.color}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>{stage.name}</span>
            <Badge variant="secondary" className="ml-2">
              {stageCandidates.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Droppable droppableId={stage.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-[400px] transition-colors rounded-lg p-2 ${
                  snapshot.isDraggingOver ? 'bg-gray-100 ring-2 ring-black' : 'bg-white/50'
                }`}
              >
                {stageCandidates.map((candidate, index) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    index={index}
                    jobsMap={jobsMap}
                  />
                ))}
                {provided.placeholder}
                {stageCandidates.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No candidates</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>
    </div>
  )
}
export default function CandidatesKanban({ candidates, loading }) {
  const dispatch = useAppDispatch()
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/data/jobs.json')
        const data = await response.json()
        setJobs(data.jobs || [])
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
        setJobs([])
      } finally {
        setJobsLoading(false)
      }
    }
    fetchJobs()
  }, [])
  const jobsMap = useMemo(() => {
    return jobs.reduce((acc, job) => {
      acc[job.id] = job
      return acc
    }, {})
  }, [jobs])
  const handleDragEnd = (result) => {
    if (!result.destination) return
    const { source, destination, draggableId } = result
    const candidateId = draggableId
    const newStage = destination.droppableId
    if (source.droppableId !== destination.droppableId) {
      dispatch(updateCandidateStage({ candidateId, stage: newStage }))
    }
  }
  if (loading || jobsLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? 'Loading candidates...' : 'Loading job data...'}
          </p>
        </div>
      </div>
    )
  }
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
        {stages.map(stage => (
          <StageColumn
            key={stage.id}
            stage={stage}
            candidates={candidates}
            jobsMap={jobsMap}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
