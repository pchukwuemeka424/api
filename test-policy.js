// Script to test if RLS policies are working correctly
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wafsevtyqtmjbdtrtrmq.supabase.co';
// Use environment variable for security
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_KEY environment variable');
  console.log('Run the script with: SUPABASE_SERVICE_KEY=your_key node test-policy.js');
  process.exit(1);
}

// Create a Supabase client with the service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Create a test user and profile
async function testPolicies() {
  console.log('Testing RLS policies...');
  
  // Step 1: Create a random test user
  const email = `test-user-${Date.now()}@example.com`;
  const password = 'Test123!@#';
  
  try {
    // Create user with auth API
    console.log(`Creating test user: ${email}`);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (authError) {
      console.error('Error creating test user:', authError);
      return;
    }
    
    const userId = authData.user.id;
    console.log(`User created with ID: ${userId}`);
    
    // Step 2: Test service role inserting profile directly
    console.log('\nTesting service role inserting profile...');
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        name: 'Test Policy User',
        age: 25,
        location: 'Test City'
      })
      .select();
    
    if (profileError) {
      console.error('Error inserting profile with service role:', profileError);
    } else {
      console.log('✅ Service role successfully inserted profile:', profileData);
    }
    
    // Step 3: Sign in as the user
    console.log('\nTesting regular user operations...');
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error('Error signing in as test user:', signInError);
      return;
    }
    
    // Create a client with the user's session
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Set the auth context to the user's session
    userClient.auth.setSession({
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token
    });
    
    // Step 4: Try to update the user's own profile
    console.log('Testing user updating their own profile...');
    const { data: updateData, error: updateError } = await userClient
      .from('profiles')
      .update({ location: 'Updated City' })
      .eq('id', userId)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating own profile:', updateError);
    } else {
      console.log('✅ User successfully updated their own profile:', updateData);
    }
    
    // Step 5: Try to update another user's profile (should fail with RLS)
    console.log('\nTesting user updating another profile (should fail)...');
    const { data: otherData, error: otherError } = await userClient
      .from('profiles')
      .update({ location: 'Hacked City' })
      .neq('id', userId)
      .limit(1)
      .select();
    
    if (otherError) {
      console.log('✅ Correctly blocked from updating other profiles:', otherError);
    } else {
      console.error('❌ Security issue: User was able to update other profiles:', otherData);
    }
    
    console.log('\nRLS policy test complete!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testPolicies(); 