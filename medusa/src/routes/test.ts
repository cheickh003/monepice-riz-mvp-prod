import type { Express, Request, Response } from 'express'
import { sendTestEmail } from '../services/email'
import { healthMeili } from '../services/meili'
import { getSignedUploadUrl } from '../services/storage'

export function registerTestRoutes(app: Express) {
  app.post('/_test/email', async (req: Request, res: Response) => {
    try {
      const { to } = req.body
      if (!to) return res.status(400).json({ error: 'Missing to' })
      const id = await sendTestEmail(to)
      res.json({ ok: true, messageId: id })
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })

  app.get('/_test/meili', async (_req: Request, res: Response) => {
    try {
      const health = await healthMeili()
      res.json({ ok: true, health })
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })

  app.post('/_test/r2-sign', async (req: Request, res: Response) => {
    try {
      const { key, contentType } = req.body
      if (!key || !contentType) return res.status(400).json({ error: 'Missing key/contentType' })
      const signed = await getSignedUploadUrl(key, contentType)
      res.json({ ok: true, ...signed })
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })
}

