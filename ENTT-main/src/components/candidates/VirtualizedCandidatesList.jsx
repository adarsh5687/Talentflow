import { memo, useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { User, Mail, Phone, Calendar, Briefcase } from 'lucide-react'
const ITEMS_PER_PAGE = 50
const CONTAINER_HEIGHT = 600
const CandidateItem = memo(({ candidate, jobsMap }) => {
  const navigate = useNavigate()
  const job = jobsMap[candidate.jobId]
  const stageColors = {
    applied: 'bg-gray-100 text-black',
    screening: 'bg-yellow-100 text-yellow-800',
    technical: 'bg-purple-100 text-purple-800',
    final: 'bg-orange-100 text-orange-800',
    offer: 'bg-green-100 text-green-800',
    hired: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800'
  }
  const handleClick = () => {
    navigate(`/candidates/${candidate.id}`)
  }
  return (
    <div className="p-2">
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow h-[140px]"
        onClick={handleClick}
      >
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg truncate">{candidate.name}</h3>
              <Badge className={stageColors[candidate.stage] || 'bg-gray-100 text-gray-800'}>
                {candidate.stage.charAt(0).toUpperCase() + candidate.stage.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span className="truncate">{candidate.email}</span>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{candidate.phone}</span>
                </div>
              )}
            </div>
            {job && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span className="truncate">
                  {job.title} at {job.company}
                </span>
                <Badge variant="outline" className="text-xs">
                  Job Id: {candidate.jobId}
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Applied {candidate.appliedAt ? new Date(candidate.appliedAt).toLocaleDateString() : 'No date'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
CandidateItem.displayName = 'CandidateItem'
export default function VirtualizedCandidatesList({ candidates, loading }) {
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  // Fetch jobs data
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
  const displayedCandidates = useMemo(() => 
    candidates.slice(0, ITEMS_PER_PAGE), 
    [candidates]
  )
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
  if (candidates.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      </div>
    )
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="overflow-y-auto space-y-2 p-2"
        style={{ height: CONTAINER_HEIGHT }}
      >
        {displayedCandidates.map((candidate) => (
          <CandidateItem key={candidate.id} candidate={candidate} jobsMap={jobsMap} />
        ))}
        {candidates.length > ITEMS_PER_PAGE && (
          <div className="text-center text-muted-foreground p-4 border-t">
            Showing first {ITEMS_PER_PAGE} candidates of {candidates.length} total
            <br />
            <span className="text-xs">Use search or filters to narrow down results</span>
          </div>
        )}
      </div>
    </div>
  )
}
