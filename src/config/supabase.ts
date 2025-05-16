import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://wafsevtyqtmjbdtrtrmq.supabase.co';
// This should be a service role key for backend operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZnNldnR5cXRtamJkdHJ0cm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM0NDg4NywiZXhwIjoyMDYyOTIwODg3fQ.3nYLBU0MJYmveZ1q-Evc4qhNYgCzFGAdYuVKEzL31sM';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZnNldnR5cXRtamJkdHJ0cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNDQ4ODcsImV4cCI6MjA2MjkyMDg4N30.oZKcEwxTrPLi--K5f1MzBqv3GvXLkm20qLVIMIH8txo';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase URL or API key');
}

// Create a Supabase client with the service role API key for admin operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Create a Supabase client with the anonymous key for client-side operations
export const supabaseAnon = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false
    }
  }
); 