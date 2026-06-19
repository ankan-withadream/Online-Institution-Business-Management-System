# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-11
**Commit:** `637a31a`
**Branch:** `main`

## OVERVIEW
EduCare — full-stack web portal for a healthcare & nursing training institute. React 19 (Vite) frontend, Express 5 API, Supabase PostgreSQL + Auth + Storage. Roles: Admin, Student, Franchise.

## STRUCTURE
```
edu-web-portal/
├── client/          # React 19 (Vite) — 45 JSX files, ~9.2k lines
├── server/          # Express 5 API — 43 JS files, ~2.7k lines
├── supabase/        # PostgreSQL migrations (2 files)
└── .sisyphus/       # Orchestration state
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Entry point (client)** | `client/src/main.jsx` | Renders `<App />` |
| **Entry point (server)** | `server/server.js` | Imports app, listens on PORT |
| **Express app setup** | `server/src/app.js` | Middleware + 11 route mounts |
| **Frontend routing** | `client/src/routes/AppRouter.jsx` | Routes by role |
| **Auth context** | `client/src/context/AuthContext.jsx` | login/logout/register + role checks |
| **API client** | `client/src/services/api.js` | Axios with JWT interceptor |
| **Auth middleware** | `server/src/middleware/auth.js` | JWT verify via Supabase |
| **RBAC middleware** | `server/src/middleware/rbac.js` | `authorize('admin','student')` |
| **Validation schemas** | `server/src/validators/schemas.js` | Zod |
| **Upload middleware** | `server/src/middleware/r2.js` | S3-compatible (Cloudflare R2) |
| **Env config** | `server/src/config/env.js` | Validates required vars on startup |
| **DB client** | `server/src/config/supabase.js` | Admin + public clients |
| **SQL migrations** | `supabase/migrations/` | Schema + RLS policies |

## ROUTE-TO-CONTROLLER MAPPING
| Route File | Controller File | Mount |
|------------|----------------|-------|
| `auth.routes.js` | `auth.controller.js` | `/api/auth` |
| `courses.routes.js` | `courses.controller.js` | `/api/courses` |
| `admissions.routes.js` | `admissions.controller.js` | `/api/admissions` |
| `students.routes.js` | `students.controller.js` | `/api/students` |
| `exams.routes.js` | `exams.controller.js` | `/api/exams` |
| `results.routes.js` | `results.controller.js` | `/api/results` |
| `notices.routes.js` | `notices.controller.js` | `/api/notices` |
| `certificates.routes.js` | `certificates.controller.js` | `/api/certificates` |
| `franchises.routes.js` | `franchises.controller.js` | `/api/franchises` |
| `admin.routes.js` | `admin.controller.js` | `/api/admin` |
| `documents.routes.js` | `documents.controller.js` | `/api/documents` |
| `fees.routes.js` | `fees.controller.js` | `/api/fees` |

## FRONTEND PAGES BY ROLE
| Role | Dir | Count |
|------|-----|-------|
| Public | `client/src/pages/public/` | 10 |
| Auth | `client/src/pages/auth/` | 3 |
| Admin | `client/src/pages/admin/` | 11 |
| Student | `client/src/pages/student/` | 5 |
| Franchise | `client/src/pages/franchise/` | 6 |

## COMPLEXITY HOTSPOTS (>500 lines)
- `client/src/pages/admin/AdminResults.jsx` (811)
- `client/src/pages/admin/AdminCourses.jsx` (587)
- `client/src/pages/franchise/FranchiseApplications.jsx` (553)
- `client/src/pages/franchise/FranchiseFees.jsx` (546)

## CONVENTIONS
- **ES Modules** everywhere (`type: "module"` in both package.json files)
- **JSX** for React components (no TS — plain JS throughout)
- **Controller pattern**: `export const getAll | getById | create | update | remove`
- **Route files** mount controllers, add middleware per-route
- **Zod schemas** in single `schemas.js` file, validated via `validate` middleware
- **CSS alongside components**: `DashboardLayout.css`, `Home.css`, `PublicLayout.css`
- **lucide-react** for icons, **react-hook-form** for forms, **react-hot-toast** for notifications
- **supabaseAdmin** (service role) for server-side queries — bypasses RLS intentionally
- **snake_case** DB columns → **camelCase** in API request/response

## ANTI-PATTERNS (THIS PROJECT)
- No `any` types used (plain JS, no TypeScript)
- No `@ts-ignore` or `eslint-disable` comments found
- No TODO/FIXME/HACK comments — keep it that way

## COMMANDS
```bash
# Client
cd client && npm run dev      # Dev server on :5173
cd client && npm run build    # Production build
cd client && npm run lint     # ESLint

# Server
cd server && npm run dev      # Dev with --watch on :5000
cd server && npm run start    # Production
```

## NOTES
- `.env` file at repo root — both client (VITE_ prefixed) and server read from it
- Vite config is minimal (just React plugin) — no proxy, no aliases
- Server has NO test framework configured yet
- R2 storage used for file uploads (S3-compatible), not Supabase Storage
- 4 large files flagged as hotspots — consider refactoring if modifying
