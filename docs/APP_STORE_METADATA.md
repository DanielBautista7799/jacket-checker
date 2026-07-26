# Jacket Checker App Store Metadata

This file is the submission-ready copy and configuration worksheet for the first iOS release.

## Product identity

- App name: `Jacket Checker`
- Bundle ID: `com.danielbautista.jacketchecker`
- Version: `1.0`
- Build: `1`
- Primary category: Weather
- Secondary category: Lifestyle
- Age rating target: 4+
- Copyright: `2026 Daniel Bautista`

## URLs

- Marketing URL: `https://jacketchecker.netlify.app/`
- Support URL: `https://jacketchecker.netlify.app/support`
- Privacy Policy URL: `https://jacketchecker.netlify.app/privacy`

Deploy the web build containing `/privacy` and `/support` before entering these URLs in App Store Connect.

## Subtitle

`Weather-aware jacket picks`

## Promotional text

Know whether you need a jacket, understand why, and get the best match from the jackets you already own.

## Keywords

`jacket,weather,forecast,wardrobe,coat,rain,wind,temperature,outfit,style`

## App Store description

Jacket Checker turns live and forecast weather into a clear YES or NO jacket decision.

Guest Mode is fast and does not require an account. Search for a place or use your current location, choose a forecast window, and get a concise recommendation based on temperature, feels-like conditions, rain, wind, and expected changes.

Create an account to unlock personalized recommendations. Save your comfort preferences, style direction, default location, and a private wardrobe of jackets you already own. Jacket Checker ranks eligible jackets against the selected forecast and explains why the strongest option fits the weather.

Personalized features include:

- Forecast-aware YES or NO decisions
- Current, today, tomorrow, and tomorrow-night windows
- Private jacket wardrobe and images
- AI-assisted jacket analysis with manual review
- Ranked owned-jacket recommendations
- Style guidance based on your selected jacket
- Recommendation history and feedback learning
- Secure email/password authentication
- In-app password recovery and account management
- Permanent account deletion from Profile settings

Jacket Checker does not include ads, shopping links, affiliate links, or cross-app tracking. Its purpose is simple: answer whether you need a jacket and help you choose the best one you already own.

Weather information depends on provider availability and forecast accuracy. AI-assisted jacket details should be reviewed before saving.

## First release notes

Initial iOS release of Jacket Checker with guest weather checks, personalized profiles, private jacket wardrobes, ranked recommendations, account recovery, secure deep links, and native location support.

## Screenshot plan

Capture at least five polished portrait screenshots on the required current large-iPhone simulator size. Because the target currently supports iPad, also capture at least one 13-inch iPad screenshot before submission.

Recommended sequence:

1. Guest Mode location and forecast selection
2. Guest YES or NO result
3. Personalized recommendation with selected owned jacket
4. Private wardrobe grid
5. Profile and comfort preferences
6. Recommendation history
7. Account security and privacy controls

Do not include real email addresses, private recovery links, access tokens, API keys, or another person's wardrobe images.

## App Review notes

Jacket Checker has a fully usable Guest Mode that does not require authentication.

Personalized features require an account. Before submission, create a dedicated reviewer account and place its credentials only in the App Review Information fields in App Store Connect. Do not place reviewer credentials in source control or this document.

Recommended review path:

1. Open Guest Mode and run a weather check.
2. Sign in with the supplied reviewer account.
3. Open Wardrobe to view private test jackets.
4. Run a personalized check from Today.
5. Open Profile to review account-security and deletion controls.

Location access is optional. Reviewers can search for a city when they do not grant location permission.

## App privacy worksheet

Use this as a conservative starting point and confirm the final answers against the production behavior before submission.

### Tracking

- Data used to track users across apps or websites: No
- Advertising: No
- Third-party advertising: No
- Data sold: No

### Data linked to the user

Potentially disclose these categories for authenticated features:

- Contact Info: Email Address
- Identifiers: User ID
- User Content: Photos or Videos, Other User Content
- Location: Precise Location and Coarse Location for requested weather checks and saved places
- Usage Data: Product Interaction when analytics is enabled

Purposes:

- App Functionality
- Analytics, only for the privacy-safe analytics behavior actually enabled in production
- Fraud Prevention, Security, and Compliance where applicable

### Data not linked to the user

Guest analytics may use a randomly generated local guest identifier. Confirm whether App Store Connect should classify this as unlinked Usage Data based on the exact production analytics payload.

### Important review before submission

Verify the final App Store privacy answers against:

- Supabase tables and Storage
- Edge Function logs
- WeatherAPI requests
- Gemini or OpenAI jacket-analysis requests
- Netlify request logs
- The user's analytics preference behavior

The public privacy policy must match the answers entered in App Store Connect.
