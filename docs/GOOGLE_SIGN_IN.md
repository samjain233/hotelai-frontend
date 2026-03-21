# Google sign-in setup

OAuth runs on the **Next.js** app so the `auth_token` cookie is set on the same site as the dashboard (required when the API is on a different domain than the UI).

## 1. Google Cloud Console

1. Create an OAuth **Web application** client.
2. **Authorized JavaScript origins**: your app origin, e.g. `http://localhost:3000`, `https://your-app.vercel.app`
3. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://your-app.vercel.app/api/auth/google/callback`

## 2. Frontend (`.env.local` / Vercel)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | OAuth client ID (public; enables the button) |
| `GOOGLE_CLIENT_ID` | Same value (used by API routes) |
| `GOOGLE_CLIENT_SECRET` | Client secret (server only) |
| `GOOGLE_OAUTH_BRIDGE_SECRET` | Long random string; must match backend |
| `API_URL` | Nest API base URL for **server-side** calls, e.g. `https://your-api.run.app` (no trailing slash). Use this on Vercel so the callback can reach the API. |
| `NEXT_PUBLIC_API_URL` | Same as above for local dev if you do not set `API_URL` |

## 3. Backend (Nest / Cloud Run)

| Variable | Description |
|----------|-------------|
| `GOOGLE_OAUTH_BRIDGE_SECRET` | **Same** value as on the frontend |

Apply DB migration for Google columns:

```bash
cd hotel-ai && npx prisma migrate deploy
```

## 4. Behaviour

- **New Google user**: creates an owner hotel named `"{DisplayName}'s Hotel"` (or the display name if it already contains “hotel”) and a slug derived from the email.
- **Existing email + password**: user must keep using email/password (no auto-link).
- **Existing Google user**: signs in.
