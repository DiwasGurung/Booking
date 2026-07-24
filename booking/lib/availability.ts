import { Business, BusinessHours, Booking, Service, Staff } from '@/lib/api'

interface TimeSlot {
  time: string
  isAvailable: boolean
  availableStaffCount?: number
}

/**
 * Generate available time slots for booking based on business hours, service duration, and existing bookings
 */
export function getAvailableTimeSlots(
  date: string, // YYYY-MM-DD
  selectedStaffId: string | null,
  serviceDuration: number, // in minutes
  businessHours: BusinessHours[],
  bookings: Booking[],
  allStaff: Staff[],
  selectedStaff?: Staff | null
): TimeSlot[] {
  if (!date) return []

  const selectedDate = new Date(date)
  const dayOfWeek = selectedDate.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Get business hours for this day
  const dayHours = businessHours.find(h => h.dayOfWeek === dayOfWeek)
  
  if (!dayHours || dayHours.isClosed) {
    return []
  }

  const [openHour, openMin] = dayHours.openingTime.split(':').map(Number)
  const [closeHour, closeMin] = dayHours.closingTime.split(':').map(Number)
  
  const openTimeMinutes = openHour * 60 + openMin
  const closeTimeMinutes = closeHour * 60 + closeMin

  // Generate 15-minute slots
  const slots: TimeSlot[] = []
  
  for (let slotMinutes = openTimeMinutes; slotMinutes < closeTimeMinutes; slotMinutes += 15) {
    // Check if slot + service duration fits within business hours
    if (slotMinutes + serviceDuration > closeTimeMinutes) {
      break
    }

    const hours = Math.floor(slotMinutes / 60)
    const mins = slotMinutes % 60
    const slotTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
    
    // Check availability based on staff selection
    if (selectedStaffId && selectedStaff) {
      // Specific staff selected - check if they have conflict
      const hasConflict = bookings.some(booking => {
        if (booking.staffId !== selectedStaffId) return false
        if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') return false
        
        const bookingStart = new Date(booking.startTime)
        const bookingEnd = new Date(booking.endTime)
        const slotStart = new Date(date + 'T' + slotTime)
        const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000)
        
        // Check for overlap
        return slotStart < bookingEnd && slotEnd > bookingStart
      })
      
      slots.push({
        time: slotTime,
        isAvailable: !hasConflict,
      })
    } else {
      // No staff selected - show if ANY staff is available
      const availableStaffCount = allStaff.filter(staff => {
        return !bookings.some(booking => {
          if (booking.staffId !== staff.id) return false
          if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') return false
          
          const bookingStart = new Date(booking.startTime)
          const bookingEnd = new Date(booking.endTime)
          const slotStart = new Date(date + 'T' + slotTime)
          const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000)
          
          return slotStart < bookingEnd && slotEnd > bookingStart
        })
      }).length

      slots.push({
        time: slotTime,
        isAvailable: availableStaffCount > 0,
        availableStaffCount,
      })
    }
  }

  return slots
}

/**
 * Format minutes to HH:MM format
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Convert HH:MM to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}
