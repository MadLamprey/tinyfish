# OpenClaw Travel Tools

Drop this directory into your OpenClaw tools/plugins folder on the OpenClaw host.

Required environment variables:

- `TRAVEL_APP_URL`
- `OPENCLAW_WEBHOOK_SECRET`

Generate a strong secret with one of:

```bash
openssl rand -hex 32
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The plugin exposes:

- `travel_sync_chat`
- `travel_get_recommendations`
- `travel_create_trip`
