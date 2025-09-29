import { useParams, useNavigate } from 'react-router-dom'
import AssessmentRuntime from '../components/assessments/AssessmentRuntime'
export default function AssessmentRuntimePage() {
  const { assessmentId, candidateId } = useParams()
  const navigate = useNavigate()
  const handleComplete = (response) => {
    if (candidateId) {
      navigate(`/candidates/${candidateId}`)
    } else {
      navigate('/assessments')
    }
  }
  return (
    <div className="container mx-auto py-6">
      <AssessmentRuntime
        assessmentId={assessmentId}
        candidateId={candidateId}
        onComplete={handleComplete}
      />
    </div>
  )
}
