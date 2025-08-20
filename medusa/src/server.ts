import 'dotenv/config';
import express from 'express';
import { registerCinetPayRoutes } from './plugins/payment-cinetpay/index';
import { registerDeliverySlotRoutes } from './plugins/delivery-slots/index';
import { registerTestRoutes } from './routes/test';
import { bootstrapMedusaV2 } from './bootstrap.medusa';

const app = express();
app.use(express.json());

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'medusa-backend-skeleton', medusa: 'v2-planned' });
});

// Plugin routes (temporary until Medusa v2 bootstrap wires HTTP)
registerCinetPayRoutes(app);
registerDeliverySlotRoutes(app);
registerTestRoutes(app);

const port = Number(process.env.PORT || 9000);

async function main() {
  // Log intended medusa v2 bootstrap (no-op placeholder)
  await bootstrapMedusaV2();

  app.listen(port, () => {
    console.log(`Medusa backend skeleton listening on :${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});
