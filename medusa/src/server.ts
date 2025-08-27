import 'dotenv/config'
import express from 'express'
import cors from 'cors'
// import { registerCinetPayRoutes } from './plugins/payment-cinetpay/index'
// import { registerDeliverySlotRoutes } from './plugins/delivery-slots/index'
// import { getQueueMetrics } from './queues/order-review'

const app = express()

// Middleware
app.use(cors({
  origin: process.env.STORE_CORS?.split(",") || ["http://localhost:3000", "https://monepiceriz.com"],
  credentials: true,
}))
app.use(express.json())

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    ok: true, 
    service: 'monepiceriz-medusa', 
    status: 'transitioning-to-v2',
    timestamp: new Date().toISOString()
  })
})

// Test routes for services
app.get('/test/db', async (_req, res) => {
  const dbUrl = process.env.DATABASE_URL || "postgres://medusa:medusa@localhost:5432/medusa"
  console.log('Testing DB connection with URL:', dbUrl)
  try {
    const { Client } = await import('pg')
    const client = new Client({
      connectionString: dbUrl
    })
    await client.connect()
    const result = await client.query('SELECT NOW()')
    await client.end()
    res.json({ ok: true, database: 'connected', time: result.rows[0].now })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ ok: false, database: 'failed', error: message })
  }
})

app.get('/test/redis', async (_req, res) => {
  try {
    const { Redis } = await import('ioredis')
    const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")
    await redis.set('test', 'connection-ok', 'EX', 10)
    const result = await redis.get('test')
    redis.disconnect()
    res.json({ ok: true, redis: 'connected', test: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ ok: false, redis: 'failed', error: message })
  }
})

app.get('/test/meilisearch', async (_req, res) => {
  try {
    const { MeiliSearch } = await import('meilisearch')
    const client = new MeiliSearch({
      host: process.env.MEILI_HOST || "http://localhost:7700",
      apiKey: process.env.MEILI_API_KEY || "dev_meili_master_key_change_me",
    })
    const health = await client.health()
    res.json({ ok: true, meilisearch: 'connected', health })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ ok: false, meilisearch: 'failed', error: message })
  }
})

// Helper functions for delivery slots
function generateDeliverySlots(date: string, includeExpress: boolean = true) {
  const slots = []
  const slotDate = new Date(date)
  const today = new Date()
  const isToday = slotDate.toDateString() === today.toDateString()
  
  // Generate standard 2-hour slots from 8 AM to 8 PM
  for (let hour = 8; hour < 20; hour += 2) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`
    const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`
    
    // Apply 3-hour cut-off for same-day delivery
    let available = true
    if (isToday) {
      const slotStart = new Date(slotDate)
      slotStart.setHours(hour, 0, 0, 0)
      const cutoffTime = new Date(slotStart.getTime() - 3 * 60 * 60 * 1000)
      available = today < cutoffTime
    }
    
    if (available) {
      slots.push({
        id: `${date}-${hour.toString().padStart(2, '0')}00-${(hour + 2).toString().padStart(2, '0')}00`,
        date,
        startTime,
        endTime,
        type: 'standard',
        available: true,
        capacity: 10,
        reserved: 0,
        remaining: 10
      })
    }
  }
  
  // Add express slots for today (available with 1-hour notice)
  if (includeExpress && isToday) {
    const currentHour = today.getHours()
    for (let i = 1; i <= 3; i++) {
      const hour = currentHour + i
      if (hour >= 20) break
      
      const startTime = `${hour.toString().padStart(2, '0')}:00`
      const endTime = `${Math.min(hour + 3, 20).toString().padStart(2, '0')}:00`
      
      slots.push({
        id: `${date}-express-${hour}`,
        date,
        startTime,
        endTime,
        type: 'express',
        available: true,
        capacity: 5,
        reserved: 0,
        remaining: 5
      })
    }
  }
  
  return slots
}

function getNextAvailableSlots(count: number) {
  const slots = []
  const today = new Date()
  
  for (let i = 0; i < 7 && slots.length < count; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() + i)
    const dateStr = checkDate.toISOString().split('T')[0]
    
    const daySlots = generateDeliverySlots(dateStr, i === 0)
    slots.push(...daySlots.slice(0, count - slots.length))
  }
  
  return slots.slice(0, count)
}

// Register plugin routes (CinetPay + Delivery Slots)
// registerCinetPayRoutes(app)
// registerDeliverySlotRoutes(app)

// Placeholder routes for testing
// (The real implementations are registered via plugins above)

// Simplified delivery slots implementation (inline)
app.get('/delivery/slots', (req, res) => {
  try {
    const date = req.query.date as string || new Date().toISOString().split('T')[0]
    const includeExpress = req.query.includeExpress !== 'false'
    
    console.log('[DeliverySlots] Generate slots for date:', date)
    
    const slots = generateDeliverySlots(date, includeExpress)
    
    res.json({
      success: true,
      date,
      slots,
      message: 'Generated using simplified implementation'
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate slots',
      message 
    })
  }
})

app.post('/delivery/slots/reserve', async (req, res) => {
  try {
    const { cartId, slotId } = req.body
    
    if (!cartId || !slotId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: cartId, slotId'
      })
    }
    
    console.log('[DeliverySlots] Reserve slot:', { cartId, slotId })
    
    // Simplified reservation (would use Redis in full implementation)
    res.json({
      success: true,
      message: 'Slot reserved successfully (simplified)',
      cartId,
      slotId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    })
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reserve slot' 
    })
  }
})

app.post('/delivery/slots/release', async (req, res) => {
  try {
    const { cartId } = req.body
    
    if (!cartId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: cartId'
      })
    }
    
    console.log('[DeliverySlots] Release slot for cart:', cartId)
    
    res.json({
      success: true,
      message: 'Slot released successfully (simplified)',
      cartId
    })
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to release slot' 
    })
  }
})

app.get('/delivery/slots/next-available', (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 5
    const slots = getNextAvailableSlots(count)
    
    res.json({
      success: true,
      slots,
      message: 'Next available slots (simplified)'
    })
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get available slots' 
    })
  }
})

// Queue monitoring endpoint (placeholder)
app.get('/queues/order-review/metrics', async (_req, res) => {
  const metrics = {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    total: 0,
  }
  res.json({ ok: true, metrics })
})

// Mock Medusa Store API endpoints for products and cart
const mockProducts = [
  {
    id: "prod_01J64EKZXQRQ8K9V6W7XHPWRME",
    title: "Riz Parfumé 5kg",
    handle: "riz-parfume-5kg",
    description: "Riz parfumé de qualité supérieure, idéal pour tous vos repas",
    status: "published",
    categories: [
      {
        id: "pcat_cereales",
        name: "Céréales",
        handle: "cereales",
        description: "Riz, mil, blé et autres céréales"
      }
    ],
    variants: [
      {
        id: "variant_01J64EL2QKRM8X7V9Y2ZHQNSTC",
        title: "5kg",
        inventory_quantity: 50,
        prices: [
          {
            id: "price_01J64EL4WMTP8R5Q3N9BXJGHKV",
            amount: 12500,
            currency_code: "XOF"
          }
        ]
      }
    ],
    images: [
      {
        id: "img_01J64EL6YNVR8T3M7K4PXJQWHF",
        url: "/images/products/riz-parfume-5kg.jpg"
      }
    ],
    metadata: {
      ref: "RIZ001",
      barcode: "2000000123456",
      unit: "sac",
      brand: "Premium",
      isFeatured: "true",
      isPromo: "false"
    }
  },
  {
    id: "prod_01J64EM1BKRQ8K9V6W7XHPWRMF",
    title: "Huile d'arachide 5L",
    handle: "huile-arachide-5l",
    description: "Huile d'arachide pure, première qualité",
    status: "published",
    categories: [
      {
        id: "pcat_condiments",
        name: "Condiments",
        handle: "condiments",
        description: "Huiles, vinaigres et condiments"
      }
    ],
    variants: [
      {
        id: "variant_01J64EM3PKRM8X7V9Y2ZHQNSTD",
        title: "5L",
        inventory_quantity: 30,
        prices: [
          {
            id: "price_01J64EM5RMTP8R5Q3N9BXJGHKW",
            amount: 8500,
            currency_code: "XOF"
          }
        ]
      }
    ],
    images: [
      {
        id: "img_01J64EM7YNVR8T3M7K4PXJQWHG",
        url: "/images/products/huile-arachide-5l.jpg"
      }
    ],
    metadata: {
      ref: "HUILE001",
      barcode: "2000000123457",
      unit: "bidon",
      brand: "Coeur de Lion",
      isFeatured: "false",
      isPromo: "true",
      promoPrice: "7500"
    }
  }
]

const mockCategories = [
  {
    id: "pcat_cereales",
    name: "Céréales",
    handle: "cereales",
    description: "Riz, mil, blé et autres céréales",
    products: []
  },
  {
    id: "pcat_condiments", 
    name: "Condiments",
    handle: "condiments",
    description: "Huiles, vinaigres et condiments",
    products: []
  }
]

// Store API endpoints
app.get('/store/products', (req, res) => {
  try {
    const { category, search, handle } = req.query
    let products = [...mockProducts]

    if (handle) {
      const product = products.find(p => p.handle === handle)
      return res.json({ product: product || null })
    }

    if (category) {
      products = products.filter(p => 
        p.categories.some(c => c.handle === category)
      )
    }

    if (search) {
      const searchTerm = String(search).toLowerCase()
      products = products.filter(p => 
        p.title.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm)
      )
    }

    res.json({ products })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: 'Failed to fetch products', message })
  }
})

app.get('/store/products/:handle', (req, res) => {
  try {
    const { handle } = req.params
    const product = mockProducts.find(p => p.handle === handle)
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json({ product })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: 'Failed to fetch product', message })
  }
})

app.get('/store/product-categories', (_req, res) => {
  try {
    res.json({ product_categories: mockCategories })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: 'Failed to fetch categories', message })
  }
})

// Cart endpoints
const carts = new Map()

app.post('/store/carts', (_req, res) => {
  try {
    const cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const cart = {
      id: cartId,
      email: null,
      region_id: "reg_01J64EN8QKRM8X7V9Y2ZHQNSTE",
      items: [],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    carts.set(cartId, cart)
    res.json({ cart })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: 'Failed to create cart', message })
  }
})

app.get('/store/carts/:id', (req, res) => {
  try {
    const { id } = req.params
    const cart = carts.get(id)
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    res.json({ cart })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: 'Failed to fetch cart', message })
  }
})

app.post('/store/carts/:id/line-items', (req, res) => {
  try {
    const { id } = req.params
    const { variant_id, quantity } = req.body
    const cart = carts.get(id)
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    // Find the product and variant
    const product = mockProducts.find(p => 
      p.variants.some(v => v.id === variant_id)
    )
    const variant = product?.variants.find(v => v.id === variant_id)

    if (!product || !variant) {
      return res.status(404).json({ error: 'Product variant not found' })
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => item.variant.id === variant_id)
    
    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity
    } else {
      // Add new item
      const lineItem = {
        id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: product.title,
        description: product.description,
        quantity,
        variant: {
          id: variant.id,
          title: variant.title,
          product: {
            id: product.id,
            title: product.title,
            handle: product.handle,
            categories: product.categories,
            images: product.images,
            metadata: product.metadata
          }
        },
        unit_price: variant.prices[0].amount,
        total: variant.prices[0].amount * quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      cart.items.push(lineItem)
    }

    cart.updated_at = new Date().toISOString()
    carts.set(id, cart)

    res.json({ cart })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: 'Failed to add item to cart', message })
  }
})

app.post('/store/carts/:id/line-items/:lineId', (req, res) => {
  try {
    const { id, lineId } = req.params
    const { quantity } = req.body
    const cart = carts.get(id)
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    const itemIndex = cart.items.findIndex(item => item.id === lineId)
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Line item not found' })
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1)
    } else {
      cart.items[itemIndex].quantity = quantity
      cart.items[itemIndex].total = cart.items[itemIndex].unit_price * quantity
      cart.items[itemIndex].updated_at = new Date().toISOString()
    }

    cart.updated_at = new Date().toISOString()
    carts.set(id, cart)

    res.json({ cart })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: 'Failed to update line item', message })
  }
})

app.delete('/store/carts/:id/line-items/:lineId', (req, res) => {
  try {
    const { id, lineId } = req.params
    const cart = carts.get(id)
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    const itemIndex = cart.items.findIndex(item => item.id === lineId)
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Line item not found' })
    }

    cart.items.splice(itemIndex, 1)
    cart.updated_at = new Date().toISOString()
    carts.set(id, cart)

    res.json({ cart })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: 'Failed to remove line item', message })
  }
})

// Delivery slot management for carts
app.post('/store/carts/:id/delivery-slot', (req, res) => {
  try {
    const { id } = req.params
    const { slotId } = req.body
    const cart = carts.get(id)
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    cart.metadata = cart.metadata || {}
    cart.metadata.deliverySlot = slotId
    cart.updated_at = new Date().toISOString()
    carts.set(id, cart)

    res.json({ cart, message: 'Delivery slot reserved' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: 'Failed to set delivery slot', message })
  }
})

app.delete('/store/carts/:id/delivery-slot', (req, res) => {
  try {
    const { id } = req.params
    const cart = carts.get(id)
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    if (cart.metadata && cart.metadata.deliverySlot) {
      delete cart.metadata.deliverySlot
    }
    
    cart.updated_at = new Date().toISOString()
    carts.set(id, cart)

    res.json({ cart, message: 'Delivery slot released' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: 'Failed to remove delivery slot', message })
  }
})

const port = Number(process.env.PORT || 9000)

app.listen(port, () => {
  console.log(`🚀 MonEpiceRiz Medusa server (transitioning to v2) listening on :${port}`)
  console.log(`📊 Health check: http://localhost:${port}/health`)
  console.log(`🧪 Test endpoints: /test/db, /test/redis, /test/meilisearch`)
})

export default app
