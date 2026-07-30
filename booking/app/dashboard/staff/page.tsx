'use client'

import { useEffect, useState } from 'react'
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
  Link
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useBusinessId } from '@/hooks/useBusinessId'
import { useSubscriptionUsage } from '@/hooks/useSusbcriptionUsage'

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

const DEFAULT_WORKING_HOURS = DAYS.reduce((acc, day) => ({
  ...acc,
  [day]: { start: '09:00', end: '17:00', isWorking: day !== 'sunday' }
}), {} as Record<string, { start: string; end: string; isWorking: boolean }>)

interface StaffFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  workingHours: Record<string, { start: string; end: string; isWorking: boolean }>
  breakTimes: { start: string; end: string }[]
  serviceIds: string[]
  timeOffs?: Array<{ id?: string; startDate: string; endDate: string; reason?: string; type?: string }>
}

const initialFormData: StaffFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'Staff',
  workingHours: DEFAULT_WORKING_HOURS,
  breakTimes: [],
  serviceIds: [],
  timeOffs: [],
}

export default function StaffPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const { usage: subscriptionUsage } = useSubscriptionUsage(businessId)
  const [staffMembers, setStaffMembers] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState<StaffFormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Time off management
  const [newTimeOffStart, setNewTimeOffStart] = useState('')
  const [newTimeOffEnd, setNewTimeOffEnd] = useState('')
  const [newTimeOffReason, setNewTimeOffReason] = useState('')
  const [newTimeOffType, setNewTimeOffType] = useState('VACATION')

  useEffect(() => {
    if (businessId) {
      loadStaff()
      loadServices()
    }
  }, [businessId])

  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  const loadStaff = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      const response = await staffApi.getBusinessStaff(businessId, true)
      if (response.data?.staff) {
        setStaffMembers(response.data.staff)
      }
      setError(null)
    } catch (err) {
      setError('Failed to load staff members')
      console.error('[Staff] Error loading staff:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    if (!businessId) return
    try {
      const response = await servicesApi.getBusinessServices(businessId)
      
      // Handle various response formats
      let servicesArray: any[] = []
      if (response) {
        if (Array.isArray(response.data)) {
          servicesArray = response.data
        } else if (Array.isArray(response)) {
          servicesArray = response
        }
      }
      
      setServices(servicesArray)
    } catch (err: any) {
      console.error('[Staff] Error loading services:', err?.message || err)
      // Services load failed, but page can still function with subscription data
      setServices([])
    }
  }

  const openAddModal = () => {
    setEditingStaff(null)
    setFormData(initialFormData)
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
      workingHours: staff.workingHours || DEFAULT_WORKING_HOURS,
      breakTimes: staff.breakTimes || [],
      serviceIds: staff.services?.map(s => s.service.id) || [],
    })
    setCurrentStep(1)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId || isSubmitting) return

    try {
      setIsSubmitting(true)
      setSaving(true)
      
      let staffId: string
      if (editingStaff) {
        await staffApi.update(editingStaff.id, formData)
        staffId = editingStaff.id
      } else {
        const response = await staffApi.create({ ...formData, businessId })
        staffId = response.data?.staff.id || response.id
      }

      // Save time off periods if any
      if (formData.timeOffs && formData.timeOffs.length > 0 && staffId) {
        await Promise.all(
          formData.timeOffs.map(timeOff =>
            fetch(`/api/staff/${staffId}/time-off`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                startDate: timeOff.startDate,
                endDate: timeOff.endDate,
                reason: timeOff.reason,
                type: timeOff.type,
              })
            })
          )
        )
      }

      setIsModalOpen(false)
      setCurrentStep(1)
      loadStaff()
    } catch (err) {
      console.error('[Staff] Error saving staff:', err)
      setError('Failed to save staff member')
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
        console.error('[Staff] Delete error:', response.error)
        return
      }

      setError(null)
      await loadStaff()
    } catch (err) {
      console.error('[Staff] Error deleting staff:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete staff member')
    }
  }

  const handleToggleStatus = async (staffId: string) => {
    try {
      const response = await staffApi.toggleStatus(staffId)
      
      if (!response.success || response.error) {
        setError(response.error || 'Failed to toggle staff status')
        console.error('[Staff] Toggle error:', response.error)
        return
      }

      setError(null)
      await loadStaff()
    } catch (err) {
      console.error('[Staff] Error toggling status:', err)
      setError(err instanceof Error ? err.message : 'Failed to toggle staff status')
    }
  }

  const copyBookingLink = (staffCode: string, staffName: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const bookingLink = `${baseUrl}/staff/${staffCode}/book`
    
    navigator.clipboard.writeText(bookingLink).then(() => {
      toast({
        title: 'Copied!',
        description: `Booking link for ${staffName} copied to clipboard`,
      })
    }).catch(() => {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard',
        variant: 'destructive',
      })
    })
  }

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }))
  }

  const toggleDayWorking = (day: string) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { ...prev.workingHours[day], isWorking: !prev.workingHours[day].isWorking }
      }
    }))
  }

  const updateDayHours = (day: string, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { ...prev.workingHours[day], [field]: value }
      }
    }))
  }

  const addBreakTime = () => {
    setFormData(prev => ({
      ...prev,
      breakTimes: [...prev.breakTimes, { start: '12:00', end: '13:00' }]
    }))
  }

  const removeBreakTime = (index: number) => {
    setFormData(prev => ({
      ...prev,
      breakTimes: prev.breakTimes.filter((_, i) => i !== index)
    }))
  }

  const updateBreakTime = (index: number, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      breakTimes: prev.breakTimes.map((bt, i) => i === index ? { ...bt, [field]: value } : bt)
    }))
  }

  const addTimeOff = () => {
    if (!newTimeOffStart || !newTimeOffEnd) {
      setError('Please fill in all time off fields')
      return
    }

    if (new Date(newTimeOffStart) > new Date(newTimeOffEnd)) {
      setError('End date must be after or equal to start date')
      return
    }

    // Create a single time off entry that covers the entire range
    setFormData(prev => ({
      ...prev,
      timeOffs: [...(prev.timeOffs || []), {
        startDate: newTimeOffStart,
        endDate: newTimeOffEnd,
        reason: newTimeOffReason,
        type: newTimeOffType
      }]
    }))

    setNewTimeOffStart('')
    setNewTimeOffEnd('')
    setNewTimeOffReason('')
    setNewTimeOffType('VACATION')
    setError(null)
  }

  const removeTimeOff = (index: number) => {
    setFormData(prev => ({
      ...prev,
      timeOffs: (prev.timeOffs || []).filter((_, i) => i !== index)
    }))
  }

  // Validation functions for each step
  const isStep1Valid = () => formData.firstName.trim() && formData.lastName.trim()
  const isStep2Valid = () => formData.serviceIds.length > 0
  const isStep3Valid = () => true // Schedule is optional
  const isStep4Valid = () => true // Time off is optional
  const isStep5Valid = () => true // Review step

  const canProceedToNext = () => {
    if (currentStep === 1) return isStep1Valid()
    if (currentStep === 2) return isStep2Valid()
    if (currentStep === 3) return isStep3Valid()
    if (currentStep === 4) return isStep4Valid()
    return true
  }

  const goToNextStep = () => {
    if (canProceedToNext() && currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (fetchingBusinessId || loading) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
              <p className="text-muted-foreground">Manage your team members and their schedules</p>
            </div>
            <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </div>
        </div>

        {/* Subscription Usage Card */}
        {subscriptionUsage && (
          <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Staff Limit</CardTitle>
                  <CardDescription className="mt-1">
                    {subscriptionUsage.staffUnlimited ? 'Unlimited staff' : `${subscriptionUsage.staffCurrent} of ${subscriptionUsage.staffLimit} staff members`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {!subscriptionUsage.staffUnlimited && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{subscriptionUsage.staffCurrent}/{subscriptionUsage.staffLimit}</p>
                      <p className="text-xs text-muted-foreground">{subscriptionUsage.staffUsagePercent}% used</p>
                    </div>
                  )}
                  {!subscriptionUsage.staffUnlimited && subscriptionUsage.staffUsagePercent >= 80 && (
                    <Button size="sm" variant="outline" onClick={() => router.push('/subscription')}>
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {!subscriptionUsage.staffUnlimited && (
              <CardContent>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      subscriptionUsage.staffUsagePercent >= 100
                        ? 'bg-destructive'
                        : subscriptionUsage.staffUsagePercent >= 80
                        ? 'bg-yellow-500'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(subscriptionUsage.staffUsagePercent, 100)}%` }}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Services Usage Card */}
        {subscriptionUsage && (
          <Card className="mb-8 bg-gradient-to-br from-green-50 to-green-50/50 border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Services Available</CardTitle>
                  <CardDescription className="mt-1">
                    {subscriptionUsage.serviceUnlimited ? 'Unlimited services' : `${subscriptionUsage.serviceCurrent} service available`}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{subscriptionUsage.serviceCurrent}</p>
                  <p className="text-xs text-muted-foreground">Service{subscriptionUsage.serviceCurrent !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Staff Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {staffMembers.map((staff) => (
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
                        <CardTitle className="text-lg">{staff.firstName} {staff.lastName}</CardTitle>
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
                            {s.service.name}
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
                          onClick={() => copyBookingLink(staff.staffcode as string, staff.firstName)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Link
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/staff/${staff.staffcode}/bookings`)}
                
                        >
                          <Link className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={staff.isActive}
                        onCheckedChange={() => handleToggleStatus(staff.id)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(staff)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(staff.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {staffMembers.length === 0 && !loading && (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Staff Members</h3>
                  <p className="text-muted-foreground mb-4">Add your first staff member to get started</p>
                  <Button onClick={openAddModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

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
                  <p className="text-xs text-muted-foreground mt-1">Step {currentStep} of 5</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="px-4 pt-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      step <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-6">
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
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="e.g., Staff, Senior Stylist, Manager"
                    />
                  </div>
                </div>
                )}

                {/* STEP 2: Services */}
                {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Services</h3>
                    <p className="text-sm text-muted-foreground mb-6">Select the services this staff member can perform</p>
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
                    <p className="text-sm text-muted-foreground mb-6">Set the working hours and break times</p>
                  </div>
                  <div className="space-y-2">
                    {DAYS.map((day) => (
                      <div key={day} className="flex items-center gap-4 p-2 border rounded-lg">
                        <div className="flex items-center gap-2 w-32">
                          <Checkbox
                            id={`day-${day}`}
                            checked={formData.workingHours[day]?.isWorking}
                            onCheckedChange={() => toggleDayWorking(day)}
                          />
                          <Label htmlFor={`day-${day}`} className="text-sm cursor-pointer">
                            {DAY_LABELS[day]}
                          </Label>
                        </div>
                        {formData.workingHours[day]?.isWorking && (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="time"
                              value={formData.workingHours[day]?.start || '09:00'}
                              onChange={(e) => updateDayHours(day, 'start', e.target.value)}
                              className="w-28"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={formData.workingHours[day]?.end || '17:00'}
                              onChange={(e) => updateDayHours(day, 'end', e.target.value)}
                              className="w-28"
                            />
                          </div>
                        )}
                        {!formData.workingHours[day]?.isWorking && (
                          <span className="text-sm text-muted-foreground">Day off</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {currentStep === 3 && (

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Break Times</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addBreakTime}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Break
                    </Button>
                  </div>
                  {formData.breakTimes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No break times set</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.breakTimes.map((bt, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={bt.start}
                            onChange={(e) => updateBreakTime(index, 'start', e.target.value)}
                            className="w-28"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={bt.end}
                            onChange={(e) => updateBreakTime(index, 'end', e.target.value)}
                            className="w-28"
                          />
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeBreakTime(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )}

                {/* STEP 4: Time Off */}
                {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Time Off</h3>
                    <p className="text-sm text-muted-foreground mb-6">Add scheduled time off periods when this staff member is unavailable. (Optional)</p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-900 dark:text-blue-100">
                      Staff on time off will not appear as available for new bookings during the specified dates.
                    </p>
                  </div>

                  {/* Add Time Off Form */}
                  <div className="space-y-3 p-4 border border-dashed rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="timeoff-start" className="text-sm">Start Date</Label>
                        <Input
                          id="timeoff-start"
                          type="date"
                          value={newTimeOffStart}
                          onChange={(e) => setNewTimeOffStart(e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeoff-end" className="text-sm">End Date</Label>
                        <Input
                          id="timeoff-end"
                          type="date"
                          value={newTimeOffEnd}
                          onChange={(e) => setNewTimeOffEnd(e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="timeoff-type" className="text-sm">Type</Label>
                        <select 
                          id="timeoff-type"
                          value={newTimeOffType}
                          onChange={(e) => setNewTimeOffType(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md text-sm"
                        >
                          <option value="VACATION">Vacation</option>
                          <option value="SICK_LEAVE">Sick Leave</option>
                          <option value="BREAK">Break</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="timeoff-reason" className="text-sm">Reason (Optional)</Label>
                        <Input
                          id="timeoff-reason"
                          placeholder="e.g., Holiday, Personal"
                          value={newTimeOffReason}
                          onChange={(e) => setNewTimeOffReason(e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                    </div>
                    <Button 
                      type="button"
                      onClick={addTimeOff}
                      className="w-full"
                      size="sm"
                    >
                      Add Time Off
                    </Button>
                  </div>

                  {/* Time Off List */}
                  {formData.timeOffs && formData.timeOffs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {formData.timeOffs.length} time off period{formData.timeOffs.length !== 1 ? 's' : ''}
                      </p>
                      {formData.timeOffs.map((timeOff, index) => {
                        const startDate = new Date(timeOff.startDate)
                        const endDate = new Date(timeOff.endDate)
                        const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        
                        return (
                          <div key={index} className="p-3 bg-card border border-border rounded-lg flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{timeOff.startDate} to {timeOff.endDate}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {timeOff.type || 'VACATION'} • {days} day{days !== 1 ? 's' : ''}{timeOff.reason ? ` - ${timeOff.reason}` : ''}
                              </p>
                            </div>
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeTimeOff(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                )}

                {/* STEP 5: Review & Confirm */}
                {currentStep === 5 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Review Information</h3>
                    <p className="text-sm text-muted-foreground mb-6">Please review the information before confirming</p>
                  </div>

                  <div className="space-y-4 bg-muted/30 rounded-lg p-4">
                    {/* Basic Info Review */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Basic Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> {formData.firstName} {formData.lastName}</p>
                        <p><span className="text-muted-foreground">Role:</span> {formData.role}</p>
                        {formData.email && <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>}
                        {formData.phone && <p><span className="text-muted-foreground">Phone:</span> {formData.phone}</p>}
                      </div>
                    </div>

                    {/* Services Review */}
                    <div className="pt-3 border-t">
                      <h4 className="font-medium text-sm mb-2">Services ({formData.serviceIds.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.serviceIds.map(serviceId => {
                          const service = services.find(s => s.id === serviceId)
                          return service ? (
                            <Badge key={serviceId} variant="secondary">{service.name}</Badge>
                          ) : null
                        })}
                      </div>
                    </div>

                    {/* Schedule Review */}
                    <div className="pt-3 border-t">
                      <h4 className="font-medium text-sm mb-2">Working Schedule</h4>
                      <div className="text-sm space-y-1">
                        {DAYS.map(day => {
                          const hours = formData.workingHours[day]
                          return hours?.isWorking ? (
                            <p key={day}><span className="text-muted-foreground">{DAY_LABELS[day]}:</span> {hours.start} - {hours.end}</p>
                          ) : (
                            <p key={day}><span className="text-muted-foreground">{DAY_LABELS[day]}:</span> <span className="text-xs">Day off</span></p>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
                    <p>✓ All information looks good. Click <span className="font-medium">Submit</span> to {editingStaff ? 'update' : 'add'} this staff member.</p>
                  </div>
                </div>
                )}
              </form>

              {/* Navigation Actions */}
              <div className="border-t bg-muted/30 p-4 flex justify-between gap-3">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
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
                  {currentStep < 5 ? (
                    <Button onClick={goToNextStep} disabled={!canProceedToNext()}>
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={saving || isSubmitting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        editingStaff ? 'Update Staff' : 'Add Staff'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
