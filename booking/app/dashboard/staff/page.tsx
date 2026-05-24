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
  X
} from 'lucide-react'
import { useBusinessId } from '@/hooks/useBusinessId'

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
}

export default function StaffPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const [staffMembers, setStaffMembers] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState<StaffFormData>(initialFormData)
  const [saving, setSaving] = useState(false)

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
      if (response.data) {
        const servicesData = Array.isArray(response.data) ? response.data : []
        setServices(servicesData)
      }
    } catch (err) {
      console.error('[Staff] Error loading services:', err)
    }
  }

  const openAddModal = () => {
    setEditingStaff(null)
    setFormData(initialFormData)
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
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId) return

    try {
      setSaving(true)
      
      if (editingStaff) {
        await staffApi.update(editingStaff.id, formData)
      } else {
        await staffApi.create({ ...formData, businessId })
      }

      setIsModalOpen(false)
      loadStaff()
    } catch (err) {
      console.error('[Staff] Error saving staff:', err)
      setError('Failed to save staff member')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      await staffApi.delete(staffId)
      loadStaff()
    } catch (err) {
      console.error('[Staff] Error deleting staff:', err)
      setError('Failed to delete staff member')
    }
  }

  const handleToggleStatus = async (staffId: string) => {
    try {
      await staffApi.toggleStatus(staffId)
      loadStaff()
    } catch (err) {
      console.error('[Staff] Error toggling status:', err)
    }
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

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">Basic Information</h3>
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

                {/* Services */}
                <div className="space-y-4">
                  <h3 className="font-medium">Services</h3>
                  <p className="text-sm text-muted-foreground">Select the services this staff member can perform</p>
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

                {/* Working Hours */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Working Hours
                  </h3>
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

                {/* Break Times */}
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

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingStaff ? 'Update Staff' : 'Add Staff'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
