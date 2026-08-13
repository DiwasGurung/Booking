import { Business, BusinessHours, Booking, Service, Staff } from '@/lib/api'

interface TimeSlot {
  time: string
  isAvailable: boolean
  availableStaffCount?: number
}

export function getAvailableTimeSlots(
  date: string, // YYYY-MM-DD
  selectedStaffId: string | null,
  serviceDuration: number, // in minutes
  businessHours: BusinessHours[],
  bookings: Booking[],
  allStaff: Staff[],
  selectedStaff?: Staff | null
): TimeSlot[] {
  if (!date) {
    console.log('No date provided, returning empty slots.');
    return []
  }

  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Debug: Log the date and computed day of week
  console.log('Selected date:', date);
  console.log('Computed dayOfWeek:', dayOfWeek);

  // Find business hours for this day
  const dayHours = businessHours.find(h => h.dayOfWeek === dayOfWeek);

  // Debug: Log the matching business hours
  console.log('Matching business hours:', dayHours);

  if (!dayHours || dayHours.isClosed || !dayHours.openTime || !dayHours.closeTime) {
    console.log('Business closed or missing hours for this day.');
    return []
  }

  const [openHour, openMin] = dayHours.openTime.split(':').map(Number)
  const [closeHour, closeMin] = dayHours.closeTime.split(':').map(Number)

  const openTimeMinutes = openHour * 60 + openMin
  const closeTimeMinutes = closeHour * 60 + closeMin

  // Log business hours in minutes
  console.log(`Business hours (in minutes): ${formatTime(openTimeMinutes)} - ${formatTime(closeTimeMinutes)}`);

  const slots: TimeSlot[] = []

  for (let slotMinutes = openTimeMinutes; slotMinutes + serviceDuration <= closeTimeMinutes; slotMinutes += 15) {
    const hours = Math.floor(slotMinutes / 60)
    const mins = slotMinutes % 60
    const slotTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`

    // Log each potential slot
    console.log('Checking slot:', slotTime);

    if (selectedStaffId && selectedStaff && selectedStaffId === selectedStaff.id) {
      // Specific staff selected - check if they have conflict
      const hasConflict = bookings.some(booking => {
        if (booking.staffId !== selectedStaffId) return false
        if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') return false

        const bookingStart = new Date(booking.startTime)
        const bookingEnd = new Date(booking.endTime)
        const slotStart = new Date(`${date}T${slotTime}`)
        const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000)

        // Log conflict check
        console.log(`Conflict check for staff ${selectedStaffId}:`);
        console.log(`Booking: ${bookingStart.toISOString()} - ${bookingEnd.toISOString()}`);
        console.log(`Slot: ${slotStart.toISOString()} - ${slotEnd.toISOString()}`);

        return slotStart < bookingEnd && slotEnd > bookingStart
      })

      // Log slot availability
      console.log(`Slot ${slotTime} for staff ${selectedStaffId} is ${hasConflict ? 'UNAVAILABLE' : 'AVAILABLE'}`);

      slots.push({
        time: slotTime,
        isAvailable: !hasConflict,
      })
    } else {
      // No specific staff selected - check all staff
      const availableStaffCount = allStaff.filter(staff => {
        // Check if staff has conflict
        const hasConflict = bookings.some(booking => {
          if (booking.staffId !== staff.id) return false
          if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') return false

          const bookingStart = new Date(booking.startTime)
          const bookingEnd = new Date(booking.endTime)
          const slotStart = new Date(`${date}T${slotTime}`)
          const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000)

          // Log individual staff conflict check
          console.log(`Checking staff ${staff.id} for booking ${booking.id}:`);
          console.log(`Booking: ${bookingStart.toISOString()} - ${bookingEnd.toISOString()}`);
          console.log(`Slot: ${slotStart.toISOString()} - ${slotEnd.toISOString()}`);

          return slotStart < bookingEnd && slotEnd > bookingStart
        })

        return !hasConflict
      }).length

      // Log how many staff are available
      console.log(`Slot ${slotTime} - available staff count: ${availableStaffCount}`);

      slots.push({
        time: slotTime,
        isAvailable: availableStaffCount > 0,
        availableStaffCount,
      })
    }
  }

  // Final debug log
  console.log('Generated slots:', slots);

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