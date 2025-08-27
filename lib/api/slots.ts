import { apiFetch } from './client'
import type { DeliverySlot } from '../types'

export async function fetchSlots(date?: string): Promise<{ date: string; slots: DeliverySlot[] }> {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  const data = await apiFetch<{ success: boolean; date: string; slots: any[] }>(`/delivery/slots${query}`)
  const slots: DeliverySlot[] = (data.slots || []).map((s: any) => ({
    id: s.id,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    available: s.available !== false && (s.remaining === undefined || s.remaining > 0),
    price: s.type === 'express' ? 3000 : 1500,
    isExpress: s.type === 'express',
  }))
  return { date: data.date, slots }
}

export async function reserveSlot(cartId: string, slotId: string): Promise<void> {
  await apiFetch(`/delivery/slots/reserve`, {
    method: 'POST',
    body: JSON.stringify({ cartId, slotId }),
  })
}

export async function releaseSlot(cartId: string): Promise<void> {
  await apiFetch(`/delivery/slots/release`, {
    method: 'POST',
    body: JSON.stringify({ cartId }),
  })
}

