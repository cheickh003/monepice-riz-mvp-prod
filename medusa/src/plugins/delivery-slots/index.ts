import type { Request, Response } from 'express'
import { DeliverySlotService, DeliverySlot } from '../../services/slots'
import { slotCapacityService } from '../../services/slots-capacity'

export function registerDeliverySlotRoutes(app: import('express').Express) {
  app.get('/delivery/slots', listSlots)
  app.post('/delivery/slots/reserve', reserveSlot)
  app.post('/delivery/slots/release', releaseSlot)
  app.get('/delivery/slots/next-available', getNextAvailableSlots)
  app.get('/delivery/slots/:slotId/capacity', getSlotCapacity)
}

const slotService = new DeliverySlotService()

interface ListSlotsQuery {
  date?: string // YYYY-MM-DD
  startDate?: string
  endDate?: string
  includeExpress?: string // 'true' | 'false'
}

async function listSlots(req: Request, res: Response) {
  try {
    const { date, startDate, endDate, includeExpress }: ListSlotsQuery = req.query as any

    console.log('[DeliverySlots] List slots request:', { date, startDate, endDate, includeExpress })

    // If no date specified, default to today
    const targetDate = date || new Date().toISOString().split('T')[0]

    let slotsData: Record<string, DeliverySlot[]> | DeliverySlot[]

    if (startDate && endDate) {
      // Date range request
      slotsData = slotService.getSlotsForDateRange(startDate, endDate)
    } else {
      // Single date request
      const slots = slotService.generateSlots({
        date: targetDate,
        includeExpress: includeExpress !== 'false'
      })

      // Load capacity information from Redis
      const slotsWithCapacity = await Promise.all(
        slots.map(async (slot) => {
          const capacityInfo = await slotCapacityService.getSlotCapacity(slot.id)
          return {
            ...slot,
            capacity: capacityInfo.capacity,
            reserved: capacityInfo.reserved,
            remaining: capacityInfo.remaining,
            available: slot.available && capacityInfo.remaining > 0
          }
        })
      )

      slotsData = slotsWithCapacity
    }

    res.json({
      success: true,
      date: targetDate,
      slots: slotsData
    })

  } catch (error) {
    console.error('[DeliverySlots] Error listing slots:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load delivery slots',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

interface ReserveSlotRequest {
  cartId: string
  slotId: string
  userId?: string
}

async function reserveSlot(req: Request, res: Response) {
  try {
    const { cartId, slotId, userId }: ReserveSlotRequest = req.body

    console.log('[DeliverySlots] Reserve slot request:', { cartId, slotId, userId })

    // Validate required fields
    if (!cartId || !slotId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['cartId', 'slotId']
      })
    }

    // Validate slot
    const validation = slotService.validateSlot(slotId)
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      })
    }

    // Reserve the slot
    const reservation = await slotCapacityService.reserveSlot(slotId, cartId, userId)
    
    if (!reservation.success) {
      return res.status(409).json({
        success: false,
        error: reservation.error
      })
    }

    // TODO: Store slot information in cart metadata
    // await cartService.updateMetadata(cartId, {
    //   deliverySlot: {
    //     slotId,
    //     date: validation.slot.date,
    //     startTime: validation.slot.startTime,
    //     endTime: validation.slot.endTime,
    //     type: validation.slot.type,
    //     reservedAt: new Date().toISOString()
    //   }
    // })

    console.log('[DeliverySlots] Slot reserved successfully:', { cartId, slotId })

    res.json({
      success: true,
      message: 'Slot reserved successfully',
      slot: validation.slot,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    })

  } catch (error) {
    console.error('[DeliverySlots] Error reserving slot:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reserve slot',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

interface ReleaseSlotRequest {
  cartId: string
}

async function releaseSlot(req: Request, res: Response) {
  try {
    const { cartId }: ReleaseSlotRequest = req.body

    console.log('[DeliverySlots] Release slot request:', { cartId })

    if (!cartId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: cartId'
      })
    }

    // Release the slot reservation
    const release = await slotCapacityService.releaseSlot(cartId)

    if (!release.success) {
      return res.status(500).json({
        success: false,
        error: release.error
      })
    }

    // TODO: Remove slot information from cart metadata
    // await cartService.updateMetadata(cartId, {
    //   deliverySlot: null
    // })

    console.log('[DeliverySlots] Slot released successfully:', { cartId })

    res.json({
      success: true,
      message: 'Slot released successfully'
    })

  } catch (error) {
    console.error('[DeliverySlots] Error releasing slot:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to release slot',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function getNextAvailableSlots(req: Request, res: Response) {
  try {
    const count = parseInt(req.query.count as string) || 5

    console.log('[DeliverySlots] Get next available slots:', { count })

    const slots = slotService.getNextAvailableSlots(count)

    // Load capacity information
    const slotsWithCapacity = await Promise.all(
      slots.map(async (slot) => {
        const capacityInfo = await slotCapacityService.getSlotCapacity(slot.id)
        return {
          ...slot,
          capacity: capacityInfo.capacity,
          reserved: capacityInfo.reserved,
          remaining: capacityInfo.remaining,
          available: slot.available && capacityInfo.remaining > 0
        }
      })
    )

    res.json({
      success: true,
      slots: slotsWithCapacity.filter(slot => slot.available)
    })

  } catch (error) {
    console.error('[DeliverySlots] Error getting next available slots:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get available slots',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function getSlotCapacity(req: Request, res: Response) {
  try {
    const { slotId } = req.params

    console.log('[DeliverySlots] Get slot capacity:', { slotId })

    const capacityInfo = await slotCapacityService.getSlotCapacity(slotId)
    const reservations = await slotCapacityService.getSlotReservations(slotId)

    res.json({
      success: true,
      slotId,
      capacity: capacityInfo.capacity,
      reserved: capacityInfo.reserved,
      remaining: capacityInfo.remaining,
      reservations: reservations.map(r => ({
        cartId: r.cartId,
        reservedAt: r.reservedAt,
        expiresAt: r.expiresAt
      }))
    })

  } catch (error) {
    console.error('[DeliverySlots] Error getting slot capacity:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get slot capacity',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

