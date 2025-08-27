export interface DeliverySlot {
  id: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  type: 'standard' | 'express'
  available: boolean
  capacity: number
  reserved: number
  remaining: number
  cutoffTime?: string // Cut-off time for today's slots
}

export interface SlotGenerationOptions {
  date: string // YYYY-MM-DD
  includeExpress?: boolean
  slotDurationHours?: number
  startHour?: number
  endHour?: number
  cutoffHours?: number // Hours before slot time for same-day orders
}

export class DeliverySlotService {
  private readonly DEFAULT_CAPACITY = 10
  private readonly DEFAULT_SLOT_DURATION = 2 // hours
  private readonly DEFAULT_START_HOUR = 8 // 8 AM
  private readonly DEFAULT_END_HOUR = 20 // 8 PM
  private readonly DEFAULT_CUTOFF_HOURS = 3 // 3 hours before delivery

  /**
   * Generate available delivery slots for a given date
   */
  generateSlots(options: SlotGenerationOptions): DeliverySlot[] {
    const {
      date,
      includeExpress = true,
      slotDurationHours = this.DEFAULT_SLOT_DURATION,
      startHour = this.DEFAULT_START_HOUR,
      endHour = this.DEFAULT_END_HOUR,
      cutoffHours = this.DEFAULT_CUTOFF_HOURS
    } = options

    const slots: DeliverySlot[] = []
    const slotDate = new Date(date)
    const today = new Date()
    const isToday = this.isSameDate(slotDate, today)

    // Generate standard 2-hour slots
    for (let hour = startHour; hour < endHour; hour += slotDurationHours) {
      const startTime = this.formatTime(hour, 0)
      const endTime = this.formatTime(hour + slotDurationHours, 0)
      
      // Apply cut-off for same-day delivery
      let available = true
      let cutoffTime: string | undefined

      if (isToday) {
        const slotStartDateTime = new Date(slotDate)
        slotStartDateTime.setHours(hour, 0, 0, 0)
        
        const cutoffDateTime = new Date(slotStartDateTime)
        cutoffDateTime.setHours(slotStartDateTime.getHours() - cutoffHours)
        
        cutoffTime = this.formatTime(cutoffDateTime.getHours(), cutoffDateTime.getMinutes())
        available = today < cutoffDateTime
      }

      slots.push({
        id: `${date}-${startTime.replace(':', '')}-${endTime.replace(':', '')}`,
        date,
        startTime,
        endTime,
        type: 'standard',
        available,
        capacity: this.DEFAULT_CAPACITY,
        reserved: 0, // Will be loaded from Redis in real implementation
        remaining: this.DEFAULT_CAPACITY,
        cutoffTime
      })
    }

    // Generate express slots (available with shorter notice)
    if (includeExpress && isToday) {
      const expressSlots = this.generateExpressSlots(date, today)
      slots.push(...expressSlots)
    }

    return slots.filter(slot => slot.available)
  }

  /**
   * Generate express delivery slots for same-day delivery
   */
  private generateExpressSlots(date: string, currentTime: Date): DeliverySlot[] {
    const slots: DeliverySlot[] = []
    const currentHour = currentTime.getHours()
    const currentMinutes = currentTime.getMinutes()

    // Express slots: next available 3-hour windows
    for (let i = 0; i < 3; i++) {
      const slotStartHour = currentHour + 1 + i // Start 1 hour from now
      if (slotStartHour >= 20) break // Don't create slots after 8 PM

      const startTime = this.formatTime(slotStartHour, 0)
      const endTime = this.formatTime(Math.min(slotStartHour + 3, 20), 0)

      slots.push({
        id: `${date}-express-${slotStartHour}`,
        date,
        startTime,
        endTime,
        type: 'express',
        available: true,
        capacity: Math.ceil(this.DEFAULT_CAPACITY / 2), // Lower capacity for express
        reserved: 0,
        remaining: Math.ceil(this.DEFAULT_CAPACITY / 2),
      })
    }

    return slots
  }

  /**
   * Get slots for multiple days
   */
  getSlotsForDateRange(startDate: string, endDate: string): Record<string, DeliverySlot[]> {
    const result: Record<string, DeliverySlot[]> = {}
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = this.formatDate(date)
      result[dateStr] = this.generateSlots({ date: dateStr })
    }

    return result
  }

  /**
   * Get next available slots (useful for auto-suggestion)
   */
  getNextAvailableSlots(count: number = 5): DeliverySlot[] {
    const today = new Date()
    const slots: DeliverySlot[] = []
    
    // Check today and next 7 days
    for (let i = 0; i < 7 && slots.length < count; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() + i)
      
      const dateSlots = this.generateSlots({ 
        date: this.formatDate(checkDate),
        includeExpress: i === 0 // Only include express for today
      })
      
      slots.push(...dateSlots.slice(0, count - slots.length))
    }

    return slots
  }

  /**
   * Validate if a slot ID is valid and available
   */
  validateSlot(slotId: string): { valid: boolean; slot?: DeliverySlot; error?: string } {
    try {
      // Parse slot ID to extract date and time info
      const parts = slotId.split('-')
      if (parts.length < 3) {
        return { valid: false, error: 'Invalid slot ID format' }
      }

      const [year, month, day] = parts
      const date = `${year}-${month}-${day}`
      
      const slots = this.generateSlots({ date })
      const slot = slots.find(s => s.id === slotId)

      if (!slot) {
        return { valid: false, error: 'Slot not found' }
      }

      if (!slot.available) {
        return { valid: false, error: 'Slot not available' }
      }

      if (slot.remaining <= 0) {
        return { valid: false, error: 'Slot fully booked' }
      }

      return { valid: true, slot }
    } catch (error) {
      return { valid: false, error: 'Invalid slot ID' }
    }
  }

  /**
   * Format time as HH:MM
   */
  private formatTime(hours: number, minutes: number): string {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDate(date1: Date, date2: Date): boolean {
    return this.formatDate(date1) === this.formatDate(date2)
  }
}