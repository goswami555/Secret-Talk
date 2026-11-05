# SecretTalk setup

This is a deployable React + Supabase starter. The project files are ready, but a live public URL needs your own Supabase and Vercel accounts. Never share a Supabase `service_role` key.

## 1) Create the database
1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it.
3. In **Project Settings → API**, copy the Project URL and `anon`/publishable key.

## 2) Configure locally
1. Install Node.js 20 or newer.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Run `npm run dev` and open the local address shown by Vite.
5. Run `npm run build` to verify the production build.

## 3) Publish a shareable website
1. Push this folder to a private or public GitHub repository.
2. Import the repository into https://vercel.com.
3. Add the two environment variables from `.env` in Vercel project settings.
4. Deploy. Vercel gives you a public `https://...vercel.app` URL to share.

## Important privacy and security notes
- Chat participants are anonymous to each other, but this is not end-to-end encrypted. Supabase and hosting/network providers may process technical data.
- Anyone who has a room URL can read and post in that room. Treat the URL like a password.
- The starter uses a deliberately simple public-link access policy. Before using it for sensitive conversations or a large public audience, add abuse controls, rate limits, reporting/blocking, retention controls, and stronger room authorization.
- Images are public to anyone who obtains their image URL. Do not upload intimate, identity, financial, or otherwise sensitive images.
- Browser-local inbox links are stored in local storage. If you clear browser data or change device/browser, you may lose the inbox link. Save it somewhere safe.
- The delete button removes messages sent from the current browser tag in the current room. It does not erase copies or screenshots saved by other participants.
