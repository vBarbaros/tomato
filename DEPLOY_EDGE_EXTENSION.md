# Deploy as Microsoft Edge Extension

## Prerequisites

- Microsoft Edge browser installed
- Extension icons created (same as Chrome)
- Microsoft account

## Overview

Microsoft Edge uses Chromium engine and supports the same extensions as Chrome. The deployment process is nearly identical to Chrome.

## Step 1: Create Extension Icons

You need three icon sizes in the `public/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

Use the same icons created for Chrome extension. See `DEPLOY_CHROME_EXTENSION.md` for icon creation instructions.

## Step 2: Verify Manifest File

The same `manifest.json` used for Chrome works for Edge:

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

## Step 4: Load Extension in Edge (Development)

1. Open Microsoft Edge browser
2. Go to `edge://extensions/`
3. Enable **Developer mode** (toggle in left sidebar)
4. Click **Load unpacked**
5. Navigate to and select the `dist` folder
6. The Pomodoro Timer extension will appear in your extensions list

## Step 5: Test the Extension

1. Click the extension icon in Edge toolbar
2. Test all features:
   - Timer functionality
   - Task management
   - History and heatmap
   - Settings
   - Quotes display

## Step 6: Pin Extension to Toolbar (Optional)

1. Click the puzzle piece icon in Edge toolbar
2. Find "Pomodoro Timer"
3. Click the eye icon to show in toolbar

## Publishing to Microsoft Edge Add-ons Store

### Prerequisites for Publishing:
- Microsoft account (free)
- Microsoft Partner Center account (free registration)
- Extension icons (already created)
- No registration fee (FREE!)

### Publishing Steps:

1. **Register as Edge Add-ons Developer**
   - Go to https://partner.microsoft.com/dashboard/microsoftedge/
   - Sign in with Microsoft account
   - Complete registration (free, no fee)
   - Accept developer agreement

2. **Prepare Extension Package**
   ```bash
   cd /Users/victor/Documents/react-projects/pomodoro
   npm run build:extension
   cd dist
   zip -r ../pomodoro-edge.zip .
   cd ..
   ```

3. **Submit to Edge Add-ons**
   - Go to Partner Center Dashboard
   - Click **Create new extension**
   - Upload `pomodoro-edge.zip`

4. **Fill in Store Listing**
   - **Display name**: Pomodoro Timer
   - **Short description**: Boost productivity with the Pomodoro Technique
   - **Detailed description**:
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

     How to use:
     1. Click the extension icon to open the timer
     2. Create tasks in the Tasks tab
     3. Select a task and start the timer
     4. View your progress in the History tab
     5. Customize durations in Settings

     The Pomodoro Technique helps you:
     - Break work into focused intervals
     - Take regular breaks to stay fresh
     - Track your productivity over time
     - Build better work habits

     All your data is stored locally on your device. No account required, no data collection.
     ```
   - **Category**: Productivity
   - **Language**: English

5. **Add Visual Assets**
   
   **Screenshots** (1280x800 or 640x400):
   - Upload 3-5 screenshots showing:
     - Timer view
     - Tasks view
     - History with heatmap
     - Settings view
     - Extension in action

   **Store Logos**:
   - 300x300 PNG (required)
   - Use your 128x128 icon, upscaled

6. **Privacy Settings**
   - **Privacy policy URL**: Not required (no data collection)
   - **Data collection**: Select "This extension does not collect user data"

7. **Pricing**
   - Select: **Free**

8. **Age Rating**
   - Select: **Everyone**

9. **Availability**
   - **Markets**: Select all or specific countries
   - **Visibility**: Public

10. **Submit for Certification**
    - Review all information
    - Click **Submit for certification**
    - Certification typically takes 1-3 business days

## Certification Process

### What Microsoft Reviews:
- Extension functionality
- Manifest accuracy
- Privacy compliance
- Content policy compliance
- Security checks

### Timeline:
- Automated checks: Immediate
- Manual review: 1-3 business days
- You'll receive email notification when approved

## Updating the Extension

### For Development (Unpacked):
1. Make code changes
2. Run `npm run build:extension`
3. Go to `edge://extensions/`
4. Click the refresh icon on your extension

### For Published Extension:
1. Update version in `manifest.json` (e.g., 1.0.0 → 1.1.0)
2. Build: `npm run build:extension`
3. Create new zip file
4. Go to Partner Center Dashboard
5. Select your extension
6. Click **Update**
7. Upload new package
8. Update version notes
9. Submit for certification

## Troubleshooting

### Extension Not Loading
- Verify all icon files exist in `public/`
- Check manifest.json is valid JSON
- Look for errors in `edge://extensions/`

### Popup Not Opening
- Check that index.html exists in dist
- Verify build completed successfully
- Inspect popup (right-click > Inspect)

### Certification Rejected
- Read rejection email carefully
- Common issues:
  - Missing or incorrect icons
  - Manifest errors
  - Privacy policy issues (shouldn't apply here)
- Fix issues and resubmit

### Features Not Working
- Test in InPrivate mode to rule out conflicts
- Check browser console for errors
- Verify permissions are granted

## Edge vs Chrome Comparison

### Similarities:
- ✅ Same Chromium engine
- ✅ Same manifest.json
- ✅ Same APIs
- ✅ Same codebase
- ✅ Same build process

### Differences:
- ✅ Edge Add-ons is FREE (Chrome charges $5)
- ✅ Faster certification process
- ✅ Smaller store (less competition)
- ✅ Good for reaching Edge users

## Cross-Browser Strategy

You can publish the SAME extension to:
1. **Chrome Web Store** ($5 one-time fee)
2. **Edge Add-ons** (FREE)
3. **Firefox Add-ons** (FREE)

Same codebase, same build, different stores!

## Benefits of Publishing to Edge

- ✅ Free to publish (no registration fee)
- ✅ Reaches Edge users (growing market share)
- ✅ Fast certification process
- ✅ Less competition than Chrome Web Store
- ✅ Same extension works on Chrome too

## Testing Checklist

Before publishing, test in Edge:
- ✅ Extension loads without errors
- ✅ Timer works correctly
- ✅ Tasks can be created and managed
- ✅ History displays properly
- ✅ Heatmap renders correctly
- ✅ Settings save and persist
- ✅ Quotes display and update
- ✅ Notifications work
- ✅ Data persists after browser restart
- ✅ Works in InPrivate mode

## Notes

- Edge Add-ons store is completely free
- No registration fee (unlike Chrome's $5)
- Fast review process
- Growing user base
- Same extension works on Chrome
- All data stored locally
- No external dependencies

## Resources

- Edge Add-ons Developer: https://developer.microsoft.com/microsoft-edge/extensions/
- Partner Center: https://partner.microsoft.com/dashboard/microsoftedge/
- Extension Documentation: https://docs.microsoft.com/microsoft-edge/extensions-chromium/
- Publish Guide: https://docs.microsoft.com/microsoft-edge/extensions-chromium/publish/publish-extension

## File Checklist

Before loading extension, ensure these files exist in `dist/`:
- ✅ index.html
- ✅ manifest.json
- ✅ icon16.png
- ✅ icon48.png
- ✅ icon128.png
- ✅ assets/index.js
- ✅ assets/index.css
