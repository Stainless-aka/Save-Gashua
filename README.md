# Save Gashua

**A community-led health fundraising initiative focused on diabetes awareness, screening and support.**

Save Gashua aims to support better health awareness and access to diabetes-related care in Gashua, Bade LGA, Yobe State, Nigeria.

The initiative brings community members, supporters and healthcare professionals together to promote awareness, encourage screening and support individuals who may need assistance.

## About the Project

Save Gashua is designed to provide an online platform where people can:

- Learn about the initiative and its health objectives.
- Explore community health campaigns.
- Support fundraising activities through direct bank transfers.
- Submit contribution details for record-keeping.
- Access financial transparency and accountability reports.
- Contact the initiative regarding enquiries and partnerships.

Save Gashua is a community-led initiative. It does not claim registered-charity status unless and until that status is legally established.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js and Express |
| Database | Supabase |
| Donation Method | Direct bank transfer |
| Development Environment | Node.js and npm |

## Core Features

### 1. Community Information
- About Save Gashua.
- Mission and objectives.
- Health campaigns and initiatives.
- Contact information.

### 2. Donation System
- Direct bank transfer instructions.
- Optional contribution reporting form.
- Donor information and transfer details collection.
- Automatic recording of submitted contributions.

### 3. Transparency and Accountability
- Distinction between donor-reported contributions and bank-reconciled deposits.
- Financial contribution reporting.
- Programme expense reporting.
- Protection of private donor information.

## Manual Donation Workflow

Save Gashua uses a manual bank transfer process. No payment gateway is currently integrated.

The workflow is:

1. A donor transfers funds to the officially authorised receiving bank account.
2. The donor may submit contribution details through the website.
3. The backend records the submission automatically with the status `donor_reported`.
4. Submitted information is retained for financial record-keeping.
5. Bank reconciliation is performed separately against the receiving account.

**Important:** A donor-submitted amount is not independently confirmed. Submitting a contribution form does not prove that funds reached the receiving bank account.

There is no approval or rejection queue for donor submissions.

Public financial reports must distinguish between:
- **Donor-reported contributions:** Amounts submitted by donors through the website.
- **Bank-reconciled deposits:** Amounts independently checked against the receiving bank account.

Never describe a transfer as bank-confirmed without checking the receiving account.

## Database

Supabase is the designated database platform for the project.

The database should support:
- Donation records.
- Donor-submitted information.
- Contribution reporting statuses.
- Financial reconciliation records.
- Programme expense records.

Database access must be protected through appropriate authentication, authorization and Row Level Security (RLS) policies.

## Security and Privacy

The project must follow these principles:

- Keep Supabase service-role credentials on the server.
- Never expose private API keys in frontend JavaScript.
- Validate and sanitize submitted information on the backend.
- Protect administrative operations with authentication and authorization.
- Apply rate limiting to public submission endpoints.
- Configure appropriate Supabase RLS policies.
- Maintain secure database backups.
- Avoid exposing donor email addresses, bank details or private transaction references in public reports.
- Do not publish bank account details until the account holder authorizes their use.

## Local Development Setup

### Prerequisites

- Node.js
- npm
- Supabase project and credentials

### 1. Clone the repository

```bash
git clone <repository-url>
cd save-gashua
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Add the required server-side Supabase credentials to `.env`.

Never commit your `.env` file or expose private credentials publicly.

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the application

Visit:

```text
http://localhost:3000
```

## Project Structure

```text
save-gashua/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   └── server.js
│
├── database/
│   └── schema.sql
│
├── docs/
│   ├── database-design.md
│   ├── payment-flow.md
│   └── project-overview.md
│
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── donation.js
│   │   └── main.js
│   ├── index.html
│   ├── about.html
│   ├── mission.html
│   ├── campaigns.html
│   ├── transparency.html
│   ├── contact.html
│   └── donate.html
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

*The structure describes the intended project organization; update it if the actual repository differs.*

## Production Readiness

This project is a starter scaffold. Before production deployment, the following must be implemented and tested:

- [ ] Admin authentication.
- [ ] Role-based authorization.
- [ ] Backend input validation.
- [ ] API rate limiting.
- [ ] Supabase Row Level Security policies.
- [ ] Secure environment variable management.
- [ ] Database backup and recovery procedures.
- [ ] Bank reconciliation procedures.
- [ ] Public financial reporting safeguards.
- [ ] End-to-end donation submission testing.

## Guiding Principles

Save Gashua is built around:

1. **Community:** Encouraging collective responsibility for better health.
2. **Awareness:** Promoting reliable diabetes information.
3. **Care:** Supporting screening and needs-based assistance.
4. **Transparency:** Communicating fundraising activities honestly.
5. **Accountability:** Maintaining responsible financial records.
6. **Privacy:** Protecting donor and beneficiary information.

---

**Save Gashua**  
*Building a healthier community, together.*