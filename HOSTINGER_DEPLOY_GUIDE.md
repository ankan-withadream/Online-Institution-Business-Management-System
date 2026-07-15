# Deploying EduCare on Hostinger Business Hosting

Hostinger **Business Web Hosting** supports both a **Node.js app** (for the Express API)
and **static hosting** (for the Vite frontend). This guide assumes the default Vite
output folder `client/dist/` and the Express server at `server/server.js`.

---

## 0. Prerequisites

- Hostinger Business plan (Node.js support + SSH enabled).
- Domain (e.g. `yourdomain.com`) or subdomain for the API (`api.yourdomain.com`).
- Your Supabase project live (schema + buckets already created).
- Your Cloudflare R2 credentials and Fast2SMS key ready.

> Important server detail: `server/src/config/env.js` loads env from a repo-root
> `.env` via `dotenv.config({ path: resolve(__dirname, '../../../.env') })`.
> On Hostinger we will instead set environment variables through the Node.js App
> panel (real `process.env`), which `dotenv` will not override. The frontend
> `VITE_API_URL` is **baked in at build time**, so set it before building.

---

## 1. Frontend (Static) → `public_html`

The built React app is plain static files and goes in the site root.

1. Build locally (or in CI):
   ```bash
   cd client
   # set the API origin BEFORE building
   echo "VITE_API_URL=https://api.yourdomain.com/api" > .env
   echo "VITE_SUPABASE_URL=https://your-project.supabase.co" >> .env
   echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> .env
   npm install
   npm run build
   ```
2. Upload the **contents** of `client/dist/` (not the folder itself) into
   `public_html/` via File Manager or `scp`/FTP.
3. **SPA routing fix** — Vite outputs a single `index.html`. Add a rewrite so
   deep links (e.g. `/student/dashboard`) fall back to `index.html`. Create
   `public_html/.htaccess`:
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ /index.html [L]
   ```

---

## 2. Backend (Node.js App) → subdomain `api`

Hostinger runs Node apps from a folder and assigns `process.env.PORT`.

1. In hPanel → **Advanced → Node.js**, click **Create Node.js App**:
   - Node.js version: **20.x or 22.x** (matches local v24 dev; 20/22 LTS is safe).
   - Application root: e.g. `api` (creates `/home/uXXX/api`).
   - Application URL: `api.yourdomain.com`.
   - Application startup file: `server.js`.
2. Upload the **entire `server/` folder** contents into that app root
   (`server.js`, `package.json`, `src/`). Do **not** upload `node_modules`.
3. Install dependencies via SSH:
   ```bash
   ssh uXXX@ssh.yourdomain.com
   cd api
   npm install --production
   ```
4. Set **Environment variables** in the Node.js App panel (these become real
   `process.env`, which the code already reads):
   ```
   NODE_ENV=production
   PORT=                       # leave as assigned by Hostinger
   CORS_ORIGIN=https://yourdomain.com
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   R2_ENDPOINT=https://<id>.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=educare-documents
   R2_REGION=auto
   FAST2SMS_API_KEY=...
   ```
   > `CORS_ORIGIN` must be the frontend domain from step 1, or the browser
   > will be blocked by CORS.
5. In the Node.js panel, set the app to **Run** and save. Confirm with:
   ```bash
   curl https://api.yourdomain.com/api/health
   # → {"status":"ok",...}
   ```

### Gotcha — the `dotenv` path
`env.js` loads `.env` from three levels above `src/config/` (the repo root).
On Hostinger the app lives in `/home/uXXX/api`, so that relative path won't
resolve. Because Hostinger injects env vars at the process level, the app still
works **without** a `.env` file. If you prefer a file instead, drop a `.env` in
the app root and change the `dotenv.config` path to `resolve(__dirname, '../.env')`
(one level up from `src/config/env.js`).

---

## 3. Connect Frontend → Backend

- `VITE_API_URL` (set in step 1) already points at `https://api.yourdomain.com/api`.
- The API answers at `https://api.yourdomain.com/api/*` (mounted routes + `/api/health`).
- Supabase Auth + R2 storage are used directly from the client, so no extra proxy
  is needed beyond CORS being configured on the API.

---

## 4. Quick Checklist

- [ ] Frontend `dist/` uploaded to `public_html/` + `.htaccess` rewrite added.
- [ ] `VITE_API_URL` / `VITE_SUPABASE_*` set **before** `npm run build`.
- [ ] Node.js app created on `api.yourdomain.com`, startup `server.js`.
- [ ] `npm install --production` run in app root via SSH.
- [ ] All `SUPABASE_*`, `R2_*`, `FAST2SMS_API_KEY`, `CORS_ORIGIN` env vars set.
- [ ] `/api/health` returns `ok`.
- [ ] Test a real flow: register → login → admission submit.

---

## 5. Common Issues

| Symptom | Cause / Fix |
|---|---|
| `Missing required environment variable` on boot | Env var not set in Node.js panel; add all `SUPABASE_*`/`R2_*` keys. |
| CORS error in browser | `CORS_ORIGIN` ≠ frontend domain. Update and restart app. |
| 404 on page refresh | Missing `.htaccess` SPA rewrite in `public_html`. |
| API unreachable | App not set to **Run**, or wrong startup file (`server.js`). |
| Build shows old API URL | `VITE_*` vars read at build time — rebuild after changing. |
| Huge JS bundle warning | Build warns about >500 kB chunk; optional code-splitting later. |
