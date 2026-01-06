# Deploy as Firefox Extension

## Build Commands

```bash
# Build for Firefox
npm run build:firefox

# Build and package as .zip for Firefox Add-ons
npm run package:firefox
```

## Local Development (Temporary Installation)

1. Build the extension:
   ```bash
   npm run build:firefox
   ```

2. Open Firefox and go to `about:debugging#/runtime/this-firefox`

3. Click **Load Temporary Add-on**

4. Navigate to `dist/` and select `manifest.json`

5. The extension loads temporarily (removed when Firefox closes)

## Publishing to Firefox Add-ons (AMO)

### Prerequisites
- Firefox account
- No registration fee

### Steps

1. **Create Firefox Account**
   - Go to https://addons.mozilla.org/
   - Sign up or log in

2. **Package the Extension**
   ```bash
   npm run package:firefox
   ```
   This creates `tomato-firefox.zip` in the project root.

3. **Submit to AMO**
   - Go to https://addons.mozilla.org/developers/
   - Click **Submit a New Add-on**
   - Choose **On this site** (for listed add-on)
   - Upload `tomato-firefox.zip`

4. **Fill in Listing Information**
   - Name: Tomato Timer
   - Summary: Boost productivity with the Pomodoro Technique
   - Categories: Productivity, Time Management
   - Tags: pomodoro, timer, productivity, focus

5. **Add Screenshots** (recommended 1280x800)
   - Timer view
   - Tasks view
   - History view
   - Settings view

6. **Privacy Policy**
   - Select: "This add-on does not collect any data"

7. **License**: MIT License (or your preference)

8. **Submit for Review**
   - Automated review: ~10 minutes
   - Manual review (if needed): 1-5 days

## Updating a Published Extension

1. Update version in `public/manifest.firefox.json`
2. Run `npm run package:firefox`
3. Go to https://addons.mozilla.org/developers/
4. Select your add-on → **Upload New Version**
5. Submit for review

## Firefox-Specific Notes

- Firefox uses `scripts` array instead of `service_worker` for background scripts
- The `offscreen` permission is not supported in Firefox (excluded from Firefox manifest)
- Requires `browser_specific_settings.gecko.id` for permanent installation
- Temporary add-ons are removed when Firefox closes

## Troubleshooting

- **Extension not loading**: Check Firefox version (109+ required for Manifest V3)
- **Temporary add-on removed**: This is normal; reload after Firefox restart or publish to AMO
- **Signature verification failed**: Use temporary installation for dev, or publish to AMO for signing

## Notes

- Firefox Add-ons (AMO) is free to publish
- Faster review process than Chrome
- Automatic signing for listed add-ons
