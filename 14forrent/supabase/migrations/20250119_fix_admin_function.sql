-- Create the is_admin function that checks if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has admin role in user_roles table
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  );
END;
$$;

-- Ensure jason@14ForRent.com has admin role
-- First, get the user ID for jason@14ForRent.com
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'jason@14forrent.com';
  
  -- If user exists, ensure they have admin role
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role ensured for jason@14forrent.com (user_id: %)', v_user_id;
  ELSE
    RAISE NOTICE 'User jason@14forrent.com not found in auth.users';
  END IF;
END;
$$;

-- Also check for zak.seid@gmail.com
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'zak.seid@gmail.com';
  
  -- If user exists, ensure they have admin role
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role ensured for zak.seid@gmail.com (user_id: %)', v_user_id;
  ELSE
    RAISE NOTICE 'User zak.seid@gmail.com not found in auth.users';
  END IF;
END;
$$;