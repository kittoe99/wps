# Platform events (webhooks)

These events are emitted by the control plane for AI agents and external services.

| Event | When |
|-------|------|
| `site.created` | Site slug registered |
| `site.published` | Version activated and live on `{slug}.wpscanvas.com` |
| `site.suspended` | Site taken offline (files retained) |
| `site.updated` | Metadata/status changed |
| `integration.updated` | Per-site integration config changed |

## Payload shape

```json
{
  "id": "uuid",
  "type": "site.published",
  "createdAt": "ISO-8601",
  "data": { }
}
```

Signed with HMAC-SHA256 in header `X-WPS-Signature` using the endpoint secret.

## Register an endpoint

```bash
curl -X POST https://api.wpscanvas.com/webhooks \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://hooks.example.com/wps","events":["site.published","site.suspended"]}'
```

## Integrations table

`PUT /integrations/sites/:slug/:provider` stores provider config (CRM, Stripe, email, reviews, etc.) for later injection at publish time.
