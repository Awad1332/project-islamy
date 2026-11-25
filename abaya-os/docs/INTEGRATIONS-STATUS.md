# Integration status — what is real, what is architecture only

ABAYA OS never shows a service as **connected** unless the tenant (or platform) supplied credentials
**and** a live verification call to the provider succeeded (`Integration.status = VERIFIED`).
Credentials are encrypted at rest (AES-256-GCM) and only ever returned masked.

> None of the external services below were connected or live-verified while building this release:
> the build environment had no credentials for them. Verification code paths were exercised only for
> the "no credentials / not implemented" cases in the test suite.

| Provider | Live verification | What ABAYA OS does once verified | Not implemented |
|---|---|---|---|
| **Anthropic (Claude)** | ✅ `models.list` via official SDK | AI content studio: titles, descriptions, SEO JSON, Instagram captions (AR/EN), history, apply-to-product, per-plan credits, refusal handling with server-side fallback | — |
| **S3 / MinIO** (platform env) | ✅ `HeadBucket` (shown in *Integrations → system status*) | Product image upload with magic-byte validation, 10 MB limit | Image resizing/CDN |
| **WhatsApp Cloud API** | ✅ `GET /{phone-number-id}` | Inbox replies, campaigns, automations (text messages); signed inbound webhook → inbox | Template messages (needed outside Meta's 24-hour window — such sends will **fail** and are recorded as FAILED) |
| **SMTP** | ✅ `transporter.verify()` | Email campaigns/automations, inbox email replies | Invitation emails (invite links are shown to copy instead) |
| **Moyasar** | ✅ `GET /v1/payments` | Credential check only | Charging customers, payment links, refunds via API. Order payments/refunds are **recorded manually** |
| **Salla** | ✅ `GET /admin/v2/store/info` | Credential check only | OAuth app flow, product/order sync |
| **Instagram Graph** | ✅ `GET /{ig-user-id}` | Credential check only | DM ingestion/sending |
| **Tap Payments** | ❌ | — (stays *Configured — unverified*) | Everything |
| **Zid** | ❌ | — | Everything |
| **Image generation provider** | ❌ | — | No adapter bundled. `apps/api/src/modules/ai/image-providers.ts` defines the `ImageProviderAdapter` contract, queue (BullMQ) and job persistence; add an adapter + verifier to enable |
| **SMS** | — | — | No SMS adapter; SMS campaigns cannot be launched |
| **Platform subscription billing gateway** | — | — | Self-serve paid upgrades are refused (`BILLING_GATEWAY_NOT_CONFIGURED`); platform admins assign plans manually and a VAT invoice record is created |
| **ZATCA e-invoicing** | — | Phase 1 TLV QR on simplified tax invoices (needs the store VAT number) | **Phase 2** (Fatoora onboarding, cryptographic stamp, invoice reporting) |
| **Shipping carriers** (SMSA, Aramex, SPL…) | — | Carrier + tracking number stored manually | Label creation / tracking APIs |

To add a provider: extend `PROVIDERS` in `apps/api/src/modules/integrations/providers.ts` with its
credential fields and a `verify` function that performs a real API call, then consume it through
`IntegrationsService.verifiedCredentials()`, which returns credentials only for verified integrations.
