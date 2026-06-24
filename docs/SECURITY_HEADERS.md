# Security headers

`public/_headers` contains the production defaults for hosts that support Netlify-style header files. Other hosts should translate the same values into their own configuration.

The Content Security Policy permits only the application itself, Supabase HTTPS/WebSocket endpoints, private signed Supabase image URLs, and WeatherAPI condition icons. It blocks frames, plugins, arbitrary scripts, retailer domains, and third-party analytics.

Before production, confirm the deployed response includes the headers with the browser network inspector or:

```bash
curl -I https://YOUR_DEPLOYED_DOMAIN
```

Do not weaken `script-src`, `frame-ancestors`, or `object-src` to work around unrelated deployment issues.
