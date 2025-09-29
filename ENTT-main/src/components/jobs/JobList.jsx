import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { setFilters, setPagination } from '../../store/slices/jobsSlice'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Plus, Search } from 'lucide-react'
import CreateJobDialog from './CreateJobDialog'

const selectStyles = `
  select option:hover {
    background-color: #f3f4f6 !important;
    background: #f3f4f6 !important;
    color: black !important;
  }
  select option:focus {
    background-color: #f3f4f6 !important;
    background: #f3f4f6 !important;
    color: black !important;
  }
  select option:checked {
    background-color: black !important;
    background: black !important;
    color: white !important;
  }
  select option {
    background-color: white !important;
    background: white !important;
    color: black !important;
  }
  select:focus option:hover {
    background-color: #f3f4f6 !important;
    background: #f3f4f6 !important;
  }
`
export default function JobList({ jobs, loading }) {
  const dispatch = useAppDispatch()
  const { filters, pagination } = useAppSelector(state => state.jobs)
  const handleSearchChange = (search) => {
    dispatch(setFilters({ ...filters, search }))
    dispatch(setPagination({ ...pagination, page: 1 }))
  }
  const handleStatusFilter = (status) => {
    dispatch(setFilters({ ...filters, status }))
    dispatch(setPagination({ ...pagination, page: 1 }))
  }
  if (loading) {
    return (
      <div className="space-y-4">
        <JobListHeader 
          onSearchChange={handleSearchChange}
          onStatusFilter={handleStatusFilter}
          filters={filters}
          disabled={true}
        />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: selectStyles }} />
      <JobListHeader 
        onSearchChange={handleSearchChange}
        onStatusFilter={handleStatusFilter}
        filters={filters}
      />
      <div className="space-y-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
        {jobs.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No jobs found</p>
              <CreateJobDialog>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first job
                </Button>
              </CreateJobDialog>
            </CardContent>
          </Card>
        )}      <BasicPagination
        currentPage={pagination.page}
        totalPages={Math.ceil(pagination.total / pagination.pageSize)}
        onPageChange={(page) => dispatch(setPagination({ ...pagination, page }))}
      />
    </div>
  )
}
function JobListHeader({ onSearchChange, onStatusFilter, filters, disabled = false }) {
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    onSearchChange(searchInput)
  }
  const handleClearSearch = () => {
    setSearchInput('')
    onSearchChange('')
  }
  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    if (value === '') {
      onSearchChange('')
    }
  }
  React.useEffect(() => {
    setSearchInput(filters.search || '')
  }, [filters.search])
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search jobs..."
              value={searchInput}
              onChange={handleInputChange}
              className="pl-10"
              disabled={disabled}
            />
          </div>
          <Button type="submit" size="sm" disabled={disabled}>
            Search
          </Button>
        </form>
        <select 
          value={filters.status} 
          onChange={(e) => onStatusFilter(e.target.value)} 
          disabled={disabled}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white text-black [&>option]:bg-white [&>option]:text-black [&>option:hover]:bg-gray-100 [&>option:hover]:text-black [&>option:checked]:bg-black [&>option:checked]:text-white"
          style={{ accentColor: 'black' }}
        >
          <option value="all" className="bg-white text-black hover:bg-gray-100 hover:text-black">All Jobs</option>
          <option value="active" className="bg-white text-black hover:bg-gray-100 hover:text-black">Active</option>
          <option value="archived" className="bg-white text-black hover:bg-gray-100 hover:text-black">Archived</option>
        </select>
      </div>
      <CreateJobDialog>
        <Button disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </CreateJobDialog>
    </div>
  )
}
function JobCard({ job }) {
  const navigate = useNavigate()
  const handleClick = () => {
    navigate(`/jobs/${job.id}`)
  }
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={handleClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>{job.title}</span>
            <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
              {job.status}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-3">{job.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {job.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Created: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'No date'}
        </div>
      </CardContent>
    </Card>
  )
}
function BasicPagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  )
}
