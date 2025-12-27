# OutreachOS

A production-ready LinkedIn outreach platform that helps you run email campaigns and manage LinkedIn outreach tasks using your network data.

## 🚀 Quick Setup

**New to this project? Start here:**

👉 **[README_SETUP.md](README_SETUP.md)** - 5-minute setup guide

The dashboard uses **event-sourced architecture** - all metrics are computed from immutable events, not counters.

## Features

### Lead Management
- CSV import wizard with intelligent column mapping
- Support for LinkedIn exports and Sales Navigator data
- Deduplication on email and LinkedIn profile URL
- Advanced filtering by industry, company, role, location, and status
- Bulk actions (tagging, status updates, deletion)
- Fast, paginated lead table with search

### Campaign Management
- Email-only campaigns with automated sending
- LinkedIn Assist Mode (manual task queue with copy-paste workflow)
- Multi-step sequences with customizable delays
- Template variables: `{first_name}`, `{company}`, `{title}`, `{industry}`, `{location}`
- Daily send limits and sending windows
- Per-domain throttling

### Email Sending
- Resend or SendGrid integration
- Webhook handling for delivery, opens, clicks, bounces
- Automatic suppression list management
- Reply detection
- Bounce handling

### LinkedIn Assist Mode
- No automation - fully manual workflow
- Generated message templates
- One-click copy to clipboard
- Task queue with snooze and completion tracking
- Direct LinkedIn profile links

### Analytics Dashboard
- KPI cards (leads, campaigns, messages sent, replies)
- Campaign performance tracking
- Activity feed

### Security
- Row Level Security (RLS) on all tables
- Workspace-based access control
- Input validation with Zod
- Secure authentication with Supabase Auth

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (Auth, Postgres, Storage, Edge Functions)
- **Email**: Resend (primary) or SendGrid (fallback)
- **CSV Parsing**: PapaParse
- **File Upload**: react-dropzone

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Supabase account
- Resend or SendGrid account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd swayprlinkedin-
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Run the database migration:
   - Go to SQL Editor in Supabase Dashboard
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the SQL

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Provider (choose one)
RESEND_API_KEY=re_your_key
# SENDGRID_API_KEY=SG.your_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Core Tables

- **profiles**: User profiles linked to auth.users
- **workspaces**: Multi-tenant workspace structure
- **workspace_members**: Workspace access control
- **companies**: Company records
- **leads**: Contact database with deduplication
- **campaigns**: Outreach campaign configuration
- **sequences**: Multi-step campaign sequences
- **campaign_enrollments**: Lead enrollment in campaigns
- **outbound_messages**: Sent messages (email and LinkedIn tasks)
- **inbound_events**: Webhook events (replies, bounces, etc.)
- **suppression_list**: Do-not-contact list

### Key Features

- UUID primary keys
- Row Level Security (RLS) on all tables
- Workspace-scoped access control
- Indexes on frequently queried columns
- Unique constraints for deduplication

## Usage Guide

### 1. Sign Up and Onboarding

1. Create an account at `/auth/signup`
2. Verify your email
3. Create a workspace
4. (Optional) Add Resend API key

### 2. Import Leads

1. Go to Leads page
2. Click "Import Leads"
3. Upload CSV file (LinkedIn export, Sales Navigator, or custom)
4. Map columns to lead fields
5. Review and import

### 3. Create a Campaign

1. Go to Campaigns page
2. Click "New Campaign"
3. Choose channel:
   - **Email Only**: Automated email sending
   - **LinkedIn Assist**: Manual LinkedIn tasks
   - **Mixed**: Both email and LinkedIn
4. Configure sequence steps
5. Set daily limits and sending windows
6. Enroll leads

### 4. Manage LinkedIn Tasks

1. Go to Tasks page
2. View queued LinkedIn outreach tasks
3. Click "Open LinkedIn" to visit profile
4. Click "Copy" to copy message
5. Manually send on LinkedIn
6. Mark as complete or snooze

### 5. Monitor Performance

1. Dashboard shows key metrics
2. Campaign detail pages show per-campaign analytics
3. Lead timeline shows all interactions

## Email Provider Setup

### Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key
4. Add to `.env.local`

### SendGrid (Alternative)

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify your domain
3. Create an API key with Mail Send permissions
4. Add to `.env.local`

## Webhook Configuration

### Email Events (Resend)

1. Go to Resend Dashboard > Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/resend`
3. Select events: delivered, opened, clicked, bounced, complained
4. Save webhook

### Email Events (SendGrid)

1. Go to SendGrid Dashboard > Settings > Mail Settings > Event Webhook
2. Add webhook URL: `https://your-domain.com/api/webhooks/sendgrid`
3. Select events: delivered, open, click, bounce, spam_report
4. Enable webhook

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## Security Best Practices

1. **Never commit `.env.local`** - it contains secrets
2. **Use strong passwords** for Supabase and email providers
3. **Enable 2FA** on all accounts
4. **Rotate API keys** regularly
5. **Monitor suppression list** to respect opt-outs
6. **Respect sending limits** to avoid provider bans

## Compliance

### Email Sending

- Include unsubscribe links in all emails
- Honor unsubscribe requests immediately
- Respect CAN-SPAM and GDPR requirements
- Only email contacts who have opted in

### LinkedIn

- **No automation** - all LinkedIn actions are manual
- Respect LinkedIn's Terms of Service
- Do not use scrapers or bots
- Only message 1st and 2nd degree connections

## Troubleshooting

### Database Connection Issues

- Verify Supabase URL and keys in `.env.local`
- Check Supabase project is not paused
- Ensure RLS policies are applied

### Email Not Sending

- Verify API key is correct
- Check domain is verified with provider
- Review sending limits
- Check suppression list

### Import Errors

- Ensure CSV has headers
- Check for required fields (name or email)
- Verify workspace ID is set
- Review browser console for errors

## Development

### Project Structure

```
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application
│   │   ├── leads/        # Lead management
│   │   ├── campaigns/    # Campaign management
│   │   ├── tasks/        # LinkedIn tasks
│   │   └── settings/     # Settings
│   └── onboarding/       # New user onboarding
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── leads/            # Lead-specific components
│   └── dashboard/        # Dashboard components
├── lib/                   # Utilities
│   └── supabase/         # Supabase clients
└── supabase/             # Database migrations
```

### Adding New Features

1. Create database migration in `supabase/migrations/`
2. Add RLS policies for new tables
3. Create TypeScript types
4. Build UI components
5. Add API routes if needed
6. Test thoroughly

## Support

For issues or questions:
1. Check this README
2. Review Supabase documentation
3. Check email provider documentation
4. Open an issue on GitHub

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with Next.js and Supabase
- UI components from shadcn/ui
- Icons from Lucide React
