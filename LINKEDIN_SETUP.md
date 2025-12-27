# LinkedIn Setup - Quick Start

## Step 1: Create LinkedIn App (5 minutes)

1. Go to: **https://www.linkedin.com/developers/apps**
2. Click **"Create app"**
3. Fill in:
   - **App name**: OutreachOS
   - **LinkedIn Page**: Select your company page (or create one)
   - **Privacy policy URL**: https://your-domain.com/privacy
   - **App logo**: Upload any logo (200x200px minimum)
   - Check the legal agreement box
4. Click **"Create app"**

## Step 2: Configure OAuth (2 minutes)

1. In your new app, go to **"Auth"** tab
2. Under **"OAuth 2.0 settings"**, find **"Redirect URLs"**
3. Click **"Add redirect URL"** and add:
   ```
   http://localhost:3000/api/auth/linkedin/callback
   ```
4. If you have a production URL, also add:
   ```
   https://your-domain.com/api/auth/linkedin/callback
   ```
5. Click **"Update"**

## Step 3: Request API Access (1 minute)

1. Still in **"Auth"** tab
2. Under **"OAuth 2.0 scopes"**, you should see:
   - ✅ `r_liteprofile` (Basic profile info)
   - ✅ `r_emailaddress` (Email address)
3. These are automatically granted for new apps

## Step 4: Get Your Credentials (1 minute)

1. In **"Auth"** tab, find **"Application credentials"**
2. Copy **"Client ID"**
3. Copy **"Client Secret"** (click "Show" first)

## Step 5: Add to Your App (1 minute)

1. Open your `.env.local` file
2. Add these lines:
   ```env
   LINKEDIN_CLIENT_ID=your_client_id_here
   LINKEDIN_CLIENT_SECRET=your_client_secret_here
   ```
3. Replace with your actual credentials
4. Save the file

## Step 6: Restart Your App

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 7: Test Connection

1. Go to your app: http://localhost:3000
2. Sign in
3. Go to **Settings**
4. Click **"Connect LinkedIn"**
5. Authorize the app on LinkedIn
6. You'll be redirected back with success message!

## What Happens Next?

Once connected:
- ✅ Your LinkedIn access token is stored securely
- ✅ You can sync your LinkedIn connections
- ✅ Contact data will be enriched with LinkedIn info
- ✅ LinkedIn Assist Mode will work for outreach

## Troubleshooting

### "Redirect URI mismatch"
- Make sure the redirect URL in LinkedIn app matches exactly
- Check for http vs https
- Check for trailing slashes

### "Invalid client credentials"
- Double-check Client ID and Secret
- Make sure no extra spaces in .env.local
- Restart the server after adding credentials

### "App not approved"
- Basic profile access is automatic
- No approval needed for personal use
- For production, you may need LinkedIn review

## Next Steps

After connecting LinkedIn:
1. **Sync Contacts** - Import your LinkedIn connections
2. **Create Campaigns** - Set up outreach sequences
3. **Use LinkedIn Assist** - Generate messages for manual sending

## Important Notes

### Compliance
- ✅ We use official LinkedIn OAuth API
- ✅ No automation - all actions are manual
- ✅ Respects LinkedIn Terms of Service
- ✅ User controls all data

### Data Privacy
- Tokens stored encrypted in database
- Only you can access your data
- Can disconnect anytime
- Data deleted on request

## Need Help?

Check `LINKEDIN_INTEGRATION.md` for detailed documentation.
