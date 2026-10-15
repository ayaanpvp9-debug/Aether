# VELTRIX — Digital, reimagined.

![VELTRIX hero](public/og.jpg)

A cinematic, full-stack concept-studio website: a kinetic-typography hero, an editorial dark-luxury design system, a consistent spring-based motion language, and a **real** inquiry backend (validation → sanitisation → SQLite storage with reference codes).

> **Honesty notes.** VELTRIX is a demonstration brand. The four projects are **fictional concepts** (not client work), testimonials are **sample/fictional personas**, the results figures are **illustrative**, and the social links and email address are **placeholders**. All of this is labelled in the UI. The interactions, the API, the database and the live performance metrics are real.

---

## Quick start

Requires **Node.js ≥ 22.12** (uses the built-in `node:sqlite`; falls back to a JSON Lines file store automatically if unavailable).

```bash
npm install
npm run dev        # Vite dev server + the real API on http://localhost:5173
```

Production:

```bash
npm run build      # typecheck → client bundle (dist/) → server bundle (dist-server/)
npm start          # one Node process serves the site + API on http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite with HMR; the inquiry API is mounted as middleware (same origin, same code as production). |
| `npm run build` | `tsc -b`, then `vite build` (client) and `vite build --ssr` (server). |
| `npm start` | Zero-dependency Node server: static files (brotli/gzip, immutable caching, security headers) + API. |
| `npm run preview` | Vite preview of `dist/` (API mounted too). |
| `npm test` | Vitest — validation, sanitisation, API status codes, rate limiting, auth, storage persistence. |
| `npm run lint` / `npm run typecheck` | ESLint (incl. React Compiler rules) / TypeScript project references. |
| `npm run inquiries -- 20` | CLI: print the latest stored inquiries (after `npm run build`). |

---

## What’s inside

**Frontend** — React 19, TypeScript, [Motion](https://motion.dev) (`motion/react`), Lucide icons, self-hosted variable fonts (Unbounded, Geist, Geist Mono, Instrument Serif). No CSS framework; component-scoped CSS on a token system. No Three.js/GSAP — the hero’s infinite type loops run on the Web Animations API (compositor-driven transforms, no React re-renders).

| Section | Highlights |
| --- | --- |
| Intro | ~1.3 s movie-title sequence, once per session, skippable (any key/click/scroll), skipped for reduced motion. |
| Nav | Scroll-aware glass pill (transform-only, no layout shift), sliding hover/active indicators, char-roll links, auto-hide on scroll, full-screen mobile menu with circular wipe, focus trap, Esc. |
| Hero | Headline-first composition: masked line-by-line reveal with a periodic sheen on “REIMAGINED.”, oversized background words drifting at three speeds/depths (pointer + scroll parallax), soft light sweeps and a cursor-following light, staggered copy and magnetic CTAs with a landing glint, and a full-bleed typographic conveyor (“Creative development · Interactive experiences · …”). Seamless −50% loops at a constant px/s that re-time without jumping on resize and pause off-screen; duplicates are `aria-hidden`; a round control on the conveyor pauses all looping motion site-wide (remembered). |
| Marquee | Velocity-reactive dual tape that tilts with scroll; calmer under reduced motion (half speed, no tilt/skew) and frozen by the site-wide pause control. |
| Work | Filter tabs with shared-layout indicator; 4 bespoke SVG/CSS concept visuals; full-screen case study that expands out of its card, deep-linkable (`?project=aurele`), back gesture closes it; swipeable lightbox with keyboard + thumbnails; click-to-copy palettes. |
| Capabilities | Six working demos: layout presets that physically reflow · live ping of this site’s API (real latency + JSON) · pointer/ripple dot field · product variants + fly-to-bag cart with popover · palette generator with copy · **real** Core Web Vitals from `PerformanceObserver`. |
| Lab | Five themes (registered `@property` colour transitions), glass/glow/grid/motion switches, radius slider, density + transition dropdowns, screen transitions, inspect mode with live measurements and a keyboard-accessible component picker, reset. On tablets and phones the live preview stays pinned in a compact, scaled view so it fits on screen next to the controls. |
| Process | Sticky rolling counter, scroll-drawn connecting line, active-step highlighting. |
| Results | Illustrative metrics with count-ups and a template ↔ crafted comparison switch. |
| Testimonials | Fictional, labelled; autoplay with progress (pauses on hover/focus/off-screen), swipe, tabs. |
| FAQ | Accordion with animated height, morphing icon, arrow-key navigation. |
| Contact | Shared client/server validation, chips, radio cards, custom listbox, honeypot, live service status, loading/success/error states. |
| Footer | Spotlight wordmark, animated links, labelled social placeholders, return-to-top. |

**Accessibility & motion** — semantic landmarks, skip link, visible focus, keyboard support for every control (tabs, listbox, accordion, switches, sliders, overlays), focus trapping + restoration, `inert` page behind overlays, live regions for status, `prefers-reduced-motion` means calmer, not frozen (no intro, no parallax or scroll-linked movement, no smooth scrolling, slower loops — entrances, ripples, hovers and other feedback keep working), plus an on-page pause control for all looping motion (WCAG 2.2.2), no scroll hijacking, touch-friendly fallbacks for every hover effect.

---

## Backend

All server code lives in `server/` and has **no runtime dependencies**. The same handler runs inside Vite (dev/preview) and the production server.

| Method & path | Behaviour |
| --- | --- |
| `GET /api/health` | `200 { ok, status, storage, persistent, time }` after a real storage query · `503` if the store doesn't answer (used as Render's health check) |
| `POST /api/inquiries` | `201 { ok, reference: "VX-XXXXXX", receivedAt, storage }` on success |
| | `422` field errors · `400` malformed JSON / honeypot · `413` > 16 KB · `415` non-JSON · `403` cross-site · `429` + `Retry-After` · `503` storage failure (nothing stored) |
| `GET /api/inquiries?limit=50` | Admin listing, `Authorization: Bearer $ADMIN_TOKEN` (timing-safe compare). **Disabled (404) unless `ADMIN_TOKEN` is set.** |

- **Validation** is shared (`shared/inquiry.ts`) so the browser gives instant feedback, but the server is authoritative.
- **Sanitisation**: NFKC normalisation, control/zero-width/bidi-override characters stripped, markup removed from single-line fields, whitespace collapsed. Values are stored with prepared statements (never interpolated) and are never rendered as HTML.
- **Storage**: SQLite (`data/veltrix.db`, WAL) via `node:sqlite`, or an append-only JSONL file (`data/inquiries.jsonl`). `data/` is git-ignored.
- **Abuse protection**: per-IP sliding-window rate limit (bounded memory), honeypot field, JSON-only content type (forces a CORS preflight cross-origin) plus `Sec-Fetch-Site`/`Origin` checks, 16 KB body limit, request timeouts.
- **Production server**: CSP, `nosniff`, referrer & permissions policies, COOP, path-traversal protection, ETags, brotli/gzip, immutable caching for hashed assets, branded 404, graceful shutdown. (Frame-blocking headers are intentionally omitted so the site works in embedded previews — add `frame-ancestors` to the CSP if you need clickjacking protection.)
- **Email**: not sent. The UI says so explicitly. To add notifications, call your provider (e.g. SMTP or a transactional email API) in `server/api.ts` right after `store.insert()`, with credentials in server-side env vars only.

### Environment variables

Copy `.env.example` to `.env` (never commit it). Everything is optional.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` / `HOST` | `3000` / `0.0.0.0` | Production server address. Render injects `PORT` (10000) automatically. |
| `DATA_DIR` | `./data` | Where inquiries are stored. Must be a persistent disk in production (see [SQLite persistence](#sqlite-persistence-on-render)). |
| `INQUIRY_STORE` | `auto` | `auto` (SQLite → file fallback), `sqlite`, or `file`. |
| `ADMIN_TOKEN` | — | Enables the admin listing endpoint (≥ 24 chars). |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | `8` / `900000` | Submissions per IP per window. |
| `CLIENT_IP_HEADER` | — | Header the hosting edge always overwrites with the visitor IP (Render: `true-client-ip`). |
| `TRUST_PROXY` | `false` | Number of trusted proxies (`true` = 1). `X-Forwarded-For` is read from the right, never the spoofable left. |
| `ALLOWED_ORIGINS` | — | Comma-separated origins allowed to POST (empty = same-origin browsers only). |
| `SITE_URL` | — | Build time: public origin for absolute `og:image`/`og:url`/canonical. Falls back to Render's `RENDER_EXTERNAL_URL`. |
| `DEV_ALLOWED_HOSTS` | — | Extra hostnames allowed by the Vite dev server. |

No secrets are ever exposed to the client: only `VITE_*` variables reach browser code, and none are used.

---

## Deployment

**Recommended: any Node host** (Render — see below — a VPS, Railway, Fly.io, a container…): `npm ci --include=dev && npm run build`, then `npm start`, with `DATA_DIR` on a persistent disk. One process serves the site and the API on `$PORT`, bound to `0.0.0.0`. That gives you the complete experience, including stored inquiries.

### Deploying to Render

The repo ships a [Blueprint](https://render.com/docs/infrastructure-as-code) (`render.yaml`) and pins Node 22 via `.node-version`.

| Setting | Value |
| --- | --- |
| Service | One **web service** (`runtime: node`), plan `free`, region `singapore` (closest to India; can't be changed later) |
| Build command | `npm ci --include=dev && npm run build` (typecheck → `dist/` → `dist-server/`) |
| Start command | `node dist-server/index.js` (same as `npm start`) — listens on Render's `PORT` at `0.0.0.0` |
| Health check | `/api/health` — 200 only if the server is up and the store answers a query |
| Auto-deploy | Every push to the linked branch |

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. In the [Render Dashboard](https://dashboard.render.com/) choose **New → Blueprint**, connect the GitHub repo, and pick the **branch** to deploy. Leave **Blueprint Path** as `render.yaml`.
3. Review the plan (one free web service called `veltrix`) and click **Deploy Blueprint**.
4. When the deploy log shows the health check passing and the service shows **Live**, your public URL is at the top of the service page: `https://veltrix.onrender.com` or, if that name is taken, a variant with a suffix.

Environment variables set by the Blueprint: `CLIENT_IP_HEADER=true-client-ip` (per-visitor rate limiting behind Render's proxy) and `ADMIN_TOKEN` (a random value Render generates; find it under **Environment**). Render itself provides `PORT`, `NODE_ENV=production` and `RENDER_EXTERNAL_URL`, which is used for absolute social-preview URLs. Nothing else is required. Set `SITE_URL` if you add a custom domain. Never commit secrets: put them in the Render Dashboard.

**Reading submissions.** Free instances have no shell, so use the admin endpoint:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://<your-service>.onrender.com/api/inquiries?limit=50"
```

#### SQLite persistence on Render

Render's filesystem is **ephemeral**. Anything written outside a persistent disk — including `data/veltrix.db` — is lost on every redeploy and restart. On the free plan it's also lost on every idle spin-down, which happens after 15 minutes without traffic. The first request after a spin-down takes about a minute.

| | Free (default `render.yaml`) | Persistent |
| --- | --- | --- |
| Cost (render.com/pricing) | $0 | `0.5c-512mb` instance $7/mo + disk $0.25/GB/mo |
| Site + API | Yes | Yes |
| Stored inquiries survive deploys/restarts | **No** — the server logs a warning, and the UI says *"temporary SQLite database"* | **Yes** — SQLite on a disk at `/var/data`, daily snapshots |
| Trade-offs | Sleeps when idle | Single instance only; a few seconds of downtime per deploy (no zero-downtime deploys with a disk) |

To switch to persistent storage, edit `render.yaml`:
1. Set `plan: 0.5c-512mb`.
2. Uncomment the `DATA_DIR=/var/data` env var and the `disk` block (remove the leading `# `).
3. Push. The server detects the disk at startup, logs "Inquiry storage is on a persistent disk", and drops the "temporary" label.

The disk is only available at runtime, not during the build, so nothing touches the database before the server starts. Don't set `DATA_DIR=/var/data` without the disk: it would just be another ephemeral folder.

**Static hosting (GitHub Pages, static Netlify/Vercel, S3…)**: the `dist/` folder works on its own, but there is **no API**. The site detects this and stays honest — the contact section shows “Inquiry service unreachable”, the form warns before sending and, on submit, says *“Nothing was sent”* with **Copy brief** and **Retry** actions; the API card reports the API as unreachable. To get persistent submissions on a static host, pick one:

1. Run `npm start` somewhere and point the domain (or an `/api/*` reverse-proxy rule) at it, or
2. Port the handler in `server/api.ts` to a serverless function and swap `server/store/` for a hosted database (Postgres, Turso/libSQL, Supabase…), or
3. Send the form to a form-backend service from a serverless function (keep its key server-side).

---

## Project structure

```
server/            API handler, config, HTTP helpers, rate limiter, static server, CLI
  store/           sqlite · file (JSONL) · memory (tests)
shared/inquiry.ts  validation + sanitisation shared by client and server
src/
  components/ui    Button, TextReveal, Segmented, Select, Switch, Slider, Accordion, Modal, Tooltip, Toasts, Marquee…
  components/layout Navbar, MobileMenu, Cursor, Intro, ScrollProgress, BackToTop, Footer, SectionBoundary
  features/hero    hero composition, drifting backdrop type, conveyor strip, seamless loop hook (useLoop)
  sections/        work · capabilities · lab · process · results · testimonials · faq · contact · marquee
  content/         all copy and data (projects, FAQ, metrics, socials…) — edit here
  hooks/, lib/     media queries, magnetic, tilt, overlays/focus trap, scroll-spy, vitals, stores
tests/             Vitest suites for validation and the API
```

To make the brand real: replace the content in `src/content/`, add real social URLs in `src/content/site.ts` (placeholders render as labelled, non-link text until then), and set a real email address.
