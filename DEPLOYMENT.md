# Deployment Guide

This guide covers deploying OutreachOS to production.

## Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] Email provider account set up (Resend or SendGrid)
- [ ] Domain verified with email provider
- [ ] Environment variables documented
- [ ] Webhook endpoints configured
- [ ] Security review completed

## Vercel Deployment (Recommended)

### 1. Prepare Repository

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

### 3. Configure Environment Variables

Add these in Vercel Project Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 4. Deploy

Click "Deploy" and wait for build to complete.

### 5. Configure Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

### 6. Set Up Webhooks

Update webhook URLs in email provider:
- Resend: `https://your-domain.vercel.app/api/webhooks/resend`
- SendGrid: `https://your-domain.vercel.app/api/webhooks/sendgrid`

## Alternative Platforms

### Netlify

1. Connect repository
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Add environment variables
4. Deploy

### Railway

1. Create new project from GitHub
2. Add environment variables
3. Deploy automatically on push

### Self-Hosted (Docker)

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t outreachos .
docker run -p 3000:3000 --env-file .env.local outreachos
```

## Post-Deployment

### 1. Verify Deployment

- [ ] Homepage loads correctly
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Dashboard accessible
- [ ] Lead import works
- [ ] Email sending works (test mode)
- [ ] Webhooks receiving events

### 2. Configure Monitoring

Set up monitoring for:
- Application errors (Sentry, LogRocket)
- Performance (Vercel Analytics)
- Uptime (UptimeRobot, Pingdom)
- Email deliverability (email provider dashboard)

### 3. Set Up Backups

Supabase automatic backups:
1. Go to Supabase Dashboard > Database > Backups
2. Enable daily backups
3. Configure retention period

### 4. Security Hardening

- [ ] Enable HTTPS only
- [ ] Configure CSP headers
- [ ] Set up rate limiting
- [ ] Enable Supabase Auth rate limiting
- [ ] Review RLS policies
- [ ] Rotate API keys regularly

### 5. Performance Optimization

- [ ] Enable Vercel Edge Functions for API routes
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Enable compression
- [ ] Monitor Core Web Vitals

## Scaling Considerations

### Database

- Monitor Supabase usage
- Upgrade plan as needed
- Add read replicas for high traffic
- Optimize slow queries

### Email Sending

- Monitor sending limits
- Implement queue system for high volume
- Use multiple email providers for redundancy
- Monitor deliverability rates

### Application

- Use Vercel Pro for better performance
- Enable Edge Functions
- Implement caching strategy
- Use CDN for static assets

## Troubleshooting

### Build Failures

Check:
- Node version matches (20.x)
- All dependencies installed
- Environment variables set
- TypeScript errors resolved

### Runtime Errors

Check:
- Environment variables in production
- Supabase connection
- API keys valid
- Webhook endpoints accessible

### Email Issues

Check:
- Domain verified
- API key valid
- Sending limits not exceeded
- Webhooks configured correctly

## Rollback Procedure

If deployment fails:

1. Revert to previous deployment in Vercel
2. Check error logs
3. Fix issues locally
4. Test thoroughly
5. Redeploy

## Maintenance

### Regular Tasks

- Weekly: Review error logs
- Weekly: Check email deliverability
- Monthly: Review and rotate API keys
- Monthly: Update dependencies
- Quarterly: Security audit
- Quarterly: Performance review

### Updates

1. Test updates locally
2. Deploy to staging (if available)
3. Run smoke tests
4. Deploy to production
5. Monitor for issues

## Support

For deployment issues:
- Check Vercel documentation
- Review Supabase status page
- Check email provider status
- Review application logs
