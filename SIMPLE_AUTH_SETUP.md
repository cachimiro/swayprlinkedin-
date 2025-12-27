# Simple Authentication Setup

## What Changed

✅ **Removed Supabase Auth completely**
✅ **Using your existing `users` table**
✅ **Passwords hashed with bcrypt**
✅ **Simple cookie-based sessions**

## ONE STEP TO MAKE IT WORK

You need to add a `password` column to your `users` table.

### Run This SQL in Supabase:

1. Go to: https://supabase.com/dashboard/project/ipdeablmyrfzogkjtbms/sql/new
2. Paste this SQL:

```sql
-- Add password column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

3. Click **Run**
4. Done!

## How It Works Now

### Sign Up
1. Enter email, password, name
2. Password is hashed with bcrypt
3. Stored in `users` table
4. Cookie created
5. Redirected to dashboard

### Sign In
1. Enter email and password
2. Password checked against hash
3. Cookie created
4. Redirected to dashboard

### Dashboard
- Checks for cookie
- If no cookie → redirect to signin
- If cookie exists → show dashboard

## Test It

1. Run the SQL above
2. Hard refresh browser (`Ctrl + Shift + R`)
3. Go to `/auth/signup`
4. Create account
5. Should work immediately!
6. Sign out and sign in
7. Should work!

## No More Issues

- ❌ No more Supabase Auth errors
- ❌ No more email confirmation
- ❌ No more 400 errors
- ✅ Simple email + password
- ✅ Passwords encrypted
- ✅ Works immediately

## Security

- Passwords hashed with bcrypt (10 rounds)
- HttpOnly cookies (can't be accessed by JavaScript)
- Secure cookies in production
- 7-day session expiry
