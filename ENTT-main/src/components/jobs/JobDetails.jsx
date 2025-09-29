import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { api } from '../../lib/api'
import { assessmentFileAPI } from '../../lib/assessmentFileAPI'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ArrowLeft, MapPin, DollarSign, Calendar, Edit, Trash2, FileText, CheckCircle, Clock, Users } from 'lucide-react'
import EditJobDialog from './EditJobDialog'
import { Link } from 'react-router-dom'
export default function JobDetails({ jobId }) {
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0) 
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true)
        
        assessmentFileAPI.clearCache()
        const jobsResult = await api.getJobs({ pageSize: 1000 })
        const foundJob = jobsResult.jobs.find(j => j.id === jobId)
        if (foundJob) {
          setJob(foundJob)
          try {
            const jobAssessment = await assessmentFileAPI.getAssessmentByJobId(jobId)
            setAssessment(jobAssessment)
          } catch (assessmentErr) {
            setAssessment(null)
          }
        } else {
          setError('Job not found')
        }
      } catch (err) {
        console.error('Error fetching job details:', err)
        setError('Failed to load job details')
      } finally {
        setLoading(false)
      }
    }
    if (jobId) {
      fetchJobDetails()
    }
  }, [jobId, refreshKey])
  const handleJobDeleted = () => {
    navigate('/jobs')
  }
  const handleJobUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1)
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/jobs')} disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => navigate('/jobs')}>
              Return to Jobs List
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (!job) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Job not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/jobs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
        <div className="flex gap-2">
          <Link to={`/assessments/${job.id}`}>
            <Button size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Assessment
            </Button>
          </Link>
          <EditJobDialog 
            job={job} 
            onJobDeleted={handleJobDeleted}
            onJobUpdated={handleJobUpdated}
          >
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </EditJobDialog>
        </div>
      </div>
      {/* Job Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'No date'}
                </div>
                {job.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </div>
                )}
                {job.salary && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {job.salary}
                  </div>
                )}
              </div>
            </div>
            <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
              {job.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          {job.description && (
            <div>
              <h3 className="font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {job.description}
              </p>
            </div>
          )}
          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0"></span>
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {/* Metadata */}
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Job ID:</span>
                <p className="font-mono">{job.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Posted:</span>
                <p>{job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'No date'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Assessment Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Assessment
            </CardTitle>
            <div className="flex gap-2">
              {assessment ? (
                <Link to={`/assessments/${job.id}`}>
                  <Button size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Assessment
                  </Button>
                </Link>
              ) : (
                <Link to={`/assessments/builder?jobId=${job.id}`}>
                  <Button size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Assessment
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {assessment ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{assessment.title}</h3>
                {assessment.description && (
                  <p className="text-muted-foreground mb-4">{assessment.description}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${assessment.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-sm">
                    Status: {assessment.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-black" />
                  <span className="text-sm">
                    {assessment.sections?.length || 0} Section{assessment.sections?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">
                    {assessment.sections?.reduce((total, section) => total + (section.questions?.length || 0), 0) || 0} Questions
                  </span>
                </div>
              </div>
              {assessment.sections && assessment.sections.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Sections:</h4>
                  <div className="space-y-2">
                    {assessment.sections.map((section, index) => (
                      <div key={section.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <span className="font-medium">{section.title}</span>
                          {section.description && (
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {section.questions?.length || 0} questions
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p>{assessment.createdAt ? new Date(assessment.createdAt).toLocaleString() : 'No date'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>
                    <p>{assessment.updatedAt ? new Date(assessment.updatedAt).toLocaleString() : 'No date'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Assessment Created</h3>
              <p className="text-muted-foreground mb-4">
                Create an assessment to evaluate candidates for this position.
              </p>
              <Link to={`/assessments/builder?jobId=${job.id}`}>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Assessment
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
