# Future Apple App Store Deployment

This document preserves the complete path for distributing Jacket Checker through TestFlight and the Apple App Store in the future.

The current project does **not** require this process. The permanent production version remains available at:

**https://jacketchecker.netlify.app/**

The iOS app can currently be tested for free in the simulator and on a personal iPhone through Xcode. App Store distribution requires paid Apple Developer Program enrollment.

---

# 1. Current Project Identity

Use these values unless the project is deliberately renamed:

```text
App name: Jacket Checker
Platform: iOS
Bundle identifier: com.danielbautista.jacketchecker
Marketing version: 1.0
Initial App Store build number: 2 or greater
Primary language: English (U.S.)
SKU: jacket-checker-ios-2026
```

Public URLs:

```text
Production application:
https://jacketchecker.netlify.app/

Privacy policy:
https://jacketchecker.netlify.app/privacy

Support:
https://jacketchecker.netlify.app/support
```

The App Store build should continue using the same Supabase project and production Edge Functions unless a separate production environment is intentionally created.

---

# 2. Recheck Apple Requirements First

Apple changes SDK, Xcode, privacy, age-rating, and submission requirements over time.

Before beginning:

1. Review Apple’s current submission requirements.
2. Update Xcode to a currently accepted version.
3. Confirm the required iOS SDK version.
4. Review current privacy-manifest and required-reason API rules.
5. Review App Store age-rating questions.
6. Run the complete Jacket Checker test suite after dependency or Xcode upgrades.

As of July 2026, Apple requires iOS uploads to be built with Xcode 26 or later and the iOS 26 SDK or later. Recheck this at the time of submission.

Official references:

- https://developer.apple.com/app-store/submitting/
- https://developer.apple.com/news/upcoming-requirements/
- https://developer.apple.com/support/xcode/

---

# 3. Enroll in the Apple Developer Program

App Store Connect and TestFlight distribution require Apple Developer Program membership.

1. Sign in with the Apple Account used in Xcode.
2. Enroll as an Individual unless Jacket Checker is owned by a registered legal organization.
3. Complete identity verification.
4. Accept the program agreement.
5. Pay the current annual membership fee.
6. Wait until membership becomes Active.

Important:

- A free Personal Team supports personal-device testing only.
- A Personal Team cannot submit an app to App Store Connect.
- Under an Individual membership, Apple may display the account holder’s legal name as the seller.
- Organization enrollment requires a qualifying legal entity and additional verification.

Official reference:

- https://developer.apple.com/support/compare-memberships/

---

# 4. Preserve and Verify the Existing Project

Before changing Apple distribution settings:

```bash
cd /Users/danielbautista/jacketproj/jacket-checker

git status
npm run test:all
npm audit --omit=dev
npm run build
npm run mobile:sync
```

Do not continue until:

- Tests pass
- The web build passes
- The iOS simulator build passes
- The working tree contains only intentional changes
- The production Netlify application still works
- Supabase authentication and Edge Functions still work

Do not remove the Netlify deployment. It remains the permanent public fallback.

---

# 5. Confirm the Bundle Identifier and Signing Team

In Xcode:

```text
App project
→ TARGETS
→ App
→ Signing & Capabilities
```

Confirm:

```text
Bundle Identifier:
com.danielbautista.jacketchecker

Automatically manage signing:
Enabled

Team:
Paid Apple Developer Program team
```

If a temporary Personal Team bundle identifier was used, change it back to:

```text
com.danielbautista.jacketchecker
```

Then rebuild and retest authentication, location, and session restoration.

---

# 6. Register the App ID

In Apple Developer Certificates, Identifiers & Profiles:

1. Open Identifiers.
2. Check whether `com.danielbautista.jacketchecker` already exists.
3. Create an explicit App ID only if it does not exist.
4. Use:
   - Description: `Jacket Checker`
   - Bundle ID type: `Explicit`
   - Bundle ID: `com.danielbautista.jacketchecker`
5. Enable only capabilities actually used by the app.
6. Save the identifier.

Do not enable unrelated capabilities.

---

# 7. Review Native Configuration

Verify:

```text
ios/App/App/Info.plist
ios/App/App/AppDelegate.swift
ios/App/App/SceneDelegate.swift
ios/App/App/PrivacyInfo.xcprivacy
ios/App/App.xcodeproj/project.pbxproj
ios/App/App/Assets.xcassets/
capacitor.config.json
```

Confirm:

- App display name is Jacket Checker
- Bundle ID is correct
- Version and build number are correct
- Location permission text is accurate
- `jacketchecker://auth/callback` remains configured
- Scene lifecycle support remains configured
- Deep links still forward through Capacitor
- Export-compliance declaration is accurate
- Privacy manifest exists and is included in the target
- App icon is a valid opaque 1024 × 1024 image
- Launch screen contains no prohibited dynamic behavior
- The app targets only the intended Apple device families

---

# 8. Recheck Supabase Authentication Redirects

Retain the production web URLs and native callback:

```text
https://jacketchecker.netlify.app/
https://jacketchecker.netlify.app/auth/reset-password
jacketchecker://auth/callback
```

Then verify on a physical iPhone:

- New-account confirmation
- Sign in
- Sign out
- Password recovery
- Email change
- Warm callback
- Cold callback
- Session restoration

Never paste private confirmation or recovery links into logs, commits, documentation, or support messages.

---

# 9. Create the App Store Connect Record

After paid membership is active:

1. Sign in to App Store Connect.
2. Accept any pending agreement in Business.
3. Open Apps.
4. Select `+`.
5. Select New App.
6. Enter:

```text
Platforms: iOS
Name: Jacket Checker
Primary Language: English (U.S.)
Bundle ID: com.danielbautista.jacketchecker
SKU: jacket-checker-ios-2026
User Access: Full Access
```

Create the app record before uploading the first build.

Official reference:

- https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app

---

# 10. Complete App Information

Suggested starting values:

```text
Name:
Jacket Checker

Subtitle:
Personal weather and jacket recommendations

Category:
Weather

Secondary category:
Lifestyle

Support URL:
https://jacketchecker.netlify.app/support

Marketing URL:
https://jacketchecker.netlify.app/

Privacy Policy URL:
https://jacketchecker.netlify.app/privacy
```

Also complete:

- Description
- Keywords
- Copyright
- Age rating
- App review contact information
- App review notes
- Privacy disclosures
- Screenshots

Do not claim capabilities the submitted build does not contain.

---

# 11. Complete App Privacy Accurately

Review the production implementation and every third-party service.

Potential categories include:

- Email address
- User identifier
- Precise location
- User-provided profile information
- Wardrobe photos
- Wardrobe metadata
- Recommendation history
- Product interactions
- Diagnostics or analytics

For each category determine:

1. Whether it is collected
2. Whether it is linked to the user
3. Whether it is used for tracking
4. Its purpose
5. Whether it is optional
6. How deletion is handled

Do not mark data as uncollected only because Supabase or another service processes it.

Official reference:

- https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/

---

# 12. Final Physical-Device Test

Use a physical iPhone and test the Release configuration.

Blocking checks:

- Cold and warm launch
- Guest city search
- Location allowed and denied
- Weather loading
- YES and NO recommendations
- Signup and confirmation
- Sign in and sign out
- Password recovery
- Email change
- Session restoration
- Profile persistence
- Wardrobe creation
- Multiple private images
- AI-assisted analysis
- Manual fallback
- Jacket recommendation ranking
- Feedback
- History
- Privacy and Support pages
- Account deletion
- Offline recovery
- Light and dark themes
- No clipping or horizontal page panning
- Final icon and launch screen
- No private values in Xcode logs

Do not archive until blocking checks pass.

---

# 13. Set Version and Build Number

Keep:

```text
Marketing Version:
1.0
```

Use a build number higher than every previously uploaded build:

```text
Current Project Version:
2
```

Later examples:

```text
Version 1.0, Build 3
Version 1.0, Build 4
Version 1.1, Build 1
```

App Store Connect will not accept the same version/build combination twice.

---

# 14. Create the Archive

From the project root:

```bash
cd /Users/danielbautista/jacketproj/jacket-checker

npm run test:all
npm audit --omit=dev
npm run mobile:sync
npm run mobile:open
```

In Xcode:

1. Select the `App` scheme.
2. Select `Any iOS Device (arm64)` or the current generic physical-device destination.
3. Select Product → Archive.
4. Wait for the archive to finish.
5. Inspect it in Organizer.

The archive must use the paid team, not the Personal Team.

---

# 15. Validate and Upload

In Xcode Organizer:

1. Select the Jacket Checker archive.
2. Select Distribute App.
3. Select App Store Connect.
4. Select Upload.
5. Keep automatic signing unless deliberately using manual signing.
6. Allow Xcode to validate.
7. Resolve blocking errors.
8. Review warnings.
9. Upload.

Apple associates the build using the bundle identifier, version, and build number.

Official reference:

- https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/

---

# 16. Wait for Processing and Test Through TestFlight

In App Store Connect:

```text
Apps
→ Jacket Checker
→ TestFlight
```

Wait for processing. Review any compliance questions or validation errors.

Create an internal-testing group, add the build, install it from TestFlight, and repeat the blocking physical-device tests.

Important:

- TestFlight requires paid membership.
- TestFlight builds are processed by Apple.
- Developer Mode is not required for normal TestFlight installation.
- External testing may require Beta App Review.

---

# 17. Prepare App Review Notes

Explain anything the reviewer needs to access or understand:

- Whether an account is required
- A working review account when required
- Steps to reach authenticated features
- How location is used
- How wardrobe photos are used
- How account deletion works
- Whether AI analysis can fall back to manual entry
- Any temporary provider limitations

Never include:

- Personal passwords
- Service-role keys
- Supabase access tokens
- Recovery links
- Private user data
- Internal developer credentials

---

# 18. Submit and Release

Before submission verify:

- Production URLs work
- Privacy and Support pages are public
- Account deletion works
- Privacy answers match the build
- Screenshots match the build
- Description contains no unsupported claims
- Version and build are correct
- No debug UI is visible
- No secrets are bundled
- Supabase production services are active

Manual release is the safest first-release option because it allows a final production check after approval.

Keep the Netlify application live before, during, and after the App Store release.

---

# 19. Post-Release Checks

After release:

- Install from the App Store
- Confirm authentication and native deep links
- Confirm location and weather
- Confirm wardrobe images
- Confirm AI/manual fallback
- Confirm account deletion
- Confirm privacy and support URLs
- Review crashes and diagnostics
- Monitor Supabase function failures and rate limits
- Preserve the public Netlify fallback

---

# 20. Git Workflow

After completing and verifying the Apple release:

```bash
git add .
git commit -m "Prepare Jacket Checker for App Store release"
git push
```

Do not commit:

- Certificates
- Private keys
- Provisioning profiles
- Apple API keys
- `.env`
- Supabase secrets
- Recovery links
- Xcode DerivedData
- Archives or exported IPA files

---

# 21. Current Free-Distribution Reminder

Until paid Apple distribution is chosen:

- The permanent public app is the Netlify deployment.
- The native app can run in the simulator.
- The native app can be installed on a personal iPhone with a Personal Team.
- Personal Team provisioning expires after seven days.
- Rebuild and reinstall through Xcode when the profile expires.
- Developer Mode is required for the development-signed app.
- The phone does not need to remain connected after installation.
