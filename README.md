# EduCare Web Portal — Walkthrough

## What Was Built

A full-stack web application for a healthcare & nursing training institute with:

- **React frontend** (Vite) — 27 page/layout components
- **Express API** backend — 11 route modules, 11 controllers, 4 middleware
- **Supabase PostgreSQL** schema — 12 tables, 18 indexes, RLS policies
- **Role-based access** — Admin, Student, Franchise

---

## Architecture Summary

```
Client (React/Vite) → Express API → Supabase (Auth + PostgreSQL + Storage)
```

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Axios, react-hook-form, recharts, lucide-react |
| Backend | Express 5, Zod, Helmet, CORS, Morgan, rate-limit, Multer, PDFKit |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth (JWT) + Express middleware |
| Storage | Supabase Storage (documents, certificates, photos) |

---

## Files Created

### Backend (`server/`)

| Path | Purpose |
|---|---|
| [server.js](file:///c:/Users/AnkanSarkar/OneDrive%20-%20Iskraemeco%20India%20Pvt%20Ltd/Documents/dev/edu%20web%20portal/server/server.js) | Entry point |
| [src/app.js](file:///c:/Users/AnkanSarkar/OneDrive%20-%20Iskraemeco%20India%20Pvt%20Ltd/Documents/dev/edu%20web%20portal/server/src/app.js) | Express app with middleware and route mounting |
| `src/config/` | [env.js](file:///c:/Users/AnkanSarkar/OneDrive%20-%20Iskraemeco%20India%20Pvt%20Ltd/Documents/dev/edu%20web%20portal/server/src/config/env.js) (validated env), [supabase.js](file:///c:/Users/AnkanSarkar/OneDrive%20-%20Iskraemeco%20India%20Pvt%20Ltd/Documents/dev/edu%20web%20portal/server/src/config/supabase.js) (admin + public clients) |
| `src/middleware/` | [auth.js](file:///c:/Users/AnkanSarkar/OneDrive%20-%20Iskraemeco%20India%20Pvt%20Ltd/Documents/dev/edu%20web%20portal/server/src/middleware/auth.js), [rbac.js](file:///c:/Users/AnkanSarkar/OneDrive%20-%20Iskraemeco%20India%20Pvt%20Ltd/Documents/dev/edu%20web%20portal/server/src/middleware/rbac.js), [rateLimiter.js](file:///c:/Users/AnkanSarkar/OneDrive%20-%20Iskraemeco%20India%20Pvt%20Ltd/Documents/dev/edu%20web%20portal/server/src/middleware/rateLimiter.js), [validate.js](file:///c:/Users/AnkanSarkar/OneDrive%20-%20Iskraemeco%20India%20Pvt%20Ltd/Documents/dev/edu%20web%20portal/server/src/middleware/validate.js) |
| `src/routes/` | 11 route files (auth, courses, admissions, students, exams, results, notices, certificates, franchises, admin, documents) |
| `src/controllers/` | 11 controllers with Supabase queries |
| `src/validators/` | Zod schemas for all request payloads |
| `src/utils/` | Student ID generator |

### Database (`supabase/`)

| Path | Purpose |
|---|---|
| [001_full_schema.sql](file:///c:/Users/AnkanSarkar/OneDrive%20-%20Iskraemeco%20India%20Pvt%20Ltd/Documents/dev/edu%20web%20portal/supabase/migrations/001_full_schema.sql) | 12 tables, indexes, RLS policies, `is_admin()` helper function |

### Frontend (`client/src/`)

| Directory | Contents |
|---|---|
| `services/` | `api.js` (Axios with auth interceptor), `supabaseClient.js` |
| `context/` | `AuthContext.jsx` (login, register, logout, role helpers) |
| `hooks/` | `useFetch.js` (data-fetching hook) |
| `routes/` | `AppRouter.jsx`, `ProtectedRoute.jsx` |
| `components/layout/` | `PublicLayout.jsx` (glassmorphism header + dark footer), `DashboardLayout.jsx` (role-aware sidebar) |
| `styles/` | `index.css` (full design system: variables, buttons, forms, cards, tables, badges, grids) |
| `pages/public/` | Home, About, Courses, Contact, Notices, Verify, FranchisePage, AdmissionPage |
| `pages/auth/` | Login, Register, ForgotPassword |
| `pages/admin/` | Dashboard, Students, Admissions, Exams, Results, Notices, Certificates, Franchises |
| `pages/student/` | Dashboard, Profile, Exams, Results, Certificates |
| `pages/franchise/` | Dashboard |

---

## Build Verification

| Check | Result |
|---|---|
| Frontend production build | ✅ 2185 modules, 0 errors (3.32s) |
| Bundle size | 557 KB JS (166 KB gzipped) + 14 KB CSS |

---

## How to Run

### 1. Set up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_full_schema.sql` in the SQL Editor
3. Create storage buckets: `student-photos`, `documents`, `certificates`

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Add your Cloudflare R2 settings in `.env`:

- Create an R2 bucket (example: `educare-documents`)
- Create an R2 API token with read/write access to the bucket
- Set `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_REGION`

Also create `client/.env`:
```
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=<your-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Start the backend

```bash
cd server
npm run dev
```

### 4. Start the frontend

```bash
cd client
npm run dev
```

### 5. Create the admin user

In the Supabase dashboard, manually create a user in Auth, then insert a row in `users` with the `admin` role_id.

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| Express API instead of direct Supabase calls | Full control over business logic (admission approval auto-creates student), rate limiting, file validation |
| Service role key on server only | Anon key on client for auth; service role key never exposed |
| Admission approval creates student | When admin approves, the controller atomically creates: auth user → users row → students row |
| Franchise approval creates franchise user | Same pattern — approval triggers user account creation |
| Verification codes on results/certificates | Random hex codes for public verification without exposing internal IDs |
| Design system in vanilla CSS | No framework lock-in, full control, CSS variables for consistent theming |
