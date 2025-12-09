# Deploy to GitHub Pages

## Prerequisites

- Git installed
- GitHub account
- Node.js and npm installed

## Step 1: Update Vite Configuration

Edit `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/pomodoro/', // Replace 'pomodoro' with your repository name
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})
```

## Step 2: Install gh-pages

```bash
npm install -D gh-pages
```

## Step 3: Add Deploy Script

Edit `package.json` and add the deploy script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "fetch-data": "tsx scripts/fetch-data.ts",
    "build:extension": "tsc -b && vite build && npm run copy-manifest",
    "copy-manifest": "cp public/manifest.json dist/",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

## Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `pomodoro` (or your chosen name)
3. Don't initialize with README (we already have files)

## Step 5: Initialize Git and Push

```bash
cd /Users/victor/Documents/react-projects/pomodoro

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Pomodoro Timer"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/pomodoro.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 6: Deploy to GitHub Pages

```bash
npm run deploy
```

This will:
1. Build the production version
2. Create a `gh-pages` branch
3. Push the built files to that branch

## Step 7: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll to **Pages** section (left sidebar)
4. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
5. Click **Save**

## Step 8: Access Your App

Your app will be available at:
```
https://YOUR_USERNAME.github.io/pomodoro/
```

Wait 1-2 minutes for the first deployment to complete.

## Updating Your Deployment

Whenever you make changes:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push origin main

# Deploy updated version
npm run deploy
```

## Troubleshooting

### Blank Page After Deployment

- Check that `base` in `vite.config.ts` matches your repository name
- Ensure it starts and ends with `/`
- Example: `base: '/pomodoro/'`

### 404 Errors

- Verify GitHub Pages is enabled in repository settings
- Check that `gh-pages` branch exists
- Wait a few minutes for GitHub to process the deployment

### Assets Not Loading

- Verify `base` path in `vite.config.ts`
- Check browser console for 404 errors
- Ensure all imports use relative paths

## Custom Domain (Optional)

1. Add a `CNAME` file to `public/` folder with your domain:
   ```
   pomodoro.yourdomain.com
   ```

2. Configure DNS with your domain provider:
   - Add CNAME record pointing to `YOUR_USERNAME.github.io`

3. In GitHub repository settings > Pages:
   - Enter your custom domain
   - Enable "Enforce HTTPS"

## Notes

- All data is stored in browser localStorage
- No backend server required
- Completely free hosting
- Automatic HTTPS
- Fast CDN delivery

## Verification

After deployment, test:
- ✅ Timer functionality
- ✅ Task creation and selection
- ✅ History tracking
- ✅ Settings persistence
- ✅ Quotes display
- ✅ All navigation tabs work
