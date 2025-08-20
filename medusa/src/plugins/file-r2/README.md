# Cloudflare R2 File Service (Skeleton)

Goal: Use an S3-compatible file service in Medusa wired to Cloudflare R2.

Config env vars: S3_ENDPOINT, S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.

Implementation tasks:
- Provide a file service that implements Medusa's expected interface or configure the S3 provider with R2 endpoint.
- Generate signed URLs for front consumption.
