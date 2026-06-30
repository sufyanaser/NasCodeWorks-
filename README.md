# NAS CodeWorks

Initial MVP for the NAS CodeWorks public website, admin content control, and automatic problem-intake email pipeline.

## Current scope

- Public Arabic-first website.
- Admin panel at `/admin` for editing visible website text.
- Cloud save/load buttons for site content through `/api/content`.
- Editable intake recipient email and email subject prefix.
- Problem intake form.
- Serverless `/api/intake` endpoint prepared for Vercel.
- Email delivery through Resend using environment variables.
- Supabase schema for content and intake tables.

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
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`NAS_INTAKE_TO` is optional. If it is set, it overrides the recipient email entered in the admin panel.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy Project URL into `SUPABASE_URL`.
5. Copy service role key into `SUPABASE_SERVICE_ROLE_KEY`.
6. Add both values to Vercel environment variables.
7. Redeploy the Vercel project.

## Admin panel

Open:

```txt
/admin
```

The admin panel still keeps a local fallback in browser localStorage, but the official workflow is now:

```txt
Edit text -> Save Cloud -> Vercel API -> Supabase -> Any device can load the same content
```

## Important limitation

Cloud content requires Supabase environment variables. Email delivery requires Resend environment variables.
