# Deploy as Firefox Extension

## Prerequisites

- Firefox browser installed
- Extension icons created (same as Chrome - see icon creation below)

## Step 1: Create Extension Icons

You need three icon sizes in the `public/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

Use the same icons created for Chrome extension. See `DEPLOY_CHROME_EXTENSION.md` for icon creation instructions.

## Step 2: Verify Manifest Compatibility

The existing `manifest.json` (Manifest V3) is compatible with Firefox 109+.

Check `public/manifest.json`:

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

## Step 4: Load Extension in Firefox (Development)

### Temporary Installation (for testing):

1. Open Firefox browser
2. Go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Navigate to the `dist` folder
5. Select `manifest.json`
6. The extension will be loaded (temporary - removed when Firefox closes)

### Test the Extension:

1. Click the extension icon in Firefox toolbar
2. Test all features:
   - Timer functionality
   - Task management
   - History and heatmap
   - Settings
   - Quotes display

## Step 5: Permanent Installation (Development)

For permanent local installation during development:

1. **Disable Signature Requirement** (Firefox Developer Edition or Nightly only):
   - Go to `about:config`
   - Search for `xpinstall.signatures.required`
   - Set to `false`

2. **Package Extension**:
   ```bash
   cd /Users/victor/Documents/react-projects/pomodoro/dist
   zip -r ../pomodoro-firefox.xpi .
   ```

3. **Install XPI**:
   - Go to `about:addons`
   - Click gear icon > Install Add-on From File
   - Select `pomodoro-firefox.xpi`

**Note**: Regular Firefox requires signed extensions. For development, use temporary installation or Firefox Developer Edition.

## Publishing to Firefox Add-ons (AMO)

### Prerequisites:
- Firefox account
- No registration fee (free!)
- Extension icons (already created)

### Publishing Steps:

1. **Create Firefox Account**
   - Go to https://addons.mozilla.org/
   - Sign up or log in

2. **Prepare Extension Package**
   ```bash
   cd /Users/victor/Documents/react-projects/pomodoro
   npm run build:extension
   cd dist
   zip -r ../pomodoro-firefox.zip .
   cd ..
   ```

3. **Submit to AMO**
   - Go to https://addons.mozilla.org/developers/
   - Click **Submit a New Add-on**
   - Choose **On this site** (for listed add-on)

4. **Upload Extension**
   - Upload `pomodoro-firefox.zip`
   - Mozilla will automatically validate the package

5. **Fill in Listing Information**
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
   - **Categories**: Productivity, Time Management
   - **Tags**: pomodoro, timer, productivity, focus, time-management

6. **Add Screenshots**
   - Upload 3-5 screenshots (any size, recommended 1280x800):
     - Timer view
     - Tasks view
     - History with heatmap
     - Settings view

7. **Privacy Policy**
   - Select: "This add-on does not collect any data"

8. **License**
   - Choose: MIT License (or your preference)

9. **Version Notes**
   ```
   Initial release with:
   - Pomodoro timer with customizable durations
   - Task management
   - History tracking with heatmap
   - Motivational quotes
   ```

10. **Submit for Review**
    - Click **Submit Version**
    - Automated review: ~10 minutes
    - Manual review (if needed): 1-5 days

## Updating the Extension

### For Development (Temporary):
1. Make code changes
2. Run `npm run build:extension`
3. Go to `about:debugging#/runtime/this-firefox`
4. Click **Reload** on your extension

### For Published Extension:
1. Update version in `manifest.json` (e.g., 1.0.0 → 1.1.0)
2. Build: `npm run build:extension`
3. Create new zip file
4. Go to https://addons.mozilla.org/developers/
5. Select your add-on
6. Click **Upload New Version**
7. Submit for review

## Firefox-Specific Considerations

### Manifest V3 Support
- Firefox 109+ supports Manifest V3
- Older Firefox versions need Manifest V2
- Current manifest works for modern Firefox

### Storage API
- Firefox uses same localStorage API
- No changes needed from Chrome version

### Notifications
- Firefox notification API is compatible
- Same code works in both browsers

## Troubleshooting

### Extension Not Loading
- Check Firefox version (109+ required for MV3)
- Verify all icon files exist
- Check manifest.json syntax

### Temporary Add-on Removed
- This is normal behavior
- Reload after each Firefox restart
- Or publish to AMO for permanent installation

### Popup Not Opening
- Check browser console for errors
- Verify index.html exists in dist
- Test in new Firefox profile

### Signature Verification Failed
- Use temporary installation for development
- Or use Firefox Developer Edition
- Or publish to AMO for signing

## Differences from Chrome

### Similarities:
- ✅ Same codebase works
- ✅ Same manifest.json
- ✅ Same permissions
- ✅ Same APIs (localStorage, notifications)

### Differences:
- Firefox requires signing for permanent installation
- Temporary installation removed on browser close
- Free to publish (no $5 fee like Chrome)
- Faster review process

## Testing Checklist

Before publishing, test in Firefox:
- ✅ Extension loads without errors
- ✅ Timer starts, pauses, resets correctly
- ✅ Tasks can be created and selected
- ✅ History displays correctly
- ✅ Heatmap renders properly
- ✅ Settings save and persist
- ✅ Quotes display and change
- ✅ Notifications work
- ✅ Data persists after browser restart

## Notes

- Firefox Add-ons (AMO) is free to publish
- Faster review than Chrome Web Store
- Automatic signing for listed add-ons
- Can distribute unlisted for private use
- All data stored locally
- No external dependencies

## Resources

- Firefox Extension Workshop: https://extensionworkshop.com/
- AMO Developer Hub: https://addons.mozilla.org/developers/
- Manifest V3 Guide: https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/
