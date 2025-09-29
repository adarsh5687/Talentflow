import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { setFilters, setPagination } from '../../store/slices/candidatesSlice'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Search, List, Kanban, Filter, Users } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import VirtualizedCandidatesList from './VirtualizedCandidatesList'
import CandidatesKanban from './CandidatesKanban'
const stages = [
  { value: 'all', label: 'All Stages' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'technical', label: 'Technical' },
  { value: 'final', label: 'Final Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' }
]
const CandidatesHeader = ({ 
  onSearchChange, 
  onStageFilter, 
  onViewModeChange,
  filters, 
  viewMode,
  totalCandidates,
  filteredCount,
  disabled 
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || '')
  React.useEffect(() => {
    setSearchInput(filters.search || '')
  }, [filters.search])
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
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Candidates
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Showing {filteredCount} of {totalCandidates} candidates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              disabled={disabled}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('kanban')}
              disabled={disabled}
            >
              <Kanban className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search candidates by name or email..."
                value={searchInput}
                onChange={handleInputChange}
                className="pl-10"
                disabled={disabled}
              />
            </div>
            <Button type="submit" variant="outline" disabled={disabled}>
              Search
            </Button>
            {searchInput && (
              <Button type="button" variant="outline" onClick={handleClearSearch} disabled={disabled}>
                Clear
              </Button>
            )}
          </form>
          <Select 
            value={filters.stage || 'all'} 
            onValueChange={onStageFilter}
            disabled={disabled}
          >
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              {stages.map(stage => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
export default function CandidatesList({ candidates, loading }) {
  const dispatch = useAppDispatch()
  const { filters } = useAppSelector(state => state.candidates)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'kanban'
  const handleSearchChange = (search) => {
    dispatch(setFilters({ ...filters, search }))
  }
  const handleStageFilter = (stage) => {
    const stageValue = stage === 'all' ? '' : stage
    dispatch(setFilters({ ...filters, stage: stageValue }))
  }
  const handleViewModeChange = (mode) => {
    setViewMode(mode)
  }
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const matchesSearch = !filters.search || 
        candidate.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(filters.search.toLowerCase())
      const matchesStage = !filters.stage || candidate.stage === filters.stage
      return matchesSearch && matchesStage
    })
  }, [candidates, filters])
  return (
    <div className="space-y-6">
      <CandidatesHeader
        onSearchChange={handleSearchChange}
        onStageFilter={handleStageFilter}
        onViewModeChange={handleViewModeChange}
        filters={filters}
        viewMode={viewMode}
        totalCandidates={candidates.length}
        filteredCount={filteredCandidates.length}
        disabled={loading}
      />
      {viewMode === 'list' ? (
        <VirtualizedCandidatesList 
          candidates={filteredCandidates} 
          loading={loading} 
        />
      ) : (
        <CandidatesKanban 
          candidates={filteredCandidates} 
          loading={loading} 
        />
      )}
    </div>
  )
}
