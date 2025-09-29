import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { X } from 'lucide-react'
const jobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  company: z.string().min(1, 'Company is required').max(100, 'Company must be less than 100 characters'),
  location: z.string().min(1, 'Location is required'),
  type: z.string().min(1, 'Type is required'),
  salary: z.string().min(1, 'Salary is required'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is required'),
  benefits: z.array(z.string()).min(1, 'At least one benefit is required'),
  postedDate: z.string().min(1, 'Posted date is required'),
  applicationDeadline: z.string().min(1, 'Application deadline is required'),
  status: z.enum(['active', 'inactive', 'archived']).default('active')
})
export default function JobForm({ initialData, onSubmit, onCancel }) {
  const [requirementInput, setRequirementInput] = useState('')
  const [requirements, setRequirements] = useState(initialData?.requirements || [])
  const [benefitInput, setBenefitInput] = useState('')
  const [benefits, setBenefits] = useState(initialData?.benefits || [])
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: initialData?.title || '',
      company: initialData?.company || '',
      location: initialData?.location || '',
      type: initialData?.type || 'Full-time',
      salary: initialData?.salary || '',
      description: initialData?.description || '',
      requirements: initialData?.requirements || [],
      benefits: initialData?.benefits || [],
      postedDate: initialData?.postedDate || new Date().toISOString().split('T')[0],
      applicationDeadline: initialData?.applicationDeadline || '',
      status: initialData?.status || 'active'
    }
  })
  const watchTitle = watch('title')
  useEffect(() => {
    setValue('requirements', requirements)
  }, [requirements, setValue])
  useEffect(() => {
    setValue('benefits', benefits)
  }, [benefits, setValue])
  const addRequirement = (e) => {
    e.preventDefault()
    if (requirementInput.trim() && !requirements.includes(requirementInput.trim())) {
      setRequirements([...requirements, requirementInput.trim()])
      setRequirementInput('')
    }
  }
  const removeRequirement = (reqToRemove) => {
    setRequirements(requirements.filter(req => req !== reqToRemove))
  }
  const addBenefit = (e) => {
    e.preventDefault()
    if (benefitInput.trim() && !benefits.includes(benefitInput.trim())) {
      setBenefits([...benefits, benefitInput.trim()])
      setBenefitInput('')
    }
  }
  const removeBenefit = (benefitToRemove) => {
    setBenefits(benefits.filter(benefit => benefit !== benefitToRemove))
  }
  const onFormSubmit = (data) => {
    onSubmit({ ...data, requirements, benefits })
  }
  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="e.g. Senior React Developer"
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            {...register('company')}
            placeholder="e.g. TechCorp Inc."
          />
          {errors.company && (
            <p className="text-sm text-destructive">{errors.company.message}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            {...register('location')}
            placeholder="e.g. San Francisco, CA"
          />
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Job Type *</Label>
          <Input
            id="type"
            {...register('type')}
            placeholder="e.g. Full-time"
          />
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary">Salary *</Label>
          <Input
            id="salary"
            {...register('salary')}
            placeholder="e.g. $120,000 - $150,000"
          />
          {errors.salary && (
            <p className="text-sm text-destructive">{errors.salary.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe the role and responsibilities..."
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Requirements *</Label>
        <div className="flex gap-2">
          <Input
            value={requirementInput}
            onChange={(e) => setRequirementInput(e.target.value)}
            placeholder="Add a requirement..."
            onKeyPress={(e) => e.key === 'Enter' && addRequirement(e)}
          />
          <Button type="button" onClick={addRequirement} variant="outline">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {requirements.map((req, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {req}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeRequirement(req)}
              />
            </Badge>
          ))}
        </div>
        {errors.requirements && (
          <p className="text-sm text-destructive">{errors.requirements.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Benefits *</Label>
        <div className="flex gap-2">
          <Input
            value={benefitInput}
            onChange={(e) => setBenefitInput(e.target.value)}
            placeholder="Add a benefit..."
            onKeyPress={(e) => e.key === 'Enter' && addBenefit(e)}
          />
          <Button type="button" onClick={addBenefit} variant="outline">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {benefits.map((benefit, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {benefit}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeBenefit(benefit)}
              />
            </Badge>
          ))}
        </div>
        {errors.benefits && (
          <p className="text-sm text-destructive">{errors.benefits.message}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postedDate">Posted Date *</Label>
          <Input
            id="postedDate"
            type="date"
            {...register('postedDate')}
          />
          {errors.postedDate && (
            <p className="text-sm text-destructive">{errors.postedDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="applicationDeadline">Application Deadline *</Label>
          <Input
            id="applicationDeadline"
            type="date"
            {...register('applicationDeadline')}
          />
          {errors.applicationDeadline && (
            <p className="text-sm text-destructive">{errors.applicationDeadline.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <select
            id="status"
            {...register('status')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Job' : 'Create Job')}
        </Button>
      </div>
    </form>
  )
}
