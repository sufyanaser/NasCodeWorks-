# NAS CodeWorks

Initial MVP for the NAS CodeWorks public website, admin content control, and automatic problem-intake email pipeline.

## Current scope

- Public Arabic-first website.
- Admin panel at `/admin` for editing visible website text.
- Editable intake recipient email and email subject prefix.
- Problem intake form.
- Serverless `/api/intake` endpoint prepared for Vercel.
- Email delivery through Resend using environment variables.

## Local verification

```bash
npm install
npm run lint
npm run build
npm run dev
```

## Required Vercel environment variables

```bash
RESEND_API_KEY=
NAS_INTAKE_FROM=NAS CodeWorks <onboarding@resend.dev>
NAS_INTAKE_TO=
```

`NAS_INTAKE_TO` is optional. If it is set, it overrides the recipient email entered in the admin panel.

## Admin panel

Open:

```txt
/admin
```

The current admin panel stores edited content in browser localStorage. This is sufficient for the first MVP preview, but production content persistence should later move to a real backend or CMS.

## Important limitation

The email API works only after deployment to a platform that supports serverless functions, such as Vercel, and after configuring the required environment variables.
