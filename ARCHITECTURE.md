# OutreachOS Architecture

## Overview

OutreachOS is a full-stack SaaS application built with Next.js 14 (App Router), Supabase, and modern web technologies. The architecture follows a serverless, multi-tenant design with strong security and scalability.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  Next.js 14 (App Router) + React + TypeScript + TailwindCSS │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│         Server Components + API Routes + Middleware          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Service Layer                         │
│    Supabase (Auth, Database, Storage) + Email Providers     │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: React hooks + Supabase real-time
- **Forms**: React Hook Form (future)
- **Validation**: Zod schemas

### Backend
- **Database**: Supabase Postgres with Row Level Security
- **Authentication**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (CSV uploads)
- **API**: Next.js API Routes + Server Actions
- **Email**: Resend (primary) or SendGrid (fallback)

### Infrastructure
- **Hosting**: Vercel (recommended)
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Sentry (optional)

## Database Design

### Multi-Tenancy

The application uses workspace-based multi-tenancy:
- Each user belongs to one or more workspaces
- All data is scoped to workspaces
- Row Level Security enforces workspace isolation

### Schema Overview

```
profiles (1) ──┬── (M) workspace_members (M) ── (1) workspaces
               │
               └── (1) workspaces (owner)

workspaces (1) ──┬── (M) leads
                 ├── (M) companies
                 ├── (M) campaigns
                 ├── (M) outbound_messages
                 ├── (M) inbound_events
                 └── (M) suppression_list

campaigns (1) ──┬── (M) sequences
                └── (M) campaign_enrollments (M) ── (1) leads
```

### Key Tables

**profiles**: User profiles linked to auth.users
- Stores user metadata
- One-to-one with auth.users

**workspaces**: Tenant isolation
- Owned by a user
- Contains all business data

**workspace_members**: Access control
- Many-to-many between users and workspaces
- Role-based permissions (owner, admin, member)

**leads**: Contact database
- Deduplicated on email and LinkedIn URL
- Rich metadata (title, company, industry, location)
- Status tracking

**campaigns**: Outreach campaigns
- Multi-channel support (email, LinkedIn assist, mixed)
- Configurable sending limits and windows
- Target filtering

**sequences**: Multi-step workflows
- JSON-based step definitions
- Template variables
- Delay configuration

**campaign_enrollments**: Lead-campaign relationships
- Tracks progress through sequence
- State management (active, paused, completed)
- Next action scheduling

**outbound_messages**: Sent messages
- Email and LinkedIn task records
- Status tracking
- Provider integration

**inbound_events**: Webhook events
- Email events (opens, clicks, bounces, replies)
- Complaint handling
- Unsubscribe tracking

**suppression_list**: Do-not-contact
- Email suppression
- Reason tracking
- Workspace-scoped

## Security Architecture

### Authentication
- Supabase Auth with email/password
- JWT-based session management
- Secure cookie storage
- Email verification required

### Authorization
- Row Level Security (RLS) on all tables
- Workspace-based access control
- Helper function: `has_workspace_access()`
- Role-based permissions

### Data Protection
- All sensitive data encrypted at rest
- HTTPS only in production
- API keys stored in environment variables
- No client-side secrets

### Input Validation
- Zod schemas for all inputs
- Server-side validation
- SQL injection prevention (Supabase client)
- XSS prevention (React escaping)

## Application Flow

### User Onboarding
1. Sign up with email/password
2. Email verification
3. Create workspace
4. Configure email provider (optional)
5. Import first leads

### Lead Import
1. Upload CSV file
2. Parse with PapaParse
3. Auto-detect column mappings
4. Preview data
5. Deduplicate and insert
6. Create/link companies

### Campaign Creation
1. Define campaign settings
2. Build sequence steps
3. Configure sending limits
4. Select target leads
5. Enroll leads
6. Activate campaign

### Email Sending
1. Queue processor checks enrollments
2. Respect daily limits and windows
3. Check suppression list
4. Render templates with variables
5. Send via Resend/SendGrid
6. Store provider message ID
7. Update enrollment state

### LinkedIn Assist
1. Generate task from sequence step
2. Render message template
3. Queue in tasks page
4. User copies message
5. User sends manually on LinkedIn
6. User marks task complete

### Webhook Processing
1. Receive event from email provider
2. Validate webhook signature (future)
3. Find message by provider ID
4. Update message status
5. Handle bounces/complaints
6. Update lead status
7. Add to suppression list if needed

## Component Architecture

### Page Structure
```
app/
├── (auth)/
│   ├── signin/
│   └── signup/
├── onboarding/
└── dashboard/
    ├── layout.tsx (sidebar + auth check)
    ├── page.tsx (dashboard)
    ├── leads/
    ├── campaigns/
    ├── tasks/
    └── settings/
```

### Component Organization
```
components/
├── ui/ (shadcn/ui primitives)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── dashboard/
│   └── sidebar.tsx
└── leads/
    └── import-wizard.tsx
```

### Data Flow
1. Server Components fetch data from Supabase
2. Pass data to Client Components as props
3. Client Components handle interactivity
4. Mutations via Server Actions or API routes
5. Optimistic updates where appropriate

## API Design

### Server Actions
- Used for mutations (create, update, delete)
- Automatic revalidation
- Type-safe with TypeScript

### API Routes
- Used for webhooks
- External integrations
- Background jobs (future)

### Supabase Client
- Browser client for client components
- Server client for server components
- Service role for admin operations

## Email Architecture

### Provider Abstraction
```typescript
interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<string>;
  handleWebhook(payload: any): Promise<void>;
}
```

### Sending Flow
1. Check suppression list
2. Render template
3. Call provider API
4. Store message with provider ID
5. Handle errors gracefully

### Webhook Flow
1. Receive POST request
2. Parse payload
3. Find message by provider ID
4. Update status
5. Handle special cases (bounce, complaint)
6. Return 200 OK

## Performance Optimization

### Database
- Indexes on frequently queried columns
- Pagination for large result sets
- Selective field fetching
- Connection pooling (Supabase)

### Frontend
- Server Components for static content
- Client Components only when needed
- Code splitting (automatic with Next.js)
- Image optimization (next/image)
- Font optimization (next/font)

### Caching
- Static page generation where possible
- Revalidation strategies
- CDN caching for assets
- Browser caching headers

## Scalability Considerations

### Database Scaling
- Supabase auto-scaling
- Read replicas for high traffic
- Query optimization
- Archival strategy for old data

### Application Scaling
- Serverless architecture (Vercel)
- Automatic scaling
- Edge Functions for global performance
- CDN for static assets

### Email Scaling
- Queue system for high volume
- Rate limiting per domain
- Multiple provider support
- Batch sending optimization

## Monitoring & Observability

### Logging
- Server-side console logs
- Error tracking (Sentry)
- Audit logs for key actions

### Metrics
- Email deliverability rates
- Campaign performance
- User engagement
- System health

### Alerts
- Failed email sends
- High bounce rates
- System errors
- Performance degradation

## Future Enhancements

### Planned Features
- Campaign analytics dashboard
- A/B testing for email templates
- Advanced lead scoring
- Team collaboration features
- API for integrations
- Mobile app

### Technical Improvements
- Real-time updates with Supabase subscriptions
- Background job queue (Upstash QStash)
- Advanced caching strategy
- GraphQL API (optional)
- Microservices for heavy workloads

## Development Workflow

### Local Development
1. Clone repository
2. Install dependencies
3. Set up Supabase project
4. Configure environment variables
5. Run migrations
6. Start dev server

### Testing Strategy
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows
- Manual testing for UI

### Deployment
1. Push to GitHub
2. Automatic deployment via Vercel
3. Run migrations on Supabase
4. Verify deployment
5. Monitor for issues

## Best Practices

### Code Organization
- Feature-based folder structure
- Shared components in `/components`
- Utilities in `/lib`
- Types in `/lib/types.ts`

### TypeScript
- Strict mode enabled
- Explicit types for all functions
- Interface definitions for data models
- Type guards where needed

### Error Handling
- Try-catch for async operations
- User-friendly error messages
- Logging for debugging
- Graceful degradation

### Security
- Never expose secrets
- Validate all inputs
- Use RLS for data access
- Regular security audits

## Conclusion

OutreachOS is built with modern best practices, focusing on security, scalability, and maintainability. The architecture supports rapid feature development while maintaining code quality and performance.
