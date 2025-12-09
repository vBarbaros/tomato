# Install Pomodoro Timer as Chrome Extension

## Step 1: Generate Icons

1. Open `generate-icons.html` in your browser
2. The icons will auto-download, or right-click each canvas and save as:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
3. Move all three PNG files to the `public/` folder

## Step 2: Build the Extension

```bash
npm run build:extension
```

This will create a `dist/` folder with all the necessary files.

## Step 3: Install in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right corner)
3. Click **Load unpacked**
4. Select the `dist` folder from this project
5. The Pomodoro Timer extension will appear in your toolbar

## Step 4: Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome toolbar
2. Find "Pomodoro Timer"
3. Click the pin icon to keep it visible

## Usage

- Click the extension icon to open the Pomodoro timer
- The timer works as a popup window
- All data is saved locally in your browser

## Updating the Extension

After making changes:

1. Run `npm run build:extension` again
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Pomodoro Timer card

## Notes

- This is a local installation (not from Chrome Web Store)
- The extension will remain installed until you remove it
- No internet connection required after installation
