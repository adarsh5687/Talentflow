import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { fetchAssessment, fetchAssessments } from '../store/slices/assessmentsSlice'
import { fetchJobs } from '../store/slices/jobsSlice'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { FileText, Plus, Calendar, Users, Edit3, Eye, Briefcase } from 'lucide-react'
import AssessmentBuilder from '../components/assessments/AssessmentBuilder'
export default function AssessmentsPage() {
  const { jobId } = useParams()
  const dispatch = useAppDispatch()
  const { currentAssessment, assessments, loading, error } = useAppSelector(state => state.assessments)
  const { jobs } = useAppSelector(state => state.jobs)
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    dispatch(fetchJobs())
    if (jobId) {
      dispatch(fetchAssessment(jobId))
    } else {
      dispatch(fetchAssessments())
    }
  }, [dispatch, jobId, refreshKey])
  const refreshAssessments = () => {
    dispatch(fetchAssessments())
    if (jobId) {
      dispatch(fetchAssessment(jobId))
    }
    setRefreshKey(prev => prev + 1)
  }
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading assessments: {error}</p>
      </div>
    )
  }
  if (jobId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Assessment Builder</h1>
        </div>
        <AssessmentBuilder 
          assessment={currentAssessment} 
          loading={loading} 
          jobId={jobId}
          onSave={refreshAssessments}
        />
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assessments</h1>
        <Link to="/jobs">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment (Select Job)
          </Button>
        </Link>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assessments...</p>
          </div>
        </div>
      ) : (
        <>
          {assessments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Assessments Yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Create your first assessment by selecting a job and building custom questions 
                  to evaluate candidates effectively.
                </p>
                <Link to="/jobs">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Assessment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} jobs={jobs} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
function AssessmentCard({ assessment, jobs }) {
  const totalQuestions = assessment.sections?.reduce((sum, section) => 
    sum + (section.questions?.length || 0), 0
  ) || 0
  
  const associatedJob = jobs.find(job => job.id === assessment.jobId)
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{assessment.title}</CardTitle>
            {associatedJob && (
              <div className="flex items-center gap-1 mb-2 text-sm text-primary">
                <Briefcase className="h-4 w-4" />
                <span className="font-medium">
                  Job #{assessment.jobId}: {associatedJob.title}
                  {associatedJob.company && ` at ${associatedJob.company}`}
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {assessment.description}
            </p>
          </div>
          <Badge variant={assessment.isActive ? "default" : "secondary"}>
            {assessment.isActive ? "Active" : "Draft"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{assessment.sections?.length || 0} sections</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{totalQuestions} questions</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Updated {formatDate(assessment.updatedAt)}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <Link to={`/assessments/${assessment.jobId}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Link to={`/assessment/${assessment.id}`} className="flex-1">
              <Button size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
