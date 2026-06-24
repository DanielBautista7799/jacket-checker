# Security Overview

## Browser boundary

The browser receives only the Supabase project URL and publishable/anon key. RLS, Storage policies, authenticated Edge Functions, and server-side authorization remain required because browser-visible keys are not secrets.

## Edge Functions

The eight active functions share modules for:

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

## Data protection

- User-owned tables use RLS.
- Raw analytics and rate-limit rows have no direct browser grants.
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
