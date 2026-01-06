# 🍅 Pomodoro Timer

A React + TypeScript Pomodoro timer with task management, history tracking, and customizable settings. Works as both a web app (GitHub Pages) and browser extension (Chrome, Firefox, Edge).

## Features

### Timer
- ⏱️ Customizable work/break durations
- 🔄 Auto-start options
- 🔔 Desktop notifications
- 📊 Session counter

### Tasks
- ✅ Create and manage tasks
- 🎨 Color-coded task labels
- 🎯 Associate timer sessions with tasks
- 📝 Track time per task

### History
- 📈 View all completed sessions
- 📊 Statistics by task
- ⏰ Total time and session counts
- 📅 Recent activity timeline

### Settings
- ⚙️ Customize timer durations
- 🔄 Auto-start preferences
- 💾 All settings saved to browser storage

### Data Persistence
- 💾 All data stored in browser localStorage
- 🔒 Data persists across sessions
- 📱 Works offline
- 🔄 No data loss on refresh

## Project Structure

```
pomodoro/
├── public/
│   └── manifest.json          # Browser extension manifest
├── src/
│   ├── App.tsx               # Main app with navigation
│   ├── Tasks.tsx             # Task management view
│   ├── History.tsx           # History and statistics view
│   ├── Settings.tsx          # Settings view
│   ├── types.ts              # TypeScript type definitions
│   ├── storage.ts            # localStorage wrapper
│   ├── App.css               # Styling
│   └── index.css             # Global styles
├── dist/                     # Build output
└── package.json
```

## Development

```bash
npm install          # Install dependencies
npm run dev          # Run development server
npm run build        # Build for production
```

## Browser Extension Builds

```bash
# Build for specific browser
npm run build:chrome
npm run build:edge
npm run build:firefox

# Build and package as .zip for store submission
npm run package:chrome    # Creates tomato-chrome.zip
npm run package:edge      # Creates tomato-edge.zip
npm run package:firefox   # Creates tomato-firefox.zip
```

## Deploy as GitHub Pages

### 1. Update vite.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/pomodoro/', // Your repo name
  // ... rest of config
})
```

### 2. Install gh-pages
```bash
npm install -D gh-pages
```

### 3. Add deploy script to package.json
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

### 4. Deploy
```bash
npm run deploy
```

Your app will be live at: `https://yourusername.github.io/pomodoro/`

## Install as Browser Extension

### Chrome / Edge

1. Build the extension:
   ```bash
   npm run build:extension
   ```

2. Open Chrome/Edge and go to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked"

5. Select the `dist` folder

6. The Pomodoro extension icon will appear in your toolbar

### Firefox

1. Build the extension:
   ```bash
   npm run build:extension
   ```

2. Open Firefox and go to: `about:debugging#/runtime/this-firefox`

3. Click "Load Temporary Add-on"

4. Navigate to `dist` folder and select `manifest.json`

5. The extension will be loaded (temporary - for permanent, you need to sign it)

### Firefox Permanent Installation

For permanent Firefox installation, you need to:
1. Package the extension as a .zip file
2. Submit to Mozilla Add-ons for signing
3. Or use Firefox Developer Edition with signing disabled

## Icons

The extension needs three icon sizes. Create these and place in `public/`:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

Quick icon creation:
- Use https://www.favicon-generator.org/
- Or create a simple tomato emoji screenshot
- Or use any image editor

## How It Works

### Pomodoro Technique
1. Work for 25 minutes
2. Take a 5-minute break
3. After 4 work sessions, take a 15-minute long break
4. Repeat

### Dual Build System

**GitHub Pages (Web App)**
- Uses `base: './'` in vite.config.ts
- Standard React build
- Deployed via gh-pages

**Browser Extension**
- Same build + manifest.json copied to dist
- Works as popup extension
- Requests notification permissions
- Uses Chrome Extension API (compatible with Firefox)

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Manifest V3)
- ✅ Firefox (Manifest V3 with compatibility)
- ❌ Internet Explorer (deprecated, no extension support)

**Note**: IE is no longer supported by Microsoft. Modern browsers only.

## Permissions

The extension requests:
- `notifications` - For timer completion alerts
- `storage` - For saving session count (future feature)

## Customization

Edit durations in `App.tsx`:
```typescript
const durations = {
  work: 25 * 60,      // 25 minutes
  break: 5 * 60,      // 5 minutes
  longBreak: 15 * 60  // 15 minutes
};
```

## Tech Stack

- React 19
- TypeScript
- Vite
- Browser Extension APIs
- GitHub Pages

## Future Enhancements

- [ ] Customizable timer durations
- [ ] Sound notifications
- [ ] Dark mode
- [ ] Statistics tracking
- [ ] Background timer (service worker)
- [ ] Sync across devices

---

**Status**: ✅ Complete and ready to build!
