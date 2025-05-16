// Script to fix Row Level Security (RLS) policies on Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://wafsevtyqtmjbdtrtrmq.supabase.co';
// Use a service role key here - replace with your actual service role key
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY_HERE';

if (!supabaseServiceKey || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('⚠️ Please set a valid service role key in the script');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// SQL to fix the profiles table RLS policies
const fixRlsSql = `
-- Fix for profiles table RLS policy to allow user creation

-- Add INSERT policy for profiles table
CREATE POLICY IF NOT EXISTS "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Add INSERT policy for service role
CREATE POLICY IF NOT EXISTS "Service role can manage all profiles" 
  ON public.profiles 
  FOR ALL
  USING (auth.role() = 'service_role');

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
`;

async function fixRlsPolicies() {
  try {
    console.log('Applying RLS policy fixes...');
    
    // Execute SQL directly using Supabase's rpc call
    const { data, error } = await supabase.rpc('pgapply', { query: fixRlsSql });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ RLS policies successfully updated!');
    console.log('Current policies for profiles table:');
    console.log(data);
    
    return data;
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
    
    // Alternative approach if rpc method doesn't work
    console.log('\nAlternative approach:');
    console.log('1. Go to your Supabase dashboard: https://app.supabase.com');
    console.log('2. Navigate to your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Create a new query and paste the following SQL:');
    console.log('\n' + fixRlsSql);
    console.log('\n5. Run the query to fix the policies');
  }
}

// Run the function
fixRlsPolicies(); 