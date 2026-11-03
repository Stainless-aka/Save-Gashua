# Save Gashua

**A community-led health initiative focused on diabetes awareness, screening and care assistance in Gashua, Bade LGA, Yobe State, Nigeria.**

## Technology

| Component | Technology |
|---|---|
| Frontend | HTML, CSS and Vanilla JavaScript |
| Hosting | Vercel |
| Authentication | Supabase Auth |
| Database | Supabase Postgres |
| Gallery image storage | Supabase Storage |
| Donations | Manual bank transfer and donor-reported records |

## Supabase configuration

The browser client is configured in `frontend/js/supabase-client.js` using the Supabase project URL and publishable key. The publishable key is intended for browser use. Never put a Supabase secret or service-role key in frontend files.

The Supabase project must have the `donations` and `gallery_images` tables, Row Level Security enabled, and the `save-gashua-gallery` public Storage bucket configured with the policies described by the project migration.

### Administrator access

The admin dashboard is available at `/admin.html`. It uses Supabase email/password authentication. The signed-in administrator must have this trusted application metadata value:

```json
{ "role": "admin" }
```

Set the role in `auth.users.raw_app_meta_data`, not user-editable metadata. After changing the role, sign out and sign in again so the user receives a fresh access token.

### Gallery management

Administrators can upload JPG, PNG and WebP images up to 8 MB, add a title and optional description, publish or hide photographs, and delete photographs. Images are stored in the `save-gashua-gallery` Supabase Storage bucket. Metadata is stored in `public.gallery_images`.

The public gallery reads only published photographs.

### Donation records

Donors can optionally submit details after making a manual bank transfer. New records are marked `donor_reported`. A submitted record is not proof that money reached the receiving account. Only independently reconciled deposits should be described as bank-reconciled.

Donor emails and private transaction references must remain restricted to administrators and must never appear in public reports.

## Local development

This is a static website. Open the `frontend` directory through a local static web server; do not run the legacy Express application.

The Vercel project should use `frontend` as its Root Directory (or configure its output directory to `frontend`). Keep the existing Vercel project and domain settings unchanged while migrating.

## Production checklist

- Confirm the Vercel project deploys the `frontend` directory.
- Confirm Supabase Auth allows the authorised admin account to sign in.
- Verify RLS on both public tables and the Storage bucket.
- Test admin login, image upload, publish, hide and delete.
- Test public gallery visibility for published images only.
- Submit a test donation record and confirm it is visible only to administrators.
- Review consent before publishing identifiable community photographs.
- Keep all Supabase secret/service-role keys out of the browser and Git history.
