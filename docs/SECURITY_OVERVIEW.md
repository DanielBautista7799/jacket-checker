# Security Overview

## Browser boundary

The browser receives only the Supabase project URL and publishable/anon key. RLS, Storage policies, authenticated Edge Functions, and server-side authorization remain required because browser-visible keys are not secrets.

## Edge Functions

The ten active functions share modules for:

- Origin allowlisting and preflight handling
- Method restrictions
- Request IDs
- JSON body limits
- Authentication
- Developer authorization
- Sanitized errors
- Security headers
- Safe event logging
- Hashed server-side rate limiting

The CORS allowlist includes the Supabase client headers used by the current browser client, including `x-application-name`.

## Developer authorization

- `/dev/access`, `/dev/scoring`, `/dev/trends`, and `/dev/analytics` render only after `get-developer-access` confirms the signed-in UUID is active in the server-only registry.
- The Account dropdown shows **Developer tools** only after the same server check succeeds.
- `sync-style-trends` and `get-analytics-dashboard` independently call `requireDeveloper`, so bypassing the client route cannot expose protected server data or administration actions.
- `manage-developer-access` requires the Owner role for grants and revocations.
- Developer tables have RLS enabled and no direct `anon` or `authenticated` grants.
- The audit table is append-only.
- Access grants resolve an existing Supabase Auth user server-side and store the immutable Auth UUID.
- Legacy email/UUID secrets are accepted only while the registry has no active account. After Owner initialization, they no longer authorize anyone.

## Data protection

- User-owned tables use RLS.
- Raw analytics, rate-limit rows, developer authorization rows, and access-audit rows have no direct browser grants.
- Rate-limit scopes are hashed and do not persist raw IP addresses.
- The `closet-images` bucket is private.
- Image paths are user-scoped and generated with UUIDs.
- Signed URLs are temporary and are not stored in the database.

## Upload protection

Client and server controls limit jacket images to JPEG, PNG, and WebP, with a 5 MiB limit. Client validation also checks empty files, extensions, dimensions, duplicate same-session files, and filename safety.

## Authentication and account deletion

Protected functions derive the user from the verified session token. The account deletion function requires the exact phrase `DELETE MY ACCOUNT`, ignores selectable target user IDs, deletes private images, and hard-deletes the authenticated Supabase Auth user.

## Production browser controls

`public/_headers` provides CSP, frame blocking, MIME-sniffing protection, HSTS, referrer policy, and a restrictive permissions policy. The production smoke suite verifies critical response headers after deployment.

## Verification commands

```bash
npm run test:security
npm run test:phase13
npm run test:phase14
npm run test:production-build
```

Run the read-only access review before launch and after every access change:

```text
supabase/verification/developer_access_registry_verify.sql
```
