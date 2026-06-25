# Known Limitations

- Recommendations depend on third-party forecast accuracy and hourly forecast coverage.
- Browser geolocation requires permission and may be unavailable or imprecise.
- AI jacket analysis can misclassify visual attributes; users must be able to correct details before saving.
- Manual jacket entry is the reliable fallback when AI providers are unavailable.
- Embedding similarity is optional and can be delayed, stale, or unavailable without blocking jacket use.
- Style trends are internally curated rules rather than live external fashion scraping.
- Guest recommendation history is not persisted to an account.
- Private images use temporary signed URLs and may briefly show a fallback while refreshing.
- Developer pages require both a production build flag and server authorization; they are not normal user features.
- Existing legacy non-jacket database rows may be preserved, but the current product UI and recommendation engine are jacket-only.
- Full wardrobe outfit generation, shopping, retailer links, pricing, affiliate links, and automatic background removal are outside the MVP.
- The application does not replace professional weather or safety guidance for severe conditions.

## Developer owner transfer

The current developer-access UI supports one protected Owner and any number of Admin accounts. It does not provide an in-app ownership-transfer action. The active Owner cannot revoke or delete itself through normal application flows. A future ownership transfer must be handled as a deliberate server-side maintenance operation before the original Owner account is removed.
