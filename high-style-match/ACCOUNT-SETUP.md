# High Style Match — Account system

High Style Match now uses one authentication service with role-aware workspaces.

## Account types

### Photographer
- Can create a public High Style Match account.
- Owns projects and cloud project records.
- Can invite client accounts to individual projects.
- Routes to `/high-style-match/` after sign-in.

### Client
- Invitation-led account. There is no public client signup button.
- Can only read projects granted through `project_access` and Row Level Security.
- Can review/favourite/approve only where the project permission allows it.
- Routes to `/high-style-match/customer/` after sign-in.

### Admin
- Never selectable or self-assignable from the browser.
- Must be assigned through trusted SQL/server administration.
- Routes to `/high-style-match/admin/`.

## Production activation

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Run `supabase/production.sql` and `supabase/notifications.sql` if those cloud features are required.
4. Run `supabase/account-roles.sql` to enable photographer self-signup while keeping admin protected.
5. Put only the public Supabase Project URL and public anon key into `auth-config.js`.
6. Add these URLs to Supabase Auth redirect allow-list:
   - `https://crossmatthew40-coder.github.io/high-style-match/sign-in/`
   - `https://crossmatthew40-coder.github.io/high-style-match/`
   - `https://crossmatthew40-coder.github.io/high-style-match/customer/`
   - the future `https://app.highstylegroup.co.uk/` equivalents when the custom domain is live.
7. Deploy the `invite-customer` Edge Function with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `HSM_SITE_URL`.
8. Test with three separate browser profiles: photographer, client, admin.

## Security rules

- The browser uses only the Supabase public anon key.
- Service-role credentials stay in Edge Function/server environment variables.
- Public signup can request `photographer` or default to `customer`; it can never request `admin`.
- Project access is enforced by database RLS, not by hiding buttons.
- A photographer account is rejected when used through the Client sign-in choice, and a client account is rejected when used through Photographer sign-in.
- Existing client accounts can be granted a new project without creating a duplicate user.

## Test sequence

1. Create a photographer account and confirm email.
2. Confirm profile role is `photographer`.
3. Create/sync a project.
4. Invite a new client email.
5. Accept the invite and set a password.
6. Confirm the client lands in the Customer Portal and can see only the invited project.
7. Invite the same client to a second project and confirm the existing account receives access without duplication.
8. Confirm a different client cannot open either project.
9. Confirm a photographer cannot enter the client portal as a client account.
10. Confirm admin pages reject photographer/client roles.
