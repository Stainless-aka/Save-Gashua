# Save Gashua

**A community-led health initiative focused on diabetes awareness, screening and care assistance in Gashua, Bade LGA, Yobe State, Nigeria.**

## Technology

| Component | Technology |
|---|---|
| Frontend | HTML, CSS and Vanilla JavaScript |
| Backend | Node.js and Express |
| Database | SQLite with better-sqlite3 |
| Gallery image storage | Cloudinary |
| Donations | Manual bank transfer and donor-reported records |

## Gallery management

The public gallery reads published photographs from `GET /api/gallery`. Administrators manage photographs at `/admin.html`.

Administrators can sign in, upload JPG/PNG/WebP images up to 8 MB, add a title and optional description, publish or hide photographs, and delete photographs. Cloudinary stores image files. SQLite stores their title, description, secure image URL, Cloudinary public ID and publication state.

Cloudinary credentials and administrator secrets must only exist in the backend environment.

## Local development

Requirements: Node.js 18.18+ and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Set every value in `.env` before using the admin dashboard. Generate a long random `SESSION_SECRET` and use a unique administrator password of at least 12 characters. Keep `.env` private and never commit it.

- Website: http://localhost:3000
- Gallery: http://localhost:3000/gallery.html
- Admin dashboard: http://localhost:3000/admin.html
- Health check: http://localhost:3000/health

## Database

SQLite is initialized from `database/schema.sql` and stored locally at `database/save-gashua.db`. The schema creates donation and gallery tables. Keep the database file out of public web directories and back it up securely.

## Donation integrity

Donations are submitted through manual bank transfer. A donor-submitted record is marked `donor_reported`; it is not proof that money reached the receiving account. Only independently reconciled deposits may be described as bank-reconciled. Do not expose donor emails, private references or beneficiary details in public reports.

## Production checklist

Before public deployment:
- Configure all environment variables in the hosting provider.
- Use HTTPS and a strong unique admin password and session secret.
- Configure persistent storage for SQLite or migrate to a managed database.
- Back up the database and test restoration.
- Configure Cloudinary upload limits and monitor storage usage.
- Test admin login, upload, publish, hide and delete flows.
- Review donation reconciliation and privacy controls.
- Publish only authentic, consented activity photographs.
