# Production Test Checklist

## A. Installation and structure

- [ ] Extracted Phase 14 package into the repository root
- [ ] Existing matching files were replaced
- [ ] New files exist at the paths in `PHASE14_FILE_MANIFEST.txt`
- [ ] `phase13_cleanup.sh` was not rerun
- [ ] `npm install` completed
- [ ] `npm run test:phase14` passed

## B. Local environment

- [ ] `.env` contains the real Supabase URL
- [ ] `.env` contains the real publishable/anon key
- [ ] No server secret uses a `VITE_` prefix
- [ ] No legacy `VITE_ENABLE_DEV_*` variables exist
- [ ] `npm run test:production-config` passed

## C. Automated predeployment gate

- [ ] `npx playwright install chromium` completed
- [ ] `npm run test:predeploy` passed
- [ ] `npm run test:production-config:strict` passed with production-intended values
- [ ] `dist/_headers` exists
- [ ] `dist/_redirects` exists
- [ ] Production build scanner reported no secrets, local URLs, or source maps

## D. Local manual product checks

- [ ] Guest search and browser location work
- [ ] Every forecast window works
- [ ] Guest result is YES or NO
- [ ] Sign in and sign up screens work
- [ ] Protected routes redirect while signed out
- [ ] Profile saves and reloads
- [ ] Jacket create, edit, favorite, archive, restore, and delete work
- [ ] Valid private image upload works
- [ ] Invalid image types, sizes, and dimensions are rejected
- [ ] AI analysis succeeds or offers a safe manual fallback
- [ ] Embedding failure never blocks jacket creation
- [ ] Personalized result selects only an active jacket
- [ ] Fire, Good, and Not It feedback work
- [ ] History deletion reverses direct learning effect
- [ ] Offline banner appears and recovers
- [ ] Sign out clears account state
- [ ] No significant console errors remain

## E. Responsive and accessibility checks

Test 320, 375, 430, 768, 1024, and 1440 pixel widths.

- [ ] No horizontal overflow
- [ ] Header remains usable
- [ ] Dialogs fit the viewport
- [ ] Inputs have visible labels
- [ ] Keyboard navigation works
- [ ] Focus is visible
- [ ] Skip link works
- [ ] Route changes focus the main content
- [ ] Reduced motion is respected
- [ ] Loading, empty, offline, and error states are announced

## F. Final live gate after deployment

- [ ] HTTPS site loads
- [ ] Security headers are present
- [ ] Deep-route refreshes do not return 404
- [ ] All eleven Edge Functions work
- [ ] Production CORS permits the exact site origin
- [ ] Phase 13 RLS audit passes
- [ ] Phase 13 Storage audit passes
- [ ] Phase 14 SQL reports PASS for every row
- [ ] Public production smoke tests pass
- [ ] Authenticated smoke tests pass with a disposable account
- [ ] `manage-password` is deployed with JWT gateway verification disabled for public signup
- [ ] Hosted Auth password policy verifies as 6 + uppercase/lowercase/number/symbol
- [ ] Production signup rejects a password that fails the server policy
- [ ] Signed-in password change requires the current password
- [ ] Recovery reset accepts a valid recovery session and rejects a normal session
- [ ] Approved account sees **Developer tools** in the Account dropdown
- [ ] Approved account can open access, scoring, trends, and analytics tabs
- [ ] Owner can see the active/revoked roster and append-only audit history
- [ ] Owner can grant an existing Auth user and revoke an Admin account
- [ ] Admin account can view the roster but cannot grant or revoke access
- [ ] Unapproved account does not see the Developer tools entry
- [ ] Unapproved direct navigation to `/dev/access`, `/dev/scoring`, `/dev/trends`, or `/dev/analytics` redirects to `/app`
- [ ] Normal users cannot access developer data or trend administration
- [ ] Disposable-account deletion removes Auth, database records, and private images
- [ ] Live results document is completed
