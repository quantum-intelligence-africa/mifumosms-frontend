# Deployment Guide - Mifumo Connect

This guide explains how to deploy your React SPA and fix the "Page Not Found" issues when refreshing or accessing routes directly.

## The Problem

Single Page Applications (SPAs) using client-side routing (React Router) face a common issue: when users refresh the page or access a route directly (like `/dashboard` or `/login`), the server looks for a physical file at that path, which doesn't exist, resulting in a 404 error.

## The Solution

We've implemented redirect rules for different hosting platforms to ensure all routes are handled by `index.html`, allowing React Router to handle the routing client-side.

## Files Created

### 1. `public/_redirects` (Netlify)
- Redirects all routes to `index.html` with a 200 status
- Automatically copied to `dist/` during build

### 2. `vercel.json` (Vercel)
- Rewrites all routes to `index.html`
- Includes cache headers for static assets

### 3. `public/.htaccess` (Apache Servers)
- Uses mod_rewrite to redirect all non-file requests to `index.html`
- Includes cache headers for better performance

## Deployment Instructions

### Netlify Deployment

1. **Build your project:**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to Netlify
   - The `_redirects` file is automatically included
   - No additional configuration needed

3. **Alternative: Connect Git Repository**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

### Vercel Deployment

1. **Build your project:**
   ```bash
   npm run build
   ```

2. **Deploy using Vercel CLI:**
   ```bash
   npx vercel --prod
   ```

3. **Or connect Git repository:**
   - The `vercel.json` file will be automatically detected
   - Build command: `npm run build`
   - Output directory: `dist`

### Apache Server Deployment

1. **Build your project:**
   ```bash
   npm run build
   ```

2. **Upload the `dist` folder contents** to your web server
   - The `.htaccess` file will handle routing
   - Ensure mod_rewrite is enabled on your Apache server

### Other Static Hosting Services

For other hosting services (GitHub Pages, Firebase Hosting, etc.), you may need to:

1. **Check their SPA documentation** for specific configuration
2. **Use the `_redirects` file pattern** as a reference
3. **Configure their routing rules** to serve `index.html` for all routes

## Testing the Fix

After deployment:

1. **Visit your main domain** (should work)
2. **Navigate to a route** like `/dashboard` (should work)
3. **Refresh the page** (should work now, not show 404)
4. **Access routes directly** by typing URLs (should work)

## Build Configuration

The `vite.config.ts` has been updated to:
- Ensure proper asset handling
- Copy public files (including routing files) to dist
- Optimize build output for SPA deployment

## Troubleshooting

### Still Getting 404 Errors?

1. **Check if routing files are in your build output:**
   - Look for `_redirects` in your `dist` folder
   - Verify `.htaccess` is present for Apache servers

2. **Verify hosting platform configuration:**
   - Some platforms require specific settings in their dashboard
   - Check their SPA/routing documentation

3. **Check server configuration:**
   - Ensure mod_rewrite is enabled (Apache)
   - Verify the hosting platform supports redirects

### Console Errors?

1. **Check asset paths** in browser developer tools
2. **Verify API endpoints** are correctly configured
3. **Check for CORS issues** if using external APIs

## Additional Notes

- The routing fix maintains SEO-friendly URLs
- Static assets are properly cached
- The solution works with all React Router features
- No changes needed to your React code

## Support

If you continue experiencing issues:
1. Check the browser console for errors
2. Verify the hosting platform's specific requirements
3. Ensure all build files are properly uploaded
4. Test with a simple route first (like `/login`)
