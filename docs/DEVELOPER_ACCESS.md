# Developer Access Administration

## Protected routes

The following routes require successful server-side authorization before their React pages render:

```text
/dev/access
/dev/scoring
/dev/trends
/dev/analytics
```

Approved accounts see **Developer tools** in the Account dropdown. The developer area provides tabs for Access, Scoring, Trends, and Analytics.

## Source of truth

After setup, developer authorization is stored in two server-only PostgreSQL tables:

```text
public.developer_access_registry
public.developer_access_audit
```

`developer_access_registry` stores the current UUID-based access state. `developer_access_audit` is append-only and records owner initialization, grants, reactivations, and revocations.

Both tables:

- Have Row Level Security enabled.
- Grant no direct access to `anon` or `authenticated`.
- Are read and changed only by server-side Edge Functions using the service role.
- Never place authorization data in browser environment variables, profile fields, or user-editable metadata.

## Roles

### Owner

The Owner can:

- Access every developer page.
- View the complete active and revoked roster.
- View the latest 100 immutable audit events.
- Grant Admin access to an existing Supabase Auth user.
- Revoke Admin access immediately.

The Owner cannot revoke itself through the application.

### Admin

An Admin can:

- Access every developer page.
- View the complete roster and audit history.

An Admin cannot grant or revoke access.

## Initialize the registry

The existing Supabase secret allowlist is used only for the first-owner bootstrap.

1. Keep your current approved email in `DEVELOPER_EMAILS` temporarily.
2. Apply the migration and deploy both access Edge Functions.
3. Sign in with that approved account.
4. Open **Account → Developer tools → Access**.
5. Select **Initialize owner registry**.
6. Refresh and confirm your account appears as **Owner · Active**.
7. Remove the legacy allowlist secrets.

After one active registry account exists, `adminAccess.ts` ignores all legacy developer and trend-admin allowlist secrets. This prevents a forgotten secret entry from silently retaining access.

Remove the bootstrap secrets after verification:

```bash
npx supabase secrets unset \
  DEVELOPER_USER_IDS \
  DEVELOPER_EMAILS \
  TREND_ADMIN_USER_IDS \
  TREND_ADMIN_EMAILS
```

## Grant access

1. The target account must already exist under Supabase Dashboard → Authentication → Users.
2. Open `/dev/access` as the Owner.
3. Enter the exact Auth email.
4. Add an optional audit note.
5. Select **Grant access**.

The Edge Function resolves the email through the server-side Supabase Auth Admin API and stores the immutable Auth UUID as the authorization key.

## Revoke access

1. Open `/dev/access` as the Owner.
2. Locate the active Admin.
3. Select **Revoke** and confirm.

The account immediately loses access to all `/dev/*` routes and protected developer Edge Functions. Its registry row remains visible as Revoked, and the audit event remains permanently available.

## Easy security review

Application view:

```text
Account → Developer tools → Access
```

SQL review:

```text
supabase/verification/developer_access_registry_verify.sql
```

The SQL verification file is read-only and reports:

- Table and RLS status.
- Browser grant status.
- Whether exactly one active Owner exists.
- The readable active/revoked roster.
- The latest 100 audit events.

## Enforcement layers

1. `DeveloperAccessContext` asks `get-developer-access` to verify the signed-in account.
2. `DeveloperRoute` renders no developer page until that server check succeeds.
3. The Account dropdown renders **Developer tools** only for a verified account.
4. `get-developer-access` checks the UUID registry through the service role.
5. `manage-developer-access` requires Owner access for grants and revocations.
6. `sync-style-trends` and `get-analytics-dashboard` independently call `requireDeveloper`.
7. Unapproved direct navigation redirects to `/app`.
8. Registry mutation RPCs update access and write the audit event transactionally.

## Incident response

When suspicious developer access is discovered:

1. Revoke the account from `/dev/access`.
2. Refresh the roster and confirm it is marked Revoked.
3. Review the audit history for who granted it and when.
4. Review Supabase Auth sessions and rotate relevant credentials when compromise is suspected.
5. Run `supabase/verification/developer_access_registry_verify.sql` and retain the results with the incident record.
