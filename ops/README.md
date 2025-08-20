# Ops — Local Dev Stack

This stack helps test Phase 2 integrations (DB, Redis, Meilisearch, backend skeleton).

## Start

```
cd ops
docker compose up -d
```

Services:
- medusa: http://localhost:9000 (health: /health)
- postgres: localhost:5432 (user/pass/db: medusa)
- redis: localhost:6379
- meilisearch: http://localhost:7700 (API key from compose env)

## Test routes

- SMTP test (POST): `http://localhost:9000/_test/email`
  - body: `{ "to": "you@example.com" }`
  - requires SMTP env configured in `medusa/.env`

- Meilisearch health (GET): `http://localhost:9000/_test/meili`

- R2 signed upload (POST): `http://localhost:9000/_test/r2-sign`
  - body: `{ "key": "uploads/test.png", "contentType": "image/png" }`
  - requires R2 env configured in `medusa/.env`

## Notes
- This is a v2 bootstrap placeholder. Replace Express stub with real Medusa v2 app when dependencies are installed.
- Do not expose test routes publicly in production.
