# Specification

## Summary
**Goal:** Serve a static `app-ads.txt` file for Google AdMob verification at the root path of the FruitMatch app.

**Planned changes:**
- Add a static `app-ads.txt` file to the `frontend/public` directory with the exact content: `google.com, pub-7936595519986908, DIRECT, f08c47fec0942fa0`

**User-visible outcome:** The file is accessible at `https://fruitmatch-1cz.caffeine.xyz/app-ads.txt` as plain text, enabling Google AdMob to verify the app's ad publisher identity.
