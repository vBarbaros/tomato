# Deploy as Microsoft Edge Extension

## Build Commands

```bash
# Build for Edge
npm run build:edge

# Build and package as .zip for Edge Add-ons
npm run package:edge
```

## Local Development

1. Build the extension:
   ```bash
   npm run build:edge
   ```

2. Open Edge and go to `edge://extensions/`

3. Enable **Developer mode** (toggle in left sidebar)

4. Click **Load unpacked** and select the `dist` folder

5. Pin the extension to your toolbar (puzzle icon → eye icon)

## Publishing to Microsoft Edge Add-ons

### Prerequisites
- Microsoft account
- Microsoft Partner Center account (free registration)
- No registration fee

### Steps

1. **Register as Developer**
   - Go to https://partner.microsoft.com/dashboard/microsoftedge/
   - Sign in with Microsoft account
   - Complete registration (free)

2. **Package the Extension**
   ```bash
   npm run package:edge
   ```
   This creates `tomato-edge.zip` in the project root.

3. **Submit to Edge Add-ons**
   - Go to Partner Center Dashboard
   - Click **Create new extension**
   - Upload `tomato-edge.zip`

4. **Fill in Store Listing**
   - Display name: Tomato Timer
   - Short description: Boost productivity with the Pomodoro Technique
   - Category: Productivity
   - Language: English

5. **Add Screenshots** (1280x800 or 640x400)
   - Timer view
   - Tasks view
   - History view
   - Settings view

6. **Store Logo**
   - 300x300 PNG (use upscaled icon128.png)

7. **Privacy Settings**
   - Select: "This extension does not collect user data"

8. **Pricing**: Free

9. **Submit for Certification**
   - Certification typically takes 1-3 business days

## Updating a Published Extension

1. Update version in `public/manifest.edge.json`
2. Run `npm run package:edge`
3. Go to Partner Center Dashboard
4. Select your extension → **Update**
5. Upload new package and submit

## Troubleshooting

- **Extension not loading**: Verify all icon files exist in `public/`
- **Popup not opening**: Check that `dist/` contains all required files
- **Certification rejected**: Read rejection email for specific issues

## Notes

- Edge Add-ons is free to publish (no $5 fee like Chrome)
- Same Chromium engine as Chrome
- Faster certification process than Chrome
