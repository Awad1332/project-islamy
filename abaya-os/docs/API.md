# ABAYA OS — API reference

* Base URL: `/api` (behind the web app's same-origin proxy, or `http://<api-host>:4000/api`).
* Interactive docs (Swagger UI): **`/api/docs`** · machine-readable spec: **`/api/docs-json`** (a snapshot is committed at [`openapi.json`](./openapi.json)).
* **Money** is always an integer in **halalas** (SAR × 100). **Timestamps** are ISO-8601 UTC; analytics buckets use **Asia/Riyadh**.
* **Errors** share one shape: `{"error": {"code": "INSUFFICIENT_STOCK", "message": "...", "details": ...}}`.
  Validation failures are `422 VALIDATION_FAILED` with `details: [{path, message}]`.
  Features that need an unverified external service return `503 INTEGRATION_NOT_CONNECTED`.

## Authentication

| Client | Mechanism |
|---|---|
| Dashboard / staff apps | `POST /auth/login` → `{accessToken}` (JWT, 15 min) + httpOnly refresh cookie `abaya_rt` (path `/api/auth`). Send `Authorization: Bearer <token>`. `POST /auth/refresh` rotates the refresh token; reusing an old one revokes the whole session family. Non-browser clients may pass `{"refreshToken": "..."}` in the body and receive the rotated token back. |
| Server-to-server (public API) | `x-api-key: ak_live_…` created in **Settings → Developers**, scoped (`products:read`, `orders:read`, `orders:write`, `customers:read`, `inventory:read`). Keys are stored as SHA-256 hashes and shown once. |

The tenant is always derived from the verified token/key — never from request input. Permissions per role are defined in `packages/shared/src/permissions.ts`.

## Outbound webhooks

Events: `order.created`, `order.updated`, `product.updated`, `inventory.low_stock`, `return.created`, `return.updated`, `customer.created`.
Each delivery is a JSON `POST` with headers `X-Abaya-Event`, `X-Abaya-Timestamp`, and
`X-Abaya-Signature: sha256=<hex>` where the HMAC-SHA256 key is the endpoint secret and the signed string is `` `${timestamp}.${rawBody}` ``. Failed deliveries retry 5× with exponential backoff (BullMQ).

```js
const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');
```

## Inbound webhooks

`GET/POST /webhooks/whatsapp/:tenantId` — Meta WhatsApp Cloud API subscription handshake (`hub.verify_token`) and message ingestion, authenticated with `X-Hub-Signature-256` (HMAC of the raw body with the app secret). Only active when the tenant's WhatsApp integration is **verified** and has `appSecret`/`verifyToken`.

## Endpoints (137 operations)

### billing
- `GET /api/billing/plans`
- `GET /api/billing`
- `POST /api/billing/change-plan`
- `POST /api/billing/cancel`
### media
- `GET /api/media/status`
- `GET /api/media`
- `POST /api/media`
- `DELETE /api/media/{id}`
### integrations
- `GET /api/integrations`
- `PUT /api/integrations`
- `POST /api/integrations/{provider}/verify`
- `DELETE /api/integrations/{provider}`
### inventory
- `GET /api/locations`
- `POST /api/locations`
- `PUT /api/locations/{id}`
- `DELETE /api/locations/{id}`
- `GET /api/inventory`
- `POST /api/inventory/adjust`
- `POST /api/inventory/transfer`
- `GET /api/inventory/movements`
### orders
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/{id}`
- `GET /api/orders/{id}/invoice`
- `PATCH /api/orders/{id}/status`
- `POST /api/orders/{id}/payments`
### auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/accept-invite`
- `GET /api/auth/me`
- `POST /api/auth/switch-tenant/{tenantId}`
- `POST /api/auth/change-password`
### store
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/team`
- `POST /api/team/invitations`
- `DELETE /api/team/invitations/{id}`
- `PATCH /api/team/members/{id}`
- `DELETE /api/team/members/{id}`
- `GET /api/audit-log`
- `GET /api/onboarding`
- `POST /api/onboarding/dismiss`
### admin
- `GET /api/admin/metrics`
- `GET /api/admin/tenants`
- `PATCH /api/admin/tenants/{id}/status`
- `POST /api/admin/tenants/{id}/assign-plan`
- `GET /api/admin/plans`
- `POST /api/admin/plans`
- `PUT /api/admin/plans/{id}`
### catalog
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`
- `GET /api/products`
- `POST /api/products`
- `GET /api/variants/search`
- `GET /api/products/{id}`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`
- `PATCH /api/products/{id}/status`
- `POST /api/products/{id}/duplicate`
- `POST /api/products/{id}/images`
- `PUT /api/products/{id}/images/order`
- `DELETE /api/products/{id}/images/{imageId}`
### customers
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/tags`
- `GET /api/customers/{id}`
- `PUT /api/customers/{id}`
- `DELETE /api/customers/{id}`
- `POST /api/customers/{id}/notes`
- `POST /api/customers/{id}/measurements`
- `PUT /api/customers/{id}/measurements/{mid}`
- `DELETE /api/customers/{id}/measurements/{mid}`
### returns
- `GET /api/returns`
- `POST /api/returns`
- `GET /api/returns/{id}`
- `POST /api/returns/{id}/transition`
### sizing
- `GET /api/size-charts`
- `POST /api/size-charts`
- `GET /api/size-charts/{id}`
- `PUT /api/size-charts/{id}`
- `DELETE /api/size-charts/{id}`
- `POST /api/size-charts/recommend`
### ai
- `GET /api/ai/content/status`
- `POST /api/ai/content/generate`
- `GET /api/ai/content/history`
- `POST /api/ai/content/{id}/apply`
- `GET /api/ai/images/status`
- `GET /api/ai/images/jobs`
- `POST /api/ai/images/jobs`
### marketing
- `GET /api/marketing/segments`
- `POST /api/marketing/segments`
- `POST /api/marketing/segments/preview`
- `PUT /api/marketing/segments/{id}`
- `DELETE /api/marketing/segments/{id}`
- `GET /api/marketing/campaigns`
- `POST /api/marketing/campaigns`
- `PUT /api/marketing/campaigns/{id}`
- `DELETE /api/marketing/campaigns/{id}`
- `POST /api/marketing/campaigns/{id}/launch`
- `POST /api/marketing/campaigns/{id}/cancel`
- `GET /api/marketing/automations`
- `POST /api/marketing/automations`
- `PUT /api/marketing/automations/{id}`
- `DELETE /api/marketing/automations/{id}`
### inbox
- `GET /api/inbox/channels`
- `POST /api/inbox/channels`
- `DELETE /api/inbox/channels/{id}`
- `GET /api/inbox/conversations`
- `POST /api/inbox/conversations`
- `GET /api/inbox/conversations/{id}`
- `PATCH /api/inbox/conversations/{id}`
- `POST /api/inbox/conversations/{id}/messages`
- `GET /api/webhooks/whatsapp/{tenantId}`
- `POST /api/webhooks/whatsapp/{tenantId}`
### analytics
- `GET /api/analytics/overview`
- `GET /api/analytics/dashboard`
### developer
- `GET /api/developer/api-keys`
- `POST /api/developer/api-keys`
- `DELETE /api/developer/api-keys/{id}`
- `GET /api/developer/webhooks`
- `POST /api/developer/webhooks`
- `PUT /api/developer/webhooks/{id}`
- `DELETE /api/developer/webhooks/{id}`
- `GET /api/developer/webhooks/{id}/deliveries`
- `POST /api/developer/webhooks/{id}/test`
### public-v1
- `GET /api/public/v1/products`
- `GET /api/public/v1/products/{id}`
- `GET /api/public/v1/orders`
- `POST /api/public/v1/orders`
- `GET /api/public/v1/orders/{id}`
- `GET /api/public/v1/customers`
### health
- `GET /api/health`
- `GET /api/system/status`