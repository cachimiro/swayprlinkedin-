# LinkedIn Integration Plan

## What OutreachOS Does with LinkedIn

### ✅ What We CAN Do (Compliant)
1. **Import Contacts** - Sync your LinkedIn connections to contacts table
2. **View Profile Data** - Show contact's LinkedIn profile info
3. **LinkedIn Assist Mode** - Generate message templates for manual sending
4. **Task Queue** - Queue LinkedIn outreach tasks with copy-paste workflow
5. **Profile Links** - Direct links to LinkedIn profiles

### ❌ What We DON'T Do (To Stay Compliant)
- No automated messaging
- No automated connection requests
- No scraping
- No headless browser automation
- All LinkedIn actions are manual by the user

## LinkedIn OAuth Setup

### 1. Create LinkedIn App

1. Go to: https://www.linkedin.com/developers/apps
2. Click **Create app**
3. Fill in:
   - App name: OutreachOS
   - LinkedIn Page: Your company page
   - App logo: Upload logo
   - Legal agreement: Check box
4. Click **Create app**

### 2. Configure OAuth Settings

1. Go to **Auth** tab
2. Add **Redirect URLs**:
   ```
   http://localhost:3000/api/auth/linkedin/callback
   https://your-domain.com/api/auth/linkedin/callback
   ```
3. Under **OAuth 2.0 scopes**, request:
   - `r_liteprofile` - Basic profile info
   - `r_emailaddress` - Email address
   - `w_member_social` - Share content (optional)

### 3. Get Credentials

1. Go to **Auth** tab
2. Copy **Client ID**
3. Copy **Client Secret**
4. Add to `.env.local`:
   ```
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   ```

## Features to Implement

### Phase 1: OAuth Connection ✅
- [ ] LinkedIn OAuth flow
- [ ] Store access token in users table
- [ ] Refresh token handling
- [ ] Connection status in settings

### Phase 2: Contact Sync ✅
- [ ] Fetch LinkedIn connections
- [ ] Import to contacts table
- [ ] Update existing contacts
- [ ] Sync profile pictures

### Phase 3: LinkedIn Assist Mode ✅
- [ ] Generate connection request messages
- [ ] Generate DM templates
- [ ] Task queue for manual sending
- [ ] Copy-to-clipboard functionality
- [ ] Mark tasks as complete

### Phase 4: Profile Enrichment
- [ ] Fetch contact's current position
- [ ] Update company info
- [ ] Sync profile changes

## API Endpoints Needed

```
POST   /api/auth/linkedin/connect     - Initiate OAuth
GET    /api/auth/linkedin/callback    - Handle OAuth callback
POST   /api/auth/linkedin/disconnect  - Remove connection
GET    /api/linkedin/sync-contacts    - Sync connections
GET    /api/linkedin/profile/:id      - Get profile data
```

## Database Schema (Already Exists!)

Your `users` table already has:
- `linkedin_id` - LinkedIn user ID
- `access_token` - OAuth access token
- `refresh_token` - OAuth refresh token
- `token_expires_at` - Token expiration

Your `contacts` table already has:
- `linkedin_id` - Contact's LinkedIn ID
- `profile_url` - LinkedIn profile URL
- `profile_picture_url` - Profile photo

## Compliance Notes

### LinkedIn Terms of Service
- ✅ Use official OAuth API
- ✅ Store tokens securely
- ✅ Respect rate limits
- ✅ No automation of user actions
- ✅ User must manually send messages

### Data Privacy
- Store only necessary data
- Allow users to disconnect
- Delete data on request
- Secure token storage

## Next Steps

1. **Get LinkedIn App Credentials**
   - Create app at LinkedIn Developers
   - Get Client ID and Secret

2. **Implement OAuth Flow**
   - Connect LinkedIn button in settings
   - OAuth callback handler
   - Token storage

3. **Sync Contacts**
   - Fetch connections API
   - Import to contacts table
   - Update existing records

4. **LinkedIn Assist Mode**
   - Already built in tasks page!
   - Just needs LinkedIn connection

Ready to implement? Let me know when you have your LinkedIn app credentials!
