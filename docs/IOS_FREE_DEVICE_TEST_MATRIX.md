# Jacket Checker Free iPhone Test Matrix

Complete the blocking checks on both an iPhone simulator and, when available, the owner's physical iPhone.

## Installation and lifecycle

- Fresh install opens without a blank screen
- Text-only launch screen appears cleanly
- App opens after force quit
- App returns correctly from the background
- Session restores after close and reopen
- No scene-lifecycle warning appears
- Pages fit the device width without horizontal panning

## Guest mode

- Search for and select a city
- Run current, today, tomorrow, and tomorrow-night checks
- Receive both YES and NO recommendations using suitable test locations
- Grant foreground location permission and use current location
- Deny location permission and confirm city search remains available
- Disconnect and restore the network and confirm recovery

## Authentication

- Create a disposable test account
- Confirm a signup link opens Jacket Checker
- Sign in and sign out
- Request a password reset
- Confirm the recovery link opens Jacket Checker
- Change the password and sign in with the new password
- Request and confirm an email change
- Repeat one callback with the app already open
- Repeat one callback after force quitting the app

## Personalized features

- Save and edit profile preferences
- Add a wardrobe item
- Upload and remove a private wardrobe image
- Run a personalized recommendation
- Select an alternate ranked jacket when available
- Submit recommendation feedback
- Review and delete history
- Archive, restore, and delete a wardrobe item
- Delete the disposable test account

## Device behavior

- Portrait layout
- Light appearance
- Dark appearance
- Larger Dynamic Type
- VoiceOver on the core guest flow
- Reduced Motion
- Low Power Mode
- Permission changed from iOS Settings

## Public web app

- Production URL loads
- `/privacy` loads
- `/support` loads
- Add to Home Screen succeeds
- Home Screen launch opens the production app cleanly
