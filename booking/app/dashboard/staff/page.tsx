'use client'

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { staffApi, servicesApi, Staff, Service } from '@/lib/api'
import {
  Loader,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  User,
  Phone,
  Mail,
  Clock,
  Calendar,
  X,
  Zap,
  Copy,
  Link,
  Building2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useBusinessId } from '@/hooks/useBusinessId'
import { useSubscriptionUsage } from '@/hooks/useSubscriptionUsage'
import { useBranches } from '@/context/branchContext' // adjust path

const today = new Date().toISOString().split('T')[0]
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const DEFAULT_WORKING_HOURS = DAYS.reduce(
  (acc, day) => ({
    ...acc,
    [day]: { start: '09:00', end: '17:00', isWorking: day !== 'sunday' },
  }),
  {} as Record<string, { start: string; end: string; isWorking: boolean }>
)

interface StaffFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  branchId: string
  workingHours: Record<string, { start: string; end: string; isWorking: boolean }>
  breakTimes: { start: string; end: string }[]
  serviceIds: string[]
}

const initialFormData: StaffFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'Staff',
  branchId: '',
  workingHours: DEFAULT_WORKING_HOURS,
  breakTimes: [],
  serviceIds: [],
}

type StaffGroup = { id: string; name: string; isMain: boolean; members: Staff[] }

export default function StaffPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const { usage: subscriptionUsage, refetch: refetchUsage } = useSubscriptionUsage(businessId)
  const {
    branches,
    hasMultipleBranches,
    branchParam,
    loading: branchesLoading,
  } = useBranches()

  const [staffMembers, setStaffMembers] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState<StaffFormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showTimeOffModal, setShowTimeOffModal] = useState(false)
  const [selectedStaffForTimeOff, setSelectedStaffForTimeOff] = useState<Staff | null>(null)
  const [timeOffFormData, setTimeOffFormData] = useState({ startDate: '', endDate: '', type: 'VACATION', reason: '' })
  const [timeOffSaving, setTimeOffSaving] = useState(false)

  const mainBranch = branches.find((b: { isMain: any }) => b.isMain) || branches[0]
  const currentBranch = branchParam ? branches.find((b: { id: any }) => b.id === branchParam) : undefined

  const getBranchName = (staff: Staff) =>
    staff.branch?.name || branches.find((b: { id: string | null | undefined }) => b.id === staff.branchId)?.name || null

  // ---------- Data loading ----------
  useEffect(() => {
    if (businessId) loadServices()
  }, [businessId])

  // Reload staff whenever the selected branch changes (waits for branches so we don't fetch twice)
  useEffect(() => {
    if (businessId && !branchesLoading) loadStaff()
  }, [businessId, branchesLoading, branchParam])

  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  const loadStaff = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      const response = await staffApi.getBusinessStaff(businessId, true, branchParam)
      if (response.data?.staff) {
        setStaffMembers(response.data.staff)
      } else {
        setStaffMembers([])
      }
      setError(null)
    } catch (err) {
      setError('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    if (!businessId) return
    try {
      const response = await servicesApi.getBusinessServices(businessId)
      const rawData = response as any

      // API may return either an array or nested structure: { data: { data: Array } }
      const servicesArray = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData.data)
          ? rawData.data
          : Array.isArray(rawData.data?.data)
            ? rawData.data.data
            : []

      const servicesData = servicesArray.map((service: any) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        offerPrice: service.offerPrice,
        duration: service.duration,
        isActive: service.isActive ?? true,
        capacity: service.capacity ?? 1,
      }))

      setServices(servicesData)
    } catch (err: any) {
      setError(`Failed to load services: ${err?.message || 'Unknown error'}`)
    }
  }

  // ---------- Modal open/close ----------
  const openAddModal = () => {
    setEditingStaff(null)
    // Default to the branch currently being viewed, otherwise the main branch
    setFormData({ ...initialFormData, branchId: branchParam ?? mainBranch?.id ?? '' })
    setFormError(null)
    setCurrentStep(1)
    setIsModalOpen(true)
  }

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff)
    setFormData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email || '',
      phone: staff.phone || '',
      role: staff.role,
      branchId: staff.branchId || mainBranch?.id || '',
      workingHours: staff.workingHours || DEFAULT_WORKING_HOURS,
      breakTimes: staff.breakTimes || [],
      serviceIds: staff.services?.map((s) => s.serviceId) || [],
    })
    setFormError(null)
    setCurrentStep(1)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormError(null)
  }

  // ---------- Submit / delete / toggle ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Pressing Enter on steps 1-3 should advance, not submit
    if (currentStep < 4) {
      goToNextStep()
      return
    }
    if (!businessId || isSubmitting) return

    try {
      setIsSubmitting(true)
      setSaving(true)
      setFormError(null)

      const payload = { ...formData, branchId: formData.branchId || undefined }
      const response = editingStaff
        ? await staffApi.update(editingStaff.id, payload)
        : await staffApi.create({ ...payload, businessId })

      if (!response.success) {
        setFormError(response.error || 'Failed to save staff member')
        return
      }

      closeModal()
      setCurrentStep(1)
      await Promise.all([loadStaff(), refetchUsage()])
    } catch (err) {
      setFormError('Failed to save staff member')
    } finally {
      setSaving(false)
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      const response = await staffApi.delete(staffId)

      if (!response.success || response.error) {
        setError(response.error || 'Failed to delete staff member')
        return
      }

      setError(null)
      await Promise.all([loadStaff(), refetchUsage()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff member')
    }
  }

  const handleToggleStatus = async (staffId: string) => {
    try {
      const response = await staffApi.toggleStatus(staffId)

      if (!response.success || response.error) {
        setError(response.error || 'Failed to toggle staff status')
        return
      }

      setError(null)
      await Promise.all([loadStaff(), refetchUsage()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle staff status')
    }
  }

  const copyBookingLink = (staffCode: string, staffName: string) => {
    const normalizedStaffCode = staffCode?.trim()
    if (!normalizedStaffCode) {
      toast({ title: 'Failed to copy', description: 'No booking code available', variant: 'destructive' })
      return
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const bookingLink = `${baseUrl}/staff/${normalizedStaffCode}/book`

    navigator.clipboard
      .writeText(bookingLink)
      .then(() => {
        toast({ title: 'Copied!', description: `Booking link for ${staffName} copied to clipboard` })
      })
      .catch(() => {
        toast({ title: 'Failed to copy', description: 'Could not copy link to clipboard', variant: 'destructive' })
      })
  }

  // ---------- Form helpers ----------
  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }))
  }

  const toggleDayWorking = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { ...prev.workingHours[day], isWorking: !prev.workingHours[day].isWorking },
      },
    }))
  }

  const updateDayHours = (day: string, field: 'start' | 'end', value: string) => {
    setFormData((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { ...prev.workingHours[day], [field]: value },
      },
    }))
  }

  const addBreakTime = () => {
    setFormData((prev) => ({
      ...prev,
      breakTimes: [...prev.breakTimes, { start: '12:00', end: '13:00' }],
    }))
  }

  const removeBreakTime = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      breakTimes: prev.breakTimes.filter((_, i) => i !== index),
    }))
  }

  const updateBreakTime = (index: number, field: 'start' | 'end', value: string) => {
    setFormData((prev) => ({
      ...prev,
      breakTimes: prev.breakTimes.map((bt, i) => (i === index ? { ...bt, [field]: value } : bt)),
    }))
  }

  // ---------- Step validation ----------
  const isStep1Valid = () =>
    !!formData.firstName.trim() &&
    !!formData.lastName.trim() &&
    !!formData.email.trim() &&
    (!hasMultipleBranches || !!formData.branchId)
  const isStep2Valid = () => formData.serviceIds.length > 0
  const isStep3Valid = () => true // Schedule is optional

  const canProceedToNext = () => {
    if (currentStep === 1) return isStep1Valid()
    if (currentStep === 2) return isStep2Valid()
    if (currentStep === 3) return isStep3Valid()
    return true
  }

  const goToNextStep = () => {
    if (canProceedToNext() && currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const saveTimeOff = async () => {
    if (!selectedStaffForTimeOff || !timeOffFormData.startDate || !timeOffFormData.endDate) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' })
      return
    }

    if (new Date(timeOffFormData.startDate) > new Date(timeOffFormData.endDate)) {
      toast({ title: 'Error', description: 'End date must be after start date', variant: 'destructive' })
      return
    }

    try {
      setTimeOffSaving(true)
      const response = await staffApi.addTimeOff(selectedStaffForTimeOff.id, {
        startDate: timeOffFormData.startDate,
        endDate: timeOffFormData.endDate,
        type: timeOffFormData.type,
        reason: timeOffFormData.reason,
      })

      if (!response.success) throw new Error('Failed to save time off')

      toast({ title: 'Success', description: 'Time off added successfully' })
      setShowTimeOffModal(false)
      setSelectedStaffForTimeOff(null)
      setTimeOffFormData({ startDate: '', endDate: '', type: 'VACATION', reason: '' })
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add time off', variant: 'destructive' })
    } finally {
      setTimeOffSaving(false)
    }
  }

  // ---------- Grouping (only when viewing "All branches" on a multi-branch business) ----------
  const groupedStaff = useMemo<StaffGroup[] | null>(() => {
    if (!hasMultipleBranches || branchParam) return null

    const groups: StaffGroup[] = branches
      .map((b: { id: string | null | undefined; name: any; isMain: any }) => ({
        id: b.id,
        name: b.name,
        isMain: b.isMain,
        members: staffMembers.filter((s) => s.branchId === b.id),
      }))
      .filter((g): g is StaffGroup => typeof g.id === 'string' && g.members.length > 0)

    const unassigned = staffMembers.filter(
      (s) => !s.branchId || !branches.some((b: { id: string | null | undefined }) => b.id === s.branchId)
    )
    if (unassigned.length > 0) {
      groups.push({ id: 'unassigned', name: 'Unassigned', isMain: false, members: unassigned })
    }
    return groups
  }, [hasMultipleBranches, branchParam, branches, staffMembers])

  // ---------- Staff card ----------
  const renderStaffCard = (staff: Staff) => {
    const branchName = hasMultipleBranches ? getBranchName(staff) : null

    return (
      <Card key={staff.id} className={!staff.isActive ? 'opacity-60' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {staff.avatar ? (
                  <img src={staff.avatar} alt={staff.firstName} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {staff.firstName} {staff.lastName}
                </CardTitle>
                <CardDescription>{staff.role}</CardDescription>
              </div>
            </div>
            <Badge variant={staff.isActive ? 'default' : 'secondary'}>
              {staff.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {branchName && (
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Building2 className="w-4 h-4 text-primary" />
                {branchName}
              </div>
            )}
            {staff.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                {staff.email}
              </div>
            )}
            {staff.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                {staff.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {staff._count?.bookings || 0} bookings
            </div>
          </div>

          {/* Services */}
          {staff.services && staff.services.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Services:</p>
              <div className="flex flex-wrap gap-1">
                {staff.services.slice(0, 3).map((s) => (
                  <Badge key={s.id} variant="outline" className="text-xs">
                    {s.service?.name}
                  </Badge>
                ))}
                {staff.services.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{staff.services.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Booking Link Info */}
          {staff.staffCode && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Booking Link:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => copyBookingLink(String(staff.staffCode), String(staff.firstName))}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/staff/${staff.staffCode}/bookings`)}
                >
                  <Link className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={staff.isActive} onCheckedChange={() => handleToggleStatus(staff.id)} />
              <span className="text-xs text-muted-foreground">{staff.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedStaffForTimeOff(staff)
                  setTimeOffFormData({ startDate: '', endDate: '', type: 'VACATION', reason: '' })
                  setShowTimeOffModal(true)
                }}
                title="Manage time off"
              >
                <Calendar className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openEditModal(staff)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(staff.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const gridClass = 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'

  // ---------- Render ----------
  if (fetchingBusinessId) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar userRole="BUSINESS_OWNER" />
        <main className="md:ml-64 pt-6 px-4 md:px-8 py-8 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="BUSINESS_OWNER" />
      <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Staff Management' },
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
              <p className="text-muted-foreground">Manage your team members and their schedules</p>
              {hasMultipleBranches && (
                <Badge variant="outline" className="mt-2 gap-1">
                  <Building2 className="w-3 h-3" />
                  {currentBranch ? currentBranch.name : 'All branches'}
                </Badge>
              )}
            </div>
            <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </div>
        </div>

        {/* Usage Stats */}
        {subscriptionUsage && (
          <Card className="border mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Staff Members{hasMultipleBranches ? ' (all branches)' : ''}
                  </p>
                  <p className="text-2xl font-bold">
                    {subscriptionUsage.staffUnlimited ? '∞' : subscriptionUsage.staffCurrent}
                  </p>
                </div>
                {!subscriptionUsage.staffUnlimited && subscriptionUsage.staffUsagePercent >= 80 && (
                  <Button size="sm" onClick={() => router.push('/subscription')} className="gap-1 h-8">
                    <Zap className="w-3 h-3" />
                    <span className="text-xs">Upgrade</span>
                  </Button>
                )}
              </div>
              {!subscriptionUsage.staffUnlimited && (
                <>
                  <p className="text-xs text-muted-foreground mb-2">
                    {subscriptionUsage.staffCurrent} of {subscriptionUsage.staffLimit}
                    {hasMultipleBranches ? ' · limit is shared across branches' : ''}
                  </p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        subscriptionUsage.staffUsagePercent >= 100
                          ? 'bg-destructive'
                          : subscriptionUsage.staffUsagePercent >= 80
                            ? 'bg-amber-500'
                            : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(subscriptionUsage.staffUsagePercent, 100)}%` }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Staff list */}
        {loading || branchesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : staffMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {currentBranch ? `No staff in ${currentBranch.name}` : 'No Staff Members'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {currentBranch
                  ? 'Add a staff member to this branch to get started'
                  : 'Add your first staff member to get started'}
              </p>
              <Button onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </CardContent>
          </Card>
        ) : groupedStaff ? (
          <div className="space-y-8">
            {groupedStaff.map((group) => (
              <section key={group.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h2 className="text-lg font-semibold">{group.name}</h2>
                  {group.isMain && <Badge variant="secondary" className="text-xs">Main</Badge>}
                  <span className="text-sm text-muted-foreground">
                    {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
                <div className={gridClass}>{group.members.map(renderStaffCard)}</div>
              </section>
            ))}
          </div>
        ) : (
          <div className={gridClass}>{staffMembers.map(renderStaffCard)}</div>
        )}

        {/* Step-by-Step Wizard Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Step {currentStep} of 4</p>
                </div>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="px-4 pt-4 flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      step <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              {formError && (
                <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <form id="staff-form" onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-6">
                {/* STEP 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                      <p className="text-sm text-muted-foreground mb-6">Tell us about the staff member</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                        placeholder="e.g., Staff, Senior Stylist, Manager"
                      />
                    </div>

                    {/* Branch — only for businesses with 2+ branches */}
                    {hasMultipleBranches && (
                      <div>
                        <Label htmlFor="branch">Branch *</Label>
                        <div className="relative mt-1">
                          <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select
                            id="branch"
                            value={formData.branchId}
                            onChange={(e) => setFormData((prev) => ({ ...prev, branchId: e.target.value }))}
                            className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm bg-background"
                            required
                          >
                            <option value="" disabled>
                              Select a branch
                            </option>
                            {branches
                              .filter((b: { isActive: any }) => b.isActive)
                              .map((b: { id: string | number | bigint | null | undefined; name: string; isMain: boolean }) => {
                                const branchId = String(b.id ?? '')
                                return (
                                  <option key={branchId} value={branchId}>
                                    {b.name}
                                    {b.isMain ? ' (Main)' : ''}
                                  </option>
                                )
                              })}
                          </select>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Customers will book this person at this branch, within its opening hours.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: Services */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Services</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Select the services this staff member can perform
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto border rounded-lg p-3">
                      {services.map((service) => (
                        <div key={service.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`service-${service.id}`}
                            checked={formData.serviceIds.includes(service.id)}
                            onCheckedChange={() => toggleService(service.id)}
                          />
                          <Label htmlFor={`service-${service.id}`} className="text-sm cursor-pointer">
                            {service.name}
                          </Label>
                        </div>
                      ))}
                      {services.length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-2">No services available</p>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: Working Hours and Break Times */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Schedule & Working Hours
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Set the working hours and break times
                        {hasMultipleBranches && ' (bookings are also limited by the branch opening hours)'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {DAYS.map((day) => (
                        <div
                          key={day}
                          className="flex flex-col gap-3 p-3 border rounded-lg sm:flex-row sm:items-center sm:gap-4 sm:p-2"
                        >
                          <div className="flex items-center gap-2 sm:w-32 shrink-0">
                            <Checkbox
                              id={`day-${day}`}
                              checked={formData.workingHours[day]?.isWorking}
                              onCheckedChange={() => toggleDayWorking(day)}
                            />
                            <Label htmlFor={`day-${day}`} className="text-sm cursor-pointer">
                              {DAY_LABELS[day]}
                            </Label>
                          </div>
                          {formData.workingHours[day]?.isWorking ? (
                            <div className="flex items-center gap-2 pl-6 sm:pl-0 sm:flex-1">
                              <Input
                                type="time"
                                value={formData.workingHours[day]?.start || '09:00'}
                                onChange={(e) => updateDayHours(day, 'start', e.target.value)}
                                className="w-full min-w-0 flex-1 sm:w-28 sm:flex-none"
                              />
                              <span className="text-muted-foreground text-sm shrink-0">to</span>
                              <Input
                                type="time"
                                value={formData.workingHours[day]?.end || '17:00'}
                                onChange={(e) => updateDayHours(day, 'end', e.target.value)}
                                className="w-full min-w-0 flex-1 sm:w-28 sm:flex-none"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground pl-6 sm:pl-0">Day off</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Break times step is disabled for now. addBreakTime / removeBreakTime / updateBreakTime are kept for when it returns. */}

                {/* STEP 4: Review & Confirm */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Review Information</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Please review the information before confirming
                      </p>
                    </div>

                    <div className="space-y-4 bg-muted/30 rounded-lg p-4">
                      {/* Basic Info Review */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Basic Information</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">Name:</span> {formData.firstName}{' '}
                            {formData.lastName}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Role:</span> {formData.role}
                          </p>
                          {hasMultipleBranches && formData.branchId && (
                            <p>
                              <span className="text-muted-foreground">Branch:</span>{' '}
                              {branches.find((b: { id: string }) => b.id === formData.branchId)?.name}
                            </p>
                          )}
                          {formData.email && (
                            <p>
                              <span className="text-muted-foreground">Email:</span> {formData.email}
                            </p>
                          )}
                          {formData.phone && (
                            <p>
                              <span className="text-muted-foreground">Phone:</span> {formData.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Services Review */}
                      <div className="pt-3 border-t">
                        <h4 className="font-medium text-sm mb-2">Services ({formData.serviceIds.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {formData.serviceIds.map((serviceId) => {
                            const service = services.find((s) => s.id === serviceId)
                            return service ? (
                              <Badge key={serviceId} variant="secondary">
                                {service.name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>

                      {/* Schedule Review */}
                      <div className="pt-3 border-t">
                        <h4 className="font-medium text-sm mb-2">Working Schedule</h4>
                        <div className="text-sm space-y-1">
                          {DAYS.map((day) => {
                            const hours = formData.workingHours[day]
                            return hours?.isWorking ? (
                              <p key={day}>
                                <span className="text-muted-foreground">{DAY_LABELS[day]}:</span> {hours.start} -{' '}
                                {hours.end}
                              </p>
                            ) : (
                              <p key={day}>
                                <span className="text-muted-foreground">{DAY_LABELS[day]}:</span>{' '}
                                <span className="text-xs">Day off</span>
                              </p>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
                      <p>
                        ✓ All information looks good. Click <span className="font-medium">Add Staff</span> to{' '}
                        {editingStaff ? 'update' : 'add'} this staff member.
                      </p>
                    </div>
                  </div>
                )}
              </form>

              {/* Navigation Actions */}
              <div className="border-t bg-muted/30 p-4 flex justify-between gap-3">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancel
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  {currentStep < 4 ? (
                    <Button type="button" onClick={goToNextStep} disabled={!canProceedToNext()}>
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      form="staff-form"
                      disabled={saving || isSubmitting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : editingStaff ? (
                        'Update Staff'
                      ) : (
                        'Add Staff'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Off Modal */}
        {showTimeOffModal && selectedStaffForTimeOff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Add Time Off</CardTitle>
                  <CardDescription>
                    {selectedStaffForTimeOff.firstName} {selectedStaffForTimeOff.lastName}
                    {hasMultipleBranches && getBranchName(selectedStaffForTimeOff)
                      ? ` · ${getBranchName(selectedStaffForTimeOff)}`
                      : ''}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowTimeOffModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={timeOffFormData.startDate}
                    onChange={(e) => setTimeOffFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1"
                    min={today}
                  />
                </div>

                <div>
                  <Label htmlFor="end-date" className="text-sm">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={timeOffFormData.endDate}
                    onChange={(e) => setTimeOffFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1"
                    min={timeOffFormData.startDate}
                  />
                </div>

                <div>
                  <Label htmlFor="type" className="text-sm">Type</Label>
                  <select
                    id="type"
                    value={timeOffFormData.type}
                    onChange={(e) => setTimeOffFormData((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm mt-1"
                  >
                    <option value="VACATION">Vacation</option>
                    <option value="SICK_LEAVE">Sick Leave</option>
                    <option value="BREAK">Break</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="reason" className="text-sm">Reason (Optional)</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., Holiday, Personal"
                    value={timeOffFormData.reason}
                    onChange={(e) => setTimeOffFormData((prev) => ({ ...prev, reason: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowTimeOffModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={saveTimeOff} disabled={timeOffSaving} className="flex-1">
                    {timeOffSaving ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Add Time Off'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}