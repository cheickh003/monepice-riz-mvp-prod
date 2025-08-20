import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json());

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'medusa-backend-skeleton' });
});

// Placeholder routes for plugins to mount beneath
app.use('/payments/cinetpay', (req, res) => {
  res.status(501).json({ error: 'Not Implemented', hint: 'Implement CinetPay processor plugin' });
});

app.use('/delivery/slots', (req, res) => {
  res.status(501).json({ error: 'Not Implemented', hint: 'Implement delivery-slots plugin' });
});

const port = Number(process.env.PORT || 9000);
app.listen(port, () => {
  console.log(`Medusa backend skeleton listening on :${port}`);
});

