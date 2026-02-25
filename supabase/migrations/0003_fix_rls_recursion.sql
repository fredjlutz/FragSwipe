-- 1. Create a security definer function to check for admin status
-- This avoids the infinite recursion where a profile policy checks the profiles table
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Admins manage profiles" ON profiles;
DROP POLICY IF EXISTS "Admins manage listings" ON listings;
DROP POLICY IF EXISTS "Admins manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins manage moderation" ON moderation_log;
DROP POLICY IF EXISTS "Admins manage blocklist" ON moderation_blocklist;

-- 3. Re-create policies using the new helper function
CREATE POLICY "Admins manage profiles" ON profiles FOR ALL USING (is_admin());
CREATE POLICY "Admins manage listings" ON listings FOR ALL USING (is_admin());
CREATE POLICY "Admins manage subscriptions" ON subscriptions FOR ALL USING (is_admin());
CREATE POLICY "Admins manage moderation" ON moderation_log FOR ALL USING (is_admin());
CREATE POLICY "Admins manage blocklist" ON moderation_blocklist FOR ALL USING (is_admin());

-- 4. Add missing INSERT policy for profiles
-- New users MUST be able to create their own profile during onboarding
CREATE POLICY "Users can create own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
