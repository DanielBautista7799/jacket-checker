# Incident Response

## General rule

Protect user data first, preserve safe core behavior, record the request ID when available, and apply a forward fix. Do not expose raw provider responses, tokens, stack traces, image paths, or user identifiers in public reports.

## Weather provider outage

Expected behavior: location or forecast requests show a safe retryable message; saved account data remains available.

Actions:

1. Check `get-weather` logs and request IDs.
2. Verify the weather provider secret and quota.
3. Confirm CORS and rate-limit responses.
4. Test one search and one forecast call directly through the function.
5. Apply and deploy a forward function fix if required.

## AI provider outage

Expected behavior: manual jacket entry remains available and existing jackets remain usable.

Actions:

1. Review provider-specific safe error codes.
2. Verify provider key and configured model.
3. Confirm retryable failures are not saved as successful analysis.
4. Keep manual fallback enabled.

## Supabase outage or authentication failure

Expected behavior: protected routes show loading/recovery states; guest UI may load but remote requests can fail safely.

Actions:

1. Check Supabase status and project logs.
2. Verify frontend URL/key configuration.
3. Check session restoration and JWT failures.
4. Do not clear or rewrite database data as a first response.

## Storage or signed-image failure

Expected behavior: jacket data remains readable and images show a fallback.

Actions:

1. Check private bucket and policies.
2. Verify the database image path exists in Storage.
3. Test signed URL creation.
4. Refresh affected signed URL caches.

## Analytics failure

Expected behavior: recommendations and account workflows continue.

Actions:

1. Confirm analytics failure isolation remains active.
2. Inspect `track-analytics` logs without exposing raw event metadata.
3. Verify server-only grants and metadata allowlist.

## Rate-limit issue

Expected behavior: user receives a safe wait-and-retry message.

Actions:

1. Inspect hashed scope counts, not raw IP data.
2. Confirm `RATE_LIMIT_SALT` is configured.
3. Verify endpoint-specific limits and windows.
4. Adjust only through a reviewed forward change.

## Suspicious developer access

Expected behavior: the Owner can immediately revoke an Admin while preserving the historical record.

Actions:

1. Open `/dev/access` and revoke the suspicious account.
2. Confirm the account is marked Revoked and cannot reopen any `/dev/*` route.
3. Review the append-only audit log for who granted access, when, and the associated request ID.
4. Run `supabase/verification/developer_access_registry_verify.sql` and retain the results.
5. Review Supabase Auth sessions and project logs for the affected account.
6. Rotate relevant secrets or credentials when compromise is suspected.
7. Do not delete audit rows or rewrite the access history.

## Broken frontend deployment

1. Stop new changes.
2. Capture Netlify build logs and failing asset path.
3. Reproduce with `npm run build` and `npm run test:production-build`.
4. Correct configuration or source in a new forward commit.
5. Run the full predeployment gate before the next deployment.
