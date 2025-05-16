# cPanel Deployment Guide for Node.js Express API

This guide will help you deploy your Node.js TypeScript backend API to a cPanel hosting environment.

## Prerequisites

1. A cPanel hosting account with Node.js support
2. SSH access to your cPanel server (optional but helpful)
3. Your Node.js Express application codebase

## Step 1: Prepare Your Application

Before deploying, make sure your application is ready:

1. Run `npm run build` locally to ensure your TypeScript compiles without errors
2. Test your application locally with `npm start`
3. Make sure all environment variables are properly configured

## Step 2: Upload Your Application to cPanel

There are several ways to upload your application:

### Using File Manager in cPanel

1. Log in to your cPanel account
2. Navigate to the File Manager
3. Go to the directory where you want to deploy your application (usually in `public_html` or a subdomain directory)
4. Upload all your project files (except `node_modules` folder)

### Using Git (if available in your cPanel)

1. Set up a Git repository in cPanel
2. Add your cPanel server as a remote in your local Git repository
3. Push your code to the cPanel remote

### Using FTP/SFTP

1. Use an FTP client like FileZilla
2. Connect to your cPanel server using your FTP credentials
3. Upload all your project files (except `node_modules` folder)

## Step 3: Set Up Node.js App in cPanel

1. In cPanel, find and click on "Setup Node.js App"
2. Click "Create Application"
3. Fill in the form:
   - Application root: Path to your application (e.g., `/home/username/public_html/api`)
   - Application URL: The URL where your app will be accessible
   - Application startup file: Enter `server.js` (or `app.js` as fallback)
   - Node.js version: Select the appropriate version (should match your local development version)
   - Environment variables: Add any necessary environment variables like `NODE_ENV=production`
4. Click "Create" to save the application configuration

## Step 4: Install Dependencies and Build

You'll need to install dependencies and build your TypeScript code on the server:

1. SSH into your cPanel server (if you have SSH access)
2. Navigate to your application directory
3. Run the following commands:
   ```
   npm install
   npm run build
   ```

If you don't have SSH access, you can create a setup script through cPanel's "Node.js App" interface:

1. Go to the "Setup Node.js App" section in cPanel
2. Click on your application
3. In the "Run NPM" field, execute these commands one by one:
   - `install --production`
   - `run build`

## Step 5: Start Your Application

1. In cPanel's "Setup Node.js App" section, click on your application
2. Click the "Start" button to start your Node.js application
3. Your application should now be running and accessible via the URL you configured

## Troubleshooting

### Application Won't Start

1. Check application logs in cPanel's "Setup Node.js App" section
2. Verify that all required environment variables are set
3. Make sure your `.htaccess` file is properly configured

### 502 Bad Gateway

1. Check if your Node.js application is running
2. Verify the port in your `.htaccess` file matches the port in your application
3. Make sure the proxy settings in `.htaccess` are correct

### Missing Dependencies

If you're seeing errors about missing dependencies:
1. SSH into your server and run `npm install` again
2. Make sure your `package.json` file includes all dependencies

## Notes

- The `.htaccess` file created in your project root redirects HTTP requests to your Node.js application
- The `server.js` and `app.js` files serve as entry points for cPanel's Node.js application handler
- Remember to set all your environment variables in the cPanel Node.js App configuration

For additional help, contact your hosting provider's support team.