import { MeiliSearch } from 'meilisearch'

export function meiliClient() {
  const host = process.env.MEILI_HOST || 'http://localhost:7700'
  const apiKey = process.env.MEILI_API_KEY
  return new MeiliSearch({ host, apiKey })
}

export async function healthMeili() {
  const client = meiliClient()
  return client.health()
}

