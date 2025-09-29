import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { fetchCandidates } from '../store/slices/candidatesSlice'
import CandidatesList from '../components/candidates/CandidatesList'
import CandidateDetails from '../components/candidates/CandidateDetails'
export default function CandidatesPage() {
  const { candidateId } = useParams()
  const dispatch = useAppDispatch()
  const { candidates, loading, error, filters, pagination } = useAppSelector(state => state.candidates)
  useEffect(() => {
    dispatch(fetchCandidates({
      search: filters.search,
      stage: filters.stage || undefined,
      jobId: filters.jobId || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    }))
  }, [dispatch, filters.search, filters.stage, filters.jobId, pagination.page, pagination.pageSize])
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading candidates: {error}</p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Candidates</h1>
      </div>
      <CandidatesList candidates={candidates} loading={loading} />
    </div>
  )
}
