# Supabase Auth Configuration

To disable email verification and allow instant sign-up:

## Steps to Configure Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `ipdeablmyrfzogkjtbms`
3. Go to **Authentication** → **Providers** → **Email**
4. **Disable** "Confirm email" option
5. Click **Save**

## Alternative: Auto-confirm Users

If you can't disable email confirmation in the UI, you can auto-confirm users via SQL:

```sql
-- Run this in Supabase SQL Editor
-- This will auto-confirm all new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm the user
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id
  AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Current Issue

The 400 error on sign-in happens because:
- User signs up but email is not confirmed
- Supabase requires email confirmation before allowing sign-in
- User tries to sign in → 400 error "Email not confirmed"

## Solution Options

### Option 1: Disable Email Confirmation (Recommended)
Follow steps above to disable in Supabase Dashboard

### Option 2: Auto-confirm via Trigger
Run the SQL trigger above

### Option 3: Manual Confirmation
For existing users, run:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

## Testing

After applying one of the solutions:
1. Create a new account at `/auth/signup`
2. You should be automatically redirected to `/dashboard`
3. No email verification needed
4. Sign in should work immediately

## Current Behavior

- ✅ Sign up creates auth user
- ✅ Sign up creates users table record
- ❌ Email not confirmed → can't sign in
- ❌ 400 error on sign-in attempt

## Expected Behavior After Fix

- ✅ Sign up creates auth user
- ✅ Sign up creates users table record
- ✅ Email auto-confirmed
- ✅ Redirected to dashboard immediately
- ✅ Can sign in anytime
