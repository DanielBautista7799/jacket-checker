# Jacket Checker iOS Release Readiness

## Completed in code

- Capacitor 8 iOS shell
- Native status-bar handling
- Native foreground location support
- Native Supabase authentication deep links
- Warm and cold authentication callback handling
- UIKit scene-based lifecycle
- Scene-based custom URL and universal-link forwarding to Capacitor
- Branded 1024×1024 app icon without transparency
- Branded adaptive launch screen
- Version `1.0`, build `1`
- Bundle identifier `com.danielbautista.jacketchecker`
- Automatic signing configuration
- Explicit export-compliance flag
- Public in-app privacy policy
- Public support page
- Automated iOS release-readiness checks
- Release simulator build command
- Archive command for a signed physical-device release

## Release commands

Run the complete release gate:

```bash
npm run mobile:release:check
```

Run a Release configuration build for the generic iOS simulator without code signing:

```bash
npm run mobile:release:simulator
```

Open Xcode:

```bash
npm run mobile:open
```

Create the signed archive after Apple signing is configured:

```bash
npm run mobile:release:archive
```

The archive is written to:

```text
build/JacketChecker.xcarchive
```

## Apple signing setup

These steps require access to the user's Apple Developer account and cannot be committed to the repository.

1. Open `ios/App/App.xcodeproj` in Xcode.
2. Select the App project and the App target.
3. Open Signing & Capabilities.
4. Keep Automatically manage signing enabled.
5. Select the user's Apple Developer team.
6. Confirm the bundle identifier remains `com.danielbautista.jacketchecker`.
7. Confirm Xcode creates or selects a valid development provisioning profile.
8. Build and run on a physical iPhone.

Do not commit personal provisioning profiles, certificates, API keys, or Apple account credentials.

## Physical iPhone test matrix

Complete every item on a real device before creating the first TestFlight build.

### Installation and lifecycle

- Fresh install launches without a blank screen
- Branded launch screen appears cleanly
- App icon is sharp in light, dark, and tinted icon modes
- App opens after force quit
- App returns correctly from background
- Session restores after close and reopen
- No `UIScene lifecycle will soon be required` warning appears

### Guest mode

- Search and choose a city
- Use current location after granting While Using the App permission
- Deny location and confirm city search remains usable
- Run all forecast windows
- Verify YES and NO results
- Test airplane mode and restored connectivity

### Authentication

- Create a new test account
- Open signup confirmation from Mail
- Sign in and sign out
- Request a password reset
- Open the recovery link from Mail
- Change the password and sign in with the new password
- Request and confirm an email change
- Force quit during each callback test and repeat to verify cold launch

### Personalized account

- Save and edit profile settings
- Add a jacket manually
- Add a jacket with AI-assisted analysis
- Upload, reorder, replace, and delete private images
- Run a personalized recommendation
- Select an alternate ranked jacket
- Submit feedback
- Review and delete history
- Archive, restore, and delete a jacket
- Permanently delete a disposable test account

### Device behavior

- Portrait orientation
- Landscape orientation
- Dynamic Type at larger text sizes
- VoiceOver navigation for core flows
- Reduced Motion enabled
- Light and dark appearance
- Low Power Mode
- Poor network conditions
- Permission changes from iOS Settings

## TestFlight workflow

1. Confirm `npm run mobile:release:check` passes.
2. Confirm `npm run mobile:release:simulator` passes.
3. Complete the physical-device matrix.
4. In Xcode, select `Any iOS Device (arm64)` or a connected device.
5. Choose Product → Archive, or run `npm run mobile:release:archive`.
6. In Organizer, choose Distribute App.
7. Select App Store Connect.
8. Upload the build.
9. Wait for App Store Connect processing.
10. Add internal testers first.
11. Complete Test Information, including a safe reviewer account when personalized features need review.
12. Test the processed TestFlight build before preparing App Review submission.

Every new upload needs a higher build number. Keep version `1.0` for additional first-release builds and increment `CURRENT_PROJECT_VERSION` from `1` to `2`, `3`, and so on.

## App Store Connect checklist

- Agreements, tax, and banking status are complete where required
- App record exists with the exact bundle ID
- App name is available
- SKU is selected
- Primary and secondary categories are set
- Privacy Policy URL is live
- Support URL is live
- App privacy answers are complete
- Age rating questionnaire is complete
- Export-compliance answers are complete
- Screenshots meet current Apple dimensions and contain no alpha channel
- Description, subtitle, keywords, and release notes are entered
- Review contact information is current
- Reviewer account is valid and contains safe test data
- Account deletion is described for review
- Build is selected for the version
- Release method is selected

## Known external dependencies

The iOS app requires reachable production services:

- Supabase Auth
- Supabase database and private Storage
- Supabase Edge Functions
- WeatherAPI
- Optional configured AI provider for jacket analysis

Check these services immediately before submitting a build. A paused Supabase project or expired provider configuration can make an otherwise valid binary appear broken during App Review.
