# High Style Match Delivery

This folder contains the standalone High Style Match delivery backend. It does not use Supabase.

## What it uses

- Cloudflare Workers for the delivery API
- Cloudflare R2 for both delivery metadata and the uploaded files
- Multipart uploads in 10 MiB chunks for large files
- A private admin key for creating deliveries
- Opaque client tokens, optional password protection and expiry dates

## One-time deployment

Add these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `HSM_DELIVERY_ADMIN_KEY`

The Cloudflare token needs permission to deploy Workers and manage R2 for the account. Use a long random value for `HSM_DELIVERY_ADMIN_KEY`; this is the same private key entered on the High Style Match Deliver page.

Then run the GitHub Actions workflow **Deploy High Style Match Delivery**.

The workflow will:

1. Create the `high-style-match-deliveries` R2 bucket if it does not already exist.
2. Deploy the Worker.
3. Save the private admin key as a Worker secret.
4. Verify `/api/health`.
5. Write the deployed `workers.dev` address into `high-style-match/delivery-config.js` and commit it back to the repository.

After GitHub Pages updates, the Deliver page will use the live server automatically.

## Security

No Cloudflare API token or admin key is committed to the repository. Client links contain an opaque delivery token. Passwords are stored only as salted PBKDF2 hashes. Download URLs are short-lived signed Worker URLs and files remain private inside R2.
