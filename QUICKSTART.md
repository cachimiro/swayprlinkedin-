# OutreachOS Quick Start Guide

Get OutreachOS running in 10 minutes.

## Prerequisites

- Node.js 20.x installed
- Supabase account (free tier works)
- Resend account (free tier: 100 emails/day)

## Step 1: Clone and Install (2 minutes)

```bash
git clone <your-repo-url>
cd swayprlinkedin-
npm install
```

## Step 2: Set Up Supabase (3 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to initialize (~2 minutes)
3. Go to **SQL Editor** and run the migration:
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and execute
4. Go to **Project Settings > API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

## Step 3: Set Up Resend (2 minutes)

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email
3. Go to **API Keys** and create a new key
4. Copy the API key (starts with `re_`)

## Step 4: Configure Environment (1 minute)

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Run the App (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Create Your Account (1 minute)

1. Click **Sign Up**
2. Enter your details
3. Check email for verification link
4. Click verification link
5. Create workspace
6. (Optional) Add Resend API key

## You're Ready!

Now you can:
- Import leads from CSV
- Create email campaigns
- Set up LinkedIn assist tasks
- Track your outreach

## Sample CSV Format

Create a test CSV file:

```csv
First Name,Last Name,Email,Title,Company,Industry,Location,LinkedIn URL
John,Doe,john@example.com,VP Engineering,Acme Corp,Technology,San Francisco,https://linkedin.com/in/johndoe
Jane,Smith,jane@example.com,CTO,TechStart,Software,New York,https://linkedin.com/in/janesmith
```

## Next Steps

1. **Import Leads**: Go to Leads > Import Leads
2. **Create Campaign**: Go to Campaigns > New Campaign
3. **Set Up Sequence**: Add email or LinkedIn steps
4. **Enroll Leads**: Select leads and add to campaign
5. **Monitor Results**: Check Dashboard for analytics

## Common Issues

### "Database connection failed"
- Check Supabase URL and keys in `.env.local`
- Verify Supabase project is active (not paused)

### "Email not sending"
- Verify Resend API key is correct
- Check you haven't exceeded free tier limit (100/day)
- For production, verify your domain with Resend

### "Import not working"
- Ensure CSV has headers
- Check at least one name or email column exists
- Review browser console for errors

## Production Deployment

When ready to deploy:

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy
5. Configure webhooks

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Support

- **Documentation**: See [README.md](./README.md)
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Issues**: Open a GitHub issue

## Tips

- Start with a small test campaign (5-10 leads)
- Use LinkedIn Assist mode to stay compliant
- Monitor bounce rates and adjust
- Keep suppression list updated
- Respect sending limits

Happy outreaching! 🚀
