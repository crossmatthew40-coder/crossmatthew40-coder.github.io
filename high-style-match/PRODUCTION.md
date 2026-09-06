# High Style Match — Production Launch

The browser product is designed to keep working locally even when cloud services are not configured. The production layer becomes active after Supabase and optional third-party services are connected.

## Already implemented in the repository

- Photographer and customer account pages
- Customer project portal with review, favourite, approve, change request and comments
- Project-level permissions and Row Level Security schema
- Local-to-cloud project metadata sync
- Offline queue and service-worker app shell
- Preview JPEG upload from IndexedDB while RAW/original files remain local
- Private signed preview URLs
- Customer invitation UI and secure Edge Function
- Delivery records and delivery-open tracking
- Notification preference storage and optional transactional email function
- Automatic metadata backup snapshots and expiry maintenance function
- Admin console, client error logging and system diagnostics page
- Stripe Checkout, Billing Portal and webhook function scaffolding
- Privacy/terms drafts and account export/deletion request records
- Automated Playwright production smoke tests

## External setup still required before real customer data

### 1. Supabase

Create a dedicated Supabase project, then run in order:

1. `high-style-match/supabase/schema.sql`
2. `high-style-match/supabase/production.sql`

Copy only the public Project URL and anon key into `high-style-match/auth-config.js`.

Never put the service-role key in GitHub Pages or browser JavaScript.

### 2. Edge Functions

Deploy these Supabase Edge Functions:

- `invite-customer`
- `delivery-open`
- `daily-maintenance`
- `send-notification`
- `create-checkout-session`
- `create-billing-portal`
- `stripe-webhook`

Required server-side environment variables, depending on features enabled:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HSM_SITE_URL`
- `HSM_CRON_SECRET`
- `HSM_INTERNAL_SECRET`
- `RESEND_API_KEY`
- `HSM_NOTIFICATION_FROM`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `HSM_STRIPE_PRICE_ID`

### 3. Create the first photographer/admin account

After signing up, set roles in the Supabase SQL editor:

```sql
update public.profiles set role='photographer' where email='YOUR_EMAIL';
update public.profiles set role='admin' where email='YOUR_EMAIL';
```

Use `admin` only for accounts that should see the admin console.

### 4. Authentication URLs

Add the live High Style Match URLs to Supabase Auth redirect allow-list. When a custom domain is ready, use it as the preferred production URL.

Current URL:

`https://crossmatthew40-coder.github.io/high-style-match/`

Preferred future URL:

`https://app.highstylegroup.co.uk/`

### 5. Email

The optional `send-notification` function is prepared for Resend. Verify the High Style Group sending domain before using `notifications@highstylegroup.co.uk` in production.

### 6. Billing

Billing code is intentionally disabled in `app-config.js` until a real Stripe account is configured. Create a Stripe product/price, set `HSM_STRIPE_PRICE_ID`, configure the webhook endpoint, then switch `features.billing` to `true`.

### 7. Backups and scheduled maintenance

Configure Supabase database backups appropriate to the plan. Schedule `daily-maintenance` once per day with the `x-cron-secret` header. This function also creates metadata snapshots in `project_versions`; it does not replace database backups and does not copy RAW originals.

### 8. Domain

When `app.highstylegroup.co.uk` is available, point it at the hosting platform or move the frontend to a host that supports the custom domain. Update:

- `app-config.js`
- Supabase redirect URLs
- Edge Function `HSM_SITE_URL`
- Stripe success/cancel URLs via `HSM_SITE_URL`

### 9. Field test before beta

Run one real photography job end to end:

1. Create client/project
2. Import a real shot list
3. Connect Capture One capture folder
4. Shoot at least 100 real frames including RAW+JPEG if used
5. Verify orientation and missing-shot alerts
6. Test Before You Leave
7. Cull and review
8. Sync previews
9. Invite a separate test customer account
10. Review/approve from another device
11. Rename/export
12. Add a real delivery link
13. Confirm delivery-open event
14. Disconnect/reconnect internet and confirm recovery
15. Confirm the customer cannot open another customer's project ID

## Launch gate

Do not invite real customers until all of these are true:

- Supabase schema + production extension ran successfully
- RLS tested with two separate customer accounts
- Private preview storage confirmed
- No service-role or Stripe secret exists in the frontend repo
- Customer invite emails work
- Account reset/magic-link flow works
- Cloud sync recovers after offline use
- Real Capture One field test completed
- Privacy/terms drafts reviewed for the final business entity
- Billing disabled until intentionally configured
- Production smoke test passes
