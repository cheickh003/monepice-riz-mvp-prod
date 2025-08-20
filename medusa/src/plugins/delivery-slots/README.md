# Delivery Slots Plugin (Skeleton)

Purpose: Manage delivery slots (2-hour windows), express delivery, and store pickup.

Features to implement:
- Slot model: date, startTime, endTime, capacity, zone, price, isExpress.
- API endpoints:
  - GET /delivery/slots?date=today|YYYY-MM-DD
  - POST /delivery/slots/reserve (cart_id, slot_id)
  - POST /delivery/slots/release (cart_id)
- Validation: cut-off (e.g. now + 3h) for same-day; capacity checks per slot.
- Persist selected slot in cart/order metadata.

Integrations:
- Tie slot price to shipping option in Medusa.
- Expose admin utilities or use metadata/collections in Admin Medusa.
