import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { supabase } from '../config/supabase';

const router = express.Router();

// Auth routes
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);

// Debug routes
router.post('/debug-signup', AuthController.debugSignup);

// Direct Supabase signup test (bypassing the model layer)
router.post('/direct-signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    console.log('Testing direct Supabase signup with:', { email });
    
    // Use Supabase auth directly
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    // Return the raw response
    return res.status(error ? 400 : 201).json({
      success: !error,
      data,
      error,
      message: error ? `Signup failed: ${error.message}` : 'Signup successful'
    });
  } catch (error) {
    console.error('Direct signup error:', error);
    return res.status(500).json({
      success: false,
      error,
      message: 'Server error during direct signup test'
    });
  }
});

// Diagnostic endpoint to test Supabase connection directly
router.get('/diagnostic', async (req, res) => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test Supabase connection by checking auth service
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    // Get configuration info from .env file
    const supabaseUrl = process.env.SUPABASE_URL || 'Not available';
    const supabaseKeyPreview = process.env.SUPABASE_ANON_KEY ? 
      process.env.SUPABASE_ANON_KEY.substring(0, 10) + '...[redacted]' : 
      'No key available';
    
    // Additional test - get current Supabase user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    return res.status(200).json({
      message: 'Supabase diagnostic completed',
      auth_test: {
        success: !authError,
        error: authError,
        data: authData ? 'Session data available' : 'No session data'
      },
      user_test: {
        success: !userError,
        error: userError,
        data: userData
      },
      config: {
        supabase_url: supabaseUrl,
        key_preview: supabaseKeyPreview,
        env_loaded: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY
      }
    });
  } catch (error) {
    console.error('Diagnostic endpoint error:', error);
    return res.status(500).json({
      message: 'Diagnostic test failed',
      error: error
    });
  }
});

// Mock endpoints for testing
router.post('/mock-signup', (req, res) => {
  const { email, name, password } = req.body;
  
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Generate a mock user and token
  const userId = `mock-${Date.now()}`;
  const token = `mock-token-${userId}`;
  
  return res.status(201).json({
    token,
    user: {
      id: userId,
      email,
      name,
      age: req.body.age || 25,
      location: req.body.location || 'Mock City',
      created_at: new Date().toISOString(),
      is_online: true
    }
  });
});

router.post('/mock-login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Simulate successful login with mock data
  const userId = `mock-login-${Date.now()}`;
  const token = `mock-token-${userId}`;
  
  return res.status(200).json({
    token,
    user: {
      id: userId,
      email,
      name: 'Mock User',
      age: 28,
      location: 'Mock City',
      created_at: new Date().toISOString(),
      is_online: true
    }
  });
});

export default router; 