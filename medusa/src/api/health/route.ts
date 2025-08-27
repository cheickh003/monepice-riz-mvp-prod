import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({ 
    ok: true, 
    service: 'monepiceriz-medusa', 
    medusa: 'v2',
    timestamp: new Date().toISOString()
  })
}