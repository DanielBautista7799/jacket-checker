# Jacket Checker: Free iOS Build and Finalization

## Final distribution decision

Jacket Checker remains publicly available at:

```text
https://jacketchecker.netlify.app/
```

The public web app is the permanent, zero-cost version. The Capacitor iOS project is retained as a complete native-shell implementation that can run in the iOS simulator and on the owner's iPhone through Xcode using a free Apple Account.

TestFlight and App Store distribution are intentionally not configured because those distribution channels require a paid Apple Developer Program membership.

## What remains in the repository

- Production React/Vite web application
- Netlify public deployment
- Capacitor 8 iOS project
- Native foreground location
- Native status-bar and safe-area handling
- Native authentication callback scheme
- Warm and cold deep-link handling
- Scene-based iOS lifecycle
- Privacy manifest
- Public privacy and support pages
- Automated web, security, native, and simulator checks
- Free-device installation instructions

## What was removed

- TestFlight archive scripts
- App Store Connect worksheets
- App Review notes
- TestFlight beta copy
- Paid-distribution build instructions
- Local archive artifacts
- Unused generated launch-logo assets
- Unnecessary Always-location permission text
- Legacy armv7 capability declaration

## Final automated gate

From the repository root:

```bash
npm run project:final:check
```

This runs the complete web test and predeployment gate, dependency audit, Capacitor sync, iOS readiness checks, free-finalization checks, and a Release simulator build.

Expected ending:

```text
FINAL FREE RELEASE CHECK PASSED
```

## Open the iOS project

```bash
npm run ios:free:open
```

In Xcode:

1. Select the `App` scheme.
2. Select an iPhone simulator.
3. Press Run.
4. In the Simulator menu, use a fitted display size when the simulated phone is larger than the available Mac window.
5. Confirm the app itself does not horizontally overflow or pan.

## Install on a physical iPhone for free

1. Connect the iPhone to the Mac.
2. Unlock the phone and trust the computer when prompted.
3. Enable Developer Mode on the iPhone if iOS requests it.
4. Open Xcode with `npm run ios:free:open`.
5. Select the blue `App` project.
6. Select the `App` target.
7. Open Signing & Capabilities.
8. Keep Automatically manage signing enabled.
9. Select the Personal Team associated with the Apple Account in Xcode.
10. Select the connected iPhone as the run destination.
11. Press Run.
12. Complete the device test matrix in `docs/IOS_FREE_DEVICE_TEST_MATRIX.md`.

A free Personal Team installation is a development build. Apple-issued free provisioning expires periodically, so the app may need to be rebuilt and installed again from Xcode.

## Permanent free iPhone access

The public web version does not expire. On iPhone:

1. Open `https://jacketchecker.netlify.app/` in Safari.
2. Open the Share menu.
3. Choose Add to Home Screen.
4. Enable Open as Web App when Safari presents that option.
5. Add Jacket Checker to the Home Screen.

This is the recommended zero-cost version for everyday access and portfolio demonstrations.

## Final Git commit

After the automated gate and manual tests pass:

```bash
git add .
git commit -m "Finalize free iOS build and project documentation"
git push
```

Then verify:

```bash
git status
```

Expected:

```text
nothing to commit, working tree clean
```
