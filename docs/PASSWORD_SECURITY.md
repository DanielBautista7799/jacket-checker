# Server-Enforced Password Security

## Policy

Every new password must contain at least six characters, including an uppercase letter, lowercase letter, number, and supported symbol. The supported symbol set matches hosted Supabase Auth.

Six characters is the product minimum. Owner and administrator accounts should still use a substantially longer, unique password stored in a password manager.

## Defense in depth

The policy is enforced in three places:

1. `src/utils/passwordPolicy.js` provides immediate browser feedback.
2. `supabase/functions/_shared/security/passwordPolicy.ts` validates every mutation handled by `manage-password`.
3. Hosted Supabase Auth uses `password_min_length = 6` and `password_required_characters = lower_upper_letters_digits_symbols`.

The hosted Auth layer is the final boundary against a caller attempting to bypass the JacketCheck frontend or Edge Function and invoke Auth directly.

## Supported actions

### Sign up

The public signup form calls `manage-password` with `sign-up`. The function validates origin, email, password, redirect destination, and rate limit before calling Supabase Auth.

### Signed-in password change

The Profile security form calls `manage-password` with `change-password`. The function validates the caller through Supabase Auth, requires the current password, validates the new password, and forwards the authenticated update to Auth.

### Recovery reset

The reset page calls `manage-password` with `reset-password`. The function verifies the caller's session and requires the JWT Authentication Methods Reference (`amr`) claim to contain `recovery` before updating the password. A normal signed-in session cannot use this endpoint as a recovery session.

## Production deployment

From the project root:

```bash
npm run test:predeploy
npx supabase functions deploy manage-password --no-verify-jwt
```

Create a temporary Supabase personal access token from the Supabase account-access-token page, then run:

```bash
export SUPABASE_PROJECT_REF="achnzeuvmqymguiqepji"
read -s SUPABASE_ACCESS_TOKEN
export SUPABASE_ACCESS_TOKEN
npm run security:password-policy:configure
npm run security:password-policy:verify
unset SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_REF
```

The token must remain local and temporary. Never commit it or place it in Netlify, a `VITE_*` variable, Supabase Edge Function secrets, or documentation.

## Production verification

Test all of the following with a disposable account before changing the Owner password:

- A weak signup password is rejected.
- A valid six-character password with all four character groups is accepted.
- A signed-in change rejects an incorrect current password.
- A valid signed-in change succeeds and the old password stops working.
- A recovery link permits a reset.
- Directly opening the reset route without a recovery session does not expose the update form.
- A normal authenticated session cannot call the recovery action.
- The Owner account retains Developer tools after changing its password.

## Source files

- `src/utils/passwordPolicy.js`
- `src/utils/passwordSecurityApi.js`
- `src/components/AuthPanel.jsx`
- `src/components/AccountSecurityPanel.jsx`
- `src/pages/ResetPasswordPage.jsx`
- `supabase/functions/_shared/security/passwordPolicy.ts`
- `supabase/functions/manage-password/index.ts`
- `scripts/configure-hosted-password-policy.mjs`
- `scripts/test-password-security.mjs`
