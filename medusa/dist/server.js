import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// import { registerCinetPayRoutes } from './plugins/payment-cinetpay/index'
// import { registerDeliverySlotRoutes } from './plugins/delivery-slots/index'
// import { getQueueMetrics } from './queues/order-review'
const app = express();
// Middleware
app.use(cors({
    origin: process.env.STORE_CORS?.split(",") || ["http://localhost:3000", "https://monepiceriz.com"],
    credentials: true,
}));
app.use(express.json());
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        ok: true,
        service: 'monepiceriz-medusa',
        status: 'transitioning-to-v2',
        timestamp: new Date().toISOString()
    });
});
// Test routes for services
app.get('/test/db', async (_req, res) => {
    const dbUrl = process.env.DATABASE_URL || "postgres://medusa:medusa@localhost:5432/medusa";
    console.log('Testing DB connection with URL:', dbUrl);
    try {
        const { Client } = await import('pg');
        const client = new Client({
            connectionString: dbUrl
        });
        await client.connect();
        const result = await client.query('SELECT NOW()');
        await client.end();
        res.json({ ok: true, database: 'connected', time: result.rows[0].now });
    }
    catch (error) {
        res.status(500).json({ ok: false, database: 'failed', error: error.message });
    }
});
app.get('/test/redis', async (_req, res) => {
    try {
        const { Redis } = await import('ioredis');
        const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
        await redis.set('test', 'connection-ok', 'EX', 10);
        const result = await redis.get('test');
        redis.disconnect();
        res.json({ ok: true, redis: 'connected', test: result });
    }
    catch (error) {
        res.status(500).json({ ok: false, redis: 'failed', error: error.message });
    }
});
app.get('/test/meilisearch', async (_req, res) => {
    try {
        const { MeiliSearch } = await import('meilisearch');
        const client = new MeiliSearch({
            host: process.env.MEILI_HOST || "http://localhost:7700",
            apiKey: process.env.MEILI_API_KEY || "dev_meili_master_key_change_me",
        });
        const health = await client.health();
        res.json({ ok: true, meilisearch: 'connected', health });
    }
    catch (error) {
        res.status(500).json({ ok: false, meilisearch: 'failed', error: error.message });
    }
});
// Helper functions for delivery slots
function generateDeliverySlots(date, includeExpress = true) {
    const slots = [];
    const slotDate = new Date(date);
    const today = new Date();
    const isToday = slotDate.toDateString() === today.toDateString();
    // Generate standard 2-hour slots from 8 AM to 8 PM
    for (let hour = 8; hour < 20; hour += 2) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`;
        // Apply 3-hour cut-off for same-day delivery
        let available = true;
        if (isToday) {
            const slotStart = new Date(slotDate);
            slotStart.setHours(hour, 0, 0, 0);
            const cutoffTime = new Date(slotStart.getTime() - 3 * 60 * 60 * 1000);
            available = today < cutoffTime;
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
            });
        }
    }
    // Add express slots for today (available with 1-hour notice)
    if (includeExpress && isToday) {
        const currentHour = today.getHours();
        for (let i = 1; i <= 3; i++) {
            const hour = currentHour + i;
            if (hour >= 20)
                break;
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            const endTime = `${Math.min(hour + 3, 20).toString().padStart(2, '0')}:00`;
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
            });
        }
    }
    return slots;
}
function getNextAvailableSlots(count) {
    const slots = [];
    const today = new Date();
    for (let i = 0; i < 7 && slots.length < count; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dateStr = checkDate.toISOString().split('T')[0];
        const daySlots = generateDeliverySlots(dateStr, i === 0);
        slots.push(...daySlots.slice(0, count - slots.length));
    }
    return slots.slice(0, count);
}
// TODO: Register plugin routes once module imports are fixed
// registerCinetPayRoutes(app)
// registerDeliverySlotRoutes(app)
// Placeholder routes for testing
app.post('/payments/cinetpay/init', (_req, res) => {
    res.status(501).json({ error: 'CinetPay plugin implementation in progress' });
});
app.post('/payments/cinetpay/ipn', (_req, res) => {
    res.status(200).json({ ok: true, message: 'IPN received (placeholder)' });
});
// Simplified delivery slots implementation (inline)
app.get('/delivery/slots', (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const includeExpress = req.query.includeExpress !== 'false';
        console.log('[DeliverySlots] Generate slots for date:', date);
        const slots = generateDeliverySlots(date, includeExpress);
        res.json({
            success: true,
            date,
            slots,
            message: 'Generated using simplified implementation'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to generate slots',
            message: error.message
        });
    }
});
app.post('/delivery/slots/reserve', async (req, res) => {
    try {
        const { cartId, slotId } = req.body;
        if (!cartId || !slotId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: cartId, slotId'
            });
        }
        console.log('[DeliverySlots] Reserve slot:', { cartId, slotId });
        // Simplified reservation (would use Redis in full implementation)
        res.json({
            success: true,
            message: 'Slot reserved successfully (simplified)',
            cartId,
            slotId,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to reserve slot'
        });
    }
});
app.post('/delivery/slots/release', async (req, res) => {
    try {
        const { cartId } = req.body;
        if (!cartId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: cartId'
            });
        }
        console.log('[DeliverySlots] Release slot for cart:', cartId);
        res.json({
            success: true,
            message: 'Slot released successfully (simplified)',
            cartId
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to release slot'
        });
    }
});
app.get('/delivery/slots/next-available', (req, res) => {
    try {
        const count = parseInt(req.query.count) || 5;
        const slots = getNextAvailableSlots(count);
        res.json({
            success: true,
            slots,
            message: 'Next available slots (simplified)'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get available slots'
        });
    }
});
// Queue monitoring endpoint (placeholder)
app.get('/queues/order-review/metrics', async (_req, res) => {
    res.json({
        ok: true,
        metrics: {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            total: 0,
            message: 'Queue implementation in progress'
        }
    });
});
const port = Number(process.env.PORT || 9000);
app.listen(port, () => {
    console.log(`🚀 MonEpiceRiz Medusa server (transitioning to v2) listening on :${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🧪 Test endpoints: /test/db, /test/redis, /test/meilisearch`);
});
export default app;
