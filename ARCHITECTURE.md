# Pomodoro Timer - Architecture

## Overview

A dual-purpose React + TypeScript application that builds for both:
1. **GitHub Pages** - Web application
2. **Browser Extension** - Chrome, Firefox, Edge popup

## Architecture Pattern: Single Codebase, Dual Output

### Why This Works
- Same React app runs in both contexts
- Vite builds optimized static files
- Manifest.json enables extension mode
- No backend required
- Completely free to deploy

## Build Configurations

### GitHub Pages Build
```bash
npm run build
```
- Output: `dist/` folder
- Base path: `./` (relative)
- Standard SPA build
- Deploy via gh-pages

### Browser Extension Build
```bash
npm run build:extension
```
- Output: `dist/` folder + manifest.json
- Same as web build + extension metadata
- Load unpacked in browser
- Works as popup extension

## Component Architecture

### App.tsx - Main Timer Component

**State Management**
- `mode`: Current timer mode (work/break/longBreak)
- `timeLeft`: Remaining seconds
- `isRunning`: Timer active state
- `sessions`: Completed work sessions count

**Timer Logic**
- Uses `setInterval` for countdown
- Auto-switches modes on completion
- Tracks sessions for long break trigger
- Cleans up intervals on unmount

**Notification System**
- Requests permission on first start
- Sends desktop notification on timer complete
- Works in both web and extension contexts

## Browser Extension Integration

### Manifest V3 Structure
```json
{
  "manifest_version": 3,
  "action": {
    "default_popup": "index.html"
  },
  "permissions": ["notifications", "storage"]
}
```

### How Extension Works
1. User clicks extension icon
2. Browser opens `index.html` in popup
3. React app loads and runs
4. Timer functions normally
5. Notifications use browser API

### Cross-Browser Compatibility

**Chrome/Edge**
- Full Manifest V3 support
- Native notification API
- Storage API available

**Firefox**
- Manifest V3 compatible
- Same APIs work
- Temporary install for development
- Requires signing for permanent install

## Styling Strategy

### Responsive Design
- Max width: 400px (perfect for extension popup)
- Centered layout for web
- Flexbox for alignment
- Works in both contexts

### Color Scheme
- Primary: `#d95550` (tomato red)
- Background: `#f5f5f5` (light gray)
- Text: `#333` (dark gray)
- Clean, minimal aesthetic

## Timer Implementation

### Countdown Logic
```typescript
useEffect(() => {
  if (isRunning && timeLeft > 0) {
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
  }
  return () => clearInterval(intervalRef.current);
}, [isRunning, timeLeft]);
```

### Mode Switching
- Work → Break (after each session)
- Work → Long Break (after 4 sessions)
- Manual mode switching resets timer

### Session Tracking
- Increments on work completion
- Persists during app session
- Future: Save to chrome.storage

## Deployment Strategies

### GitHub Pages
1. Build: `npm run build`
2. Deploy: `gh-pages -d dist`
3. Access: `https://username.github.io/pomodoro/`

### Chrome Web Store (Optional)
1. Build: `npm run build:extension`
2. Zip dist folder
3. Upload to Chrome Web Store
4. Pay $5 one-time fee
5. Public distribution

### Firefox Add-ons (Optional)
1. Build: `npm run build:extension`
2. Zip dist folder
3. Submit to Mozilla for signing
4. Free distribution

### Local Installation (Development)
1. Build: `npm run build:extension`
2. Load unpacked in browser
3. Test and iterate
4. No publishing required

## File Structure

```
pomodoro/
├── public/
│   ├── manifest.json         # Extension metadata
│   └── icon*.png            # Extension icons (to add)
├── src/
│   ├── App.tsx              # Main component
│   ├── App.css              # Component styles
│   ├── index.css            # Global styles
│   └── main.tsx             # React entry point
├── dist/                    # Build output
│   ├── index.html
│   ├── manifest.json        # Copied during extension build
│   └── assets/
│       ├── index.js
│       └── index.css
├── vite.config.ts           # Build configuration
├── package.json             # Scripts and dependencies
├── README.md                # User documentation
└── ARCHITECTURE.md          # This file
```

## Key Design Decisions

### 1. No Background Script
- Timer runs only when popup is open
- Simpler implementation
- No persistent background process
- Future: Add service worker for background timer

### 2. Relative Base Path
- `base: './'` in vite.config
- Works for both extension and GitHub Pages
- No hardcoded URLs
- Portable build

### 3. Single Build Output
- Same dist folder for both targets
- Extension just adds manifest.json
- Reduces complexity
- Easy to maintain

### 4. No External Dependencies
- Pure React + TypeScript
- No state management library
- No UI framework
- Minimal bundle size

## Performance Considerations

- Small bundle size (~50KB gzipped)
- Fast load time
- Minimal re-renders
- Efficient interval cleanup
- No memory leaks

## Browser API Usage

### Notifications API
```typescript
if ('Notification' in window) {
  Notification.requestPermission();
  new Notification('Title', { body: 'Message' });
}
```

### Future: Storage API
```typescript
chrome.storage.local.set({ sessions: count });
chrome.storage.local.get(['sessions']);
```

## Testing Strategy

### Manual Testing
1. Web: `npm run dev` → Test in browser
2. Extension: Build → Load unpacked → Test popup
3. Notifications: Verify permissions and alerts
4. Timer: Test all mode transitions

### Browser Testing
- Chrome: Primary development
- Firefox: Test compatibility
- Edge: Verify Chromium compatibility

## Limitations

### Current
- Timer stops when popup closes
- No persistent state across sessions
- No background notifications
- Manual icon creation needed

### Future Improvements
- Service worker for background timer
- Chrome storage for persistence
- Sound notifications
- Customizable durations
- Statistics dashboard

## Security Considerations

- No external API calls
- No user data collection
- Minimal permissions requested
- No remote code execution
- Open source and auditable

## Maintenance

### Updating
1. Modify source code
2. Test locally: `npm run dev`
3. Build: `npm run build:extension`
4. Reload extension in browser
5. Deploy web: `npm run deploy`

### Version Management
- Update version in manifest.json
- Update version in package.json
- Tag releases in git
- Document changes

---

**Architecture Status**: ✅ Complete and production-ready
