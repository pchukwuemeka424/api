// This is the entry point for cPanel Node.js App deployment
// It simply requires the compiled dist/index.js file

try {
  // Require the compiled Express app from the dist directory
  require('./dist/index.js');
  console.log('Application started successfully through cPanel');
} catch (error) {
  console.error('Failed to start application:', error);
}