# VELTRIX — Digital, reimagined.

![VELTRIX hero](public/og.jpg)

A cinematic concept-studio showcase: a kinetic-typography hero, an editorial dark-luxury design system, a consistent spring-based motion language, working interactive demos and a zero-dependency Node server. There is no contact form — the site exists to show the work, and it collects no visitor data.

> **Honesty notes.** VELTRIX is a demonstration brand. The four projects are **fictional concepts** (not client work), testimonials are **sample/fictional personas**, the results figures are **illustrative**, and the social links and email address are **placeholders**. All of this is labelled in the UI. The interactions, the live API ping and the performance metrics are real.

---

## Quick start

Requires **Node.js ≥ 22.12**.

```bash
npm install
npm run dev        # Vite dev server (with the site API) on http://localhost:5173
```

Production:

```bash
npm run build      # typecheck → client bundle (dist/) → server bundle (dist-server/)
npm start          # one Node process serves the site + API on http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite with HMR; the site API (`/api/health`) is mounted as middleware (same origin, same code as production). |
| `npm run build` | `tsc -b`, then `vite build` (client) and `vite build --ssr` (server). |
| `npm start` | Zero-dependency Node server: static files (brotli/gzip, immutable caching, security headers) + API. |
| `npm run preview` | Vite preview of `dist/` (API mounted too). |
| `npm test` | Vitest — API routes and status codes, hosting configuration, Render Blueprint. |
| `npm run lint` / `npm run typecheck` | ESLint (incl. React Compiler rules) / TypeScript project references. |

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
| Footer | Spotlight wordmark, animated links, labelled social placeholders, return-to-top. |

**Accessibility & motion** — semantic landmarks, skip link, visible focus, keyboard support for every control (tabs, listbox, accordion, switches, sliders, overlays), focus trapping + restoration, `inert` page behind overlays, live regions for status, `prefers-reduced-motion` means calmer, not frozen (no intro, no parallax or scroll-linked movement, no smooth scrolling, slower loops — entrances, ripples, hovers and other feedback keep working), plus an on-page pause control for all looping motion (WCAG 2.2.2), no scroll hijacking, touch-friendly fallbacks for every hover effect.

---

## Backend

All server code lives in `server/` and has **no runtime dependencies**. The same handler runs inside Vite (dev/preview) and the production server. The site is a showcase: there is no form endpoint and nothing is stored.

| Method & path | Behaviour |
| --- | --- |
| `GET /api/health` | `200 { ok, status: "ready", service, uptime, time }` — Render's health check and the live "Ping live API" demo in Capabilities |
| any other `/api/*` | `404` JSON (`405` + `Allow` for other methods on `/api/health`) |

- **Production server**: CSP, `nosniff`, referrer & permissions policies, COOP, path-traversal protection, ETags, brotli/gzip, immutable caching for hashed assets, branded 404, graceful shutdown. (Frame-blocking headers are intentionally omitted so the site works in embedded previews — add `frame-ancestors` to the CSP if you need clickjacking protection.)

### Environment variables

Copy `.env.example` to `.env` (never commit it). Everything is optional.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` / `HOST` | `3000` / `0.0.0.0` | Production server address. Render injects `PORT` (10000) automatically. |
| `SITE_URL` | — | Build time: public origin for absolute `og:image`/`og:url`/canonical. Falls back to Render's `RENDER_EXTERNAL_URL`. |
| `DEV_ALLOWED_HOSTS` | — | Extra hostnames allowed by the Vite dev server. |

No secrets are ever exposed to the client: only `VITE_*` variables reach browser code, and none are used.

---

## Deployment

**Recommended: any Node host** (Render — see below — a VPS, Railway, Fly.io, a container…): `npm ci --include=dev && npm run build`, then `npm start`. One process serves the site and the API on `$PORT`, bound to `0.0.0.0`.

### Deploying to Render

The repo ships a [Blueprint](https://render.com/docs/infrastructure-as-code) (`render.yaml`) and pins Node 22 via `.node-version`.

| Setting | Value |
| --- | --- |
| Service | One **web service** (`runtime: node`), plan `free`, region `singapore` (closest to India; can't be changed later) |
| Build command | `npm ci --include=dev && npm run build` (typecheck → `dist/` → `dist-server/`) |
| Start command | `node dist-server/index.js` (same as `npm start`) — listens on Render's `PORT` at `0.0.0.0` |
| Health check | `/api/health` — 200 as soon as the server is up |
| Auto-deploy | Every push to the linked branch |

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. In the [Render Dashboard](https://dashboard.render.com/) choose **New → Blueprint**, connect the GitHub repo, and pick the **branch** to deploy. Leave **Blueprint Path** as `render.yaml`.
3. Review the plan (one free web service called `veltrix`) and click **Deploy Blueprint**.
4. When the deploy log shows the health check passing and the service shows **Live**, your public URL is at the top of the service page: `https://veltrix.onrender.com` or, if that name is taken, a variant with a suffix.

No environment variables are required: Render provides `PORT`, `NODE_ENV=production` and `RENDER_EXTERNAL_URL` (used for absolute social-preview URLs). Set `SITE_URL` if you add a custom domain. If your service was created from an older version of this Blueprint, the leftover `ADMIN_TOKEN` and `CLIENT_IP_HEADER` variables are no longer used and can be deleted under **Environment**.

**Free plan**: the instance sleeps after 15 minutes without traffic, and the first visit after that takes about a minute. The site stores nothing, so restarts and redeploys lose nothing.

**Static hosting (GitHub Pages, static Netlify/Vercel, S3…)**: the `dist/` folder works on its own. The only server-backed feature is the "Ping live API" card in Capabilities, which then honestly reports the API as unreachable.

---

## Project structure

```
server/            production server, static file handler, /api/health handler, config, HTTP helpers
src/
  components/ui    Button, TextReveal, Segmented, Select, Switch, Slider, Accordion, Modal, Tooltip, Toasts, Marquee…
  components/layout Navbar, MobileMenu, Cursor, Intro, ScrollProgress, BackToTop, Footer, SectionBoundary
  features/hero    hero composition, drifting backdrop type, conveyor strip, seamless loop hook (useLoop)
  sections/        work · capabilities · lab · process · results · testimonials · faq · marquee
  content/         all copy and data (projects, FAQ, metrics, socials…) — edit here
  hooks/, lib/     media queries, magnetic, tilt, overlays/focus trap, scroll-spy, vitals, stores
tests/             Vitest suites for the API and the hosting configuration
```

To make the brand real: replace the content in `src/content/`, add real social URLs in `src/content/site.ts` (placeholders render as labelled, non-link text until then), and set a real email address.
