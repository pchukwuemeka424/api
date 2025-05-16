-- First, let's check existing policies
SELECT
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Recreate the policy with the correct settings
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Drop and recreate service role policy if it exists
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Create service role policy
CREATE POLICY "Service role can manage all profiles" 
  ON public.profiles 
  FOR ALL
  USING (auth.role() = 'service_role');

-- Verify the updated policies
SELECT
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'; 