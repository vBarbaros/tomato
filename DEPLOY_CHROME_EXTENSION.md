# Deploy as Chrome Extension

## Build Commands

```bash
# Build for Chrome
npm run build:chrome

# Build and package as .zip for Chrome Web Store
npm run package:chrome
```

## Local Development

1. Build the extension:
   ```bash
   npm run build:chrome
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right)

4. Click **Load unpacked** and select the `dist` folder

5. Pin the extension to your toolbar (puzzle icon → pin)

## Publishing to Chrome Web Store

### Prerequisites
- Google account
- One-time $5 developer registration fee

### Steps

1. **Register as Developer**
   - Go to https://chrome.google.com/webstore/devconsole
   - Pay $5 registration fee
   - Complete developer profile

2. **Package the Extension**
   ```bash
   npm run package:chrome
   ```
   This creates `tomato-chrome.zip` in the project root.

3. **Upload to Chrome Web Store**
   - Go to Chrome Web Store Developer Dashboard
   - Click **New Item**
   - Upload `tomato-chrome.zip`

4. **Fill in Store Listing**
   - Name: Tomato Timer
   - Summary: Boost productivity with the Pomodoro Technique
   - Category: Productivity
   - Language: English

5. **Add Screenshots** (1280x800 or 640x400)
   - Timer view
   - Tasks view
   - History view
   - Settings view

6. **Privacy**
   - Select: "This extension does not collect user data"

7. **Submit for Review**
   - Review typically takes 1-3 business days

## Updating a Published Extension

1. Update version in `public/manifest.chrome.json`
2. Run `npm run package:chrome`
3. Upload new zip to Developer Dashboard
4. Submit for review

## Troubleshooting

- **Extension not loading**: Check that all icon files exist in `public/`
- **Popup not opening**: Verify `dist/` contains all required files
- **Features not working**: Check browser console (right-click popup → Inspect)
