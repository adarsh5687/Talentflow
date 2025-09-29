import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { fetchJobs } from '../store/slices/jobsSlice'
import { useDebounce } from '../hooks/useDebounce'
import JobList from '../components/jobs/JobList'
import JobDetails from '../components/jobs/JobDetails'
export default function JobsPage() {
  const { jobId } = useParams()
  const dispatch = useAppDispatch()
  const { jobs, loading, error, filters, pagination } = useAppSelector(state => state.jobs)
  const debouncedSearch = useDebounce(filters.search, 500)
  useEffect(() => {
    dispatch(fetchJobs({
      search: debouncedSearch,
      status: filters.status === 'all' ? undefined : filters.status,
      page: pagination.page,
      pageSize: pagination.pageSize
    }))
  }, [dispatch, debouncedSearch, filters.status, pagination.page, pagination.pageSize])
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading jobs: {error}</p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Jobs</h1>
      </div>
      {jobId ? (
        <JobDetails jobId={jobId} />
      ) : (
        <JobList jobs={jobs} loading={loading} />
      )}
    </div>
  )
}
