import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { updateJob, deleteJob, fetchJobs } from '../../store/slices/jobsSlice'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Edit, X, Trash2 } from 'lucide-react'
export default function EditJobDialog({ job, children, onJobDeleted, onJobUpdated }) {
  const dispatch = useAppDispatch()
  const { filters, pagination } = useAppSelector(state => state.jobs)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary: '',
    tags: [],
    status: 'active'
  })
  const [tagInput, setTagInput] = useState('')
  useEffect(() => {
    if (job && open) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        requirements: Array.isArray(job.requirements) 
          ? job.requirements.join('\n') 
          : job.requirements || '',
        location: job.location || '',
        salary: job.salary || '',
        tags: job.tags || [],
        status: job.status || 'active'
      })
    }
  }, [job, open])
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !job?.id) return
    setLoading(true)
    try {
      const updateData = {
        id: job.id,
        ...formData,
        requirements: formData.requirements.split('\n').filter(req => req.trim()),
        slug: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }
      await dispatch(updateJob(updateData)).unwrap()
      dispatch(fetchJobs({
        search: filters.search,
        status: filters.status === 'all' ? undefined : filters.status,
        page: pagination.page,
        pageSize: pagination.pageSize
      }))
      setOpen(false)
      if (onJobUpdated) {
        onJobUpdated()
      }
    } catch (error) {
      console.error('Failed to update job:', error)
    } finally {
      setLoading(false)
    }
  }
  const handleDelete = async () => {
    if (!job?.id) return
    setDeleteLoading(true)
    try {
      await dispatch(deleteJob(job.id)).unwrap()
      dispatch(fetchJobs({
        search: filters.search,
        status: filters.status === 'all' ? undefined : filters.status,
        page: pagination.page,
        pageSize: pagination.pageSize
      }))
      setOpen(false)
      setShowDeleteConfirm(false)
      if (onJobDeleted) {
        onJobDeleted()
      }
    } catch (error) {
      console.error('Failed to delete job:', error)
    } finally {
      setDeleteLoading(false)
    }
  }
  const resetForm = () => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        requirements: Array.isArray(job.requirements) 
          ? job.requirements.join('\n') 
          : job.requirements || '',
        location: job.location || '',
        salary: job.salary || '',
        tags: job.tags || [],
        status: job.status || 'active'
      })
    }
    setTagInput('')
    setShowDeleteConfirm(false)
  }
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        resetForm()
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>
        {showDeleteConfirm ? (
          <div className="space-y-4">
            <div className="text-center py-6">
              <Trash2 className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Delete Job</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete "{job?.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Job'}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Job Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Senior Frontend Developer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Job description and responsibilities..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-requirements">Requirements (one per line)</Label>
              <Textarea
                id="edit-requirements"
                value={formData.requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="Bachelor's degree in Computer Science&#10;3+ years of React experience&#10;Experience with TypeScript"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Remote, New York, NY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salary">Salary Range</Label>
                <Input
                  id="edit-salary"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                  placeholder="e.g. $80k - $120k"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag and press Enter"
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white text-black"
                style={{ accentColor: 'black' }}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Job
              </Button>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !formData.title.trim()}>
                  {loading ? 'Updating...' : 'Update Job'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
