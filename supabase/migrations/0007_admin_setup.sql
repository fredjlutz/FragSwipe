-- Migration to ensure fred@capereef.club is always treated as an admin
-- This function can be called to sync the role manually or via trigger
CREATE OR REPLACE FUNCTION public.handle_admin_role_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email = 'fred@capereef.club' THEN
        UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_admin_check ON auth.users;
CREATE TRIGGER on_auth_user_admin_check
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_admin_role_sync();

-- Also update existing profile if it exists
DO $$
BEGIN
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE id IN (
        SELECT id FROM auth.users WHERE email = 'fred@capereef.club'
    );
END $$;
