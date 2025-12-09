# Deploy as Chrome Extension

## Prerequisites

- Chrome browser installed
- Extension icons created (see Icon Creation section)

## Step 1: Create Extension Icons

You need three icon sizes in the `public/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

### Quick Icon Creation Options:

**Option A: Use Favicon Generator**
1. Go to https://www.favicon-generator.org/
2. Upload a tomato emoji screenshot or image
3. Download and rename files to match required names

**Option B: Use Online Tool**
1. Go to https://www.canva.com/
2. Create 128x128 design with tomato emoji 🍅
3. Export as PNG
4. Resize to create 48x48 and 16x16 versions

**Option C: Use Emoji**
1. Take screenshot of 🍅 emoji
2. Use any image editor to resize to 128x128, 48x48, 16x16
3. Save as PNG files

## Step 2: Verify Manifest File

Check that `public/manifest.json` exists and is correct:

```json
{
  "manifest_version": 3,
  "name": "Pomodoro Timer",
  "version": "1.0.0",
  "description": "A simple Pomodoro timer to boost productivity",
  "action": {
    "default_popup": "index.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  },
  "permissions": [
    "notifications",
    "storage"
  ]
}
```

## Step 3: Build the Extension

```bash
cd /Users/victor/Documents/react-projects/pomodoro
npm run build:extension
```

This will:
1. Compile TypeScript
2. Build production bundle with Vite
3. Copy manifest.json to dist folder

## Step 4: Load Extension in Chrome (Development)

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Navigate to and select the `dist` folder
6. The Pomodoro Timer extension will appear in your extensions list

## Step 5: Test the Extension

1. Click the extension icon in Chrome toolbar
2. The Pomodoro timer popup should open
3. Test all features:
   - Timer start/pause/reset
   - Task creation and selection
   - History tracking
   - Settings changes
   - Quotes display

## Step 6: Pin Extension to Toolbar (Optional)

1. Click the puzzle piece icon in Chrome toolbar
2. Find "Pomodoro Timer"
3. Click the pin icon to keep it visible

## Publishing to Chrome Web Store (Optional)

### Prerequisites for Publishing:
- Google account
- One-time $5 developer registration fee
- Extension icons (already created)
- Privacy policy (if collecting data - not needed for this app)

### Publishing Steps:

1. **Register as Chrome Web Store Developer**
   - Go to https://chrome.google.com/webstore/devconsole
   - Pay $5 one-time registration fee
   - Complete developer profile

2. **Prepare Extension Package**
   ```bash
   cd /Users/victor/Documents/react-projects/pomodoro
   npm run build:extension
   cd dist
   zip -r ../pomodoro-extension.zip .
   cd ..
   ```

3. **Upload to Chrome Web Store**
   - Go to Chrome Web Store Developer Dashboard
   - Click **New Item**
   - Upload `pomodoro-extension.zip`

4. **Fill in Store Listing**
   - **Name**: Pomodoro Timer
   - **Summary**: Boost productivity with the Pomodoro Technique
   - **Description**: 
     ```
     A beautiful and functional Pomodoro timer to help you focus and manage your time effectively.

     Features:
     • Customizable work and break durations
     • Task management with color coding
     • Activity history and statistics
     • GitHub-style contribution heatmap
     • Motivational quotes
     • Desktop notifications
     • All data stored locally

     Perfect for students, professionals, and anyone looking to improve their productivity!
     ```
   - **Category**: Productivity
   - **Language**: English

5. **Add Screenshots**
   - Take 5 screenshots (1280x800 or 640x400):
     - Timer view
     - Tasks view
     - History view with heatmap
     - Settings view
     - Extension popup in action

6. **Add Promotional Images**
   - Small tile: 440x280
   - Large tile: 920x680
   - Marquee: 1400x560

7. **Privacy**
   - Select: "This extension does not collect user data"
   - No privacy policy needed

8. **Submit for Review**
   - Click **Submit for Review**
   - Review typically takes 1-3 business days

## Updating the Extension

### For Development (Unpacked):
1. Make code changes
2. Run `npm run build:extension`
3. Go to `chrome://extensions/`
4. Click the refresh icon on your extension

### For Published Extension:
1. Update version in `manifest.json`
2. Build: `npm run build:extension`
3. Create new zip file
4. Upload to Chrome Web Store Developer Dashboard
5. Submit updated version for review

## Troubleshooting

### Extension Not Loading
- Check that all icon files exist in `public/`
- Verify manifest.json is valid JSON
- Check browser console for errors

### Popup Not Opening
- Verify `index.html` exists in dist folder
- Check that build completed successfully
- Look for errors in extension details page

### Features Not Working
- Check that permissions are granted
- Test in incognito mode to rule out conflicts
- Check browser console in popup (right-click popup > Inspect)

### Data Not Persisting
- Verify localStorage is working
- Check that extension has storage permission
- Test in normal (non-incognito) window

## Notes

- Extension works offline
- All data stored locally in browser
- No external API calls
- No user tracking or analytics
- Completely free to use

## File Checklist

Before loading extension, ensure these files exist in `dist/`:
- ✅ index.html
- ✅ manifest.json
- ✅ icon16.png
- ✅ icon48.png
- ✅ icon128.png
- ✅ assets/index.js
- ✅ assets/index.css
- ✅ assets/quotes.json (bundled in JS)
