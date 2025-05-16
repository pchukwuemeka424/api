-- Fix for profiles table RLS policy to allow user creation

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Add INSERT policy for service role (if you're using the service role for your backend)
CREATE POLICY "Service role can manage all profiles" 
  ON public.profiles 
  USING (auth.role() = 'service_role');

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'profiles'; 