# High Style Match — Cloud Setup

This is the production foundation for secure accounts, customer project access, review/approval and cloud delivery records.

## 1. Create a Supabase project

Create a new Supabase project for High Style Match. Do not reuse a personal/test database if real client data will be stored.

## 2. Run the schema

Open Supabase SQL Editor and run:

`high-style-match/supabase/schema.sql`

This creates:

- profiles
- customer accounts and members
- projects
- project access
- shot-list items
- project photo records
- customer reviews
- deliveries
- invitations
- Row Level Security policies
- a private `project-previews` storage bucket

The security model is project-based: the photographer owns the project, and customers only gain access through `project_access`.

## 3. Configure the browser app

In Supabase, copy only:

- Project URL
- public anon key

Put those values into `high-style-match/auth-config.js`.

Never put the Supabase service-role key in GitHub Pages, `auth-config.js`, `cloud.js`, browser localStorage, or any client-side file.

## 4. Create the photographer account

Create/sign in to the first account, then in Supabase SQL Editor set its role to `photographer`:

```sql
update public.profiles
set role = 'photographer'
where email = 'YOUR_EMAIL_HERE';
```

## 5. Customer invitations

The browser must not use a service-role key to create users. Production invitations should be sent by a trusted Supabase Edge Function or another server-side endpoint. The frontend can create/manage invitation records only for projects the photographer owns.

Recommended flow:

1. Photographer enters the customer's email.
2. Trusted server function sends a Supabase invite/magic link.
3. Customer signs in.
4. Server/photographer creates `project_access` for that user's UUID.
5. RLS automatically limits the customer to that project.

## 6. Photo storage

Keep RAW originals local during tethered shooting. Upload only optimized JPEG previews/review images to the private `project-previews` bucket using paths like:

`<project_uuid>/<photo_uuid>.jpg`

The database stores the preview path, not a permanently public URL. The app generates short-lived signed URLs when an authorized user views a preview.

## 7. What is already coded

`high-style-match/cloud.js` contains browser-safe helpers for:

- session checks
- user profile
- customer-visible projects
- shot-list items
- project photo records
- customer reviews
- deliveries
- signed preview URLs
- sign out

The current live app continues to work without Supabase configured. Cloud features should only activate after the Project URL and public anon key are supplied.

## 8. Production checks before real client data

Before inviting a real customer:

- run the full schema successfully
- confirm RLS is enabled on every table
- test with two separate customer accounts and confirm they cannot see each other's projects
- keep the preview bucket private
- verify there is no service-role key in the repository
- configure a real auth redirect URL for the High Style Match domain
- enable backups and appropriate Supabase security settings
- run the High Style Match browser smoke tests
