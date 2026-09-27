# Aloke — Portfolio

Personal portfolio for Aloke, AI Engineer & Full Stack Developer.
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Motion · Lucide.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
npm run typecheck
```

Node 20+ recommended. Copy `.env.example` to `.env.local` for optional integrations.

## Edit your content

All content lives in `/data`. UI components never hard-code personal details.

| File | What's in it |
| --- | --- |
| `data/site.ts` | Name, SEO text, **email / GitHub / LinkedIn links** |
| `data/about.ts` | About statement, facts, the five focus cards |
| `data/skills.ts` | Skills + categories (drives the orbit and filters) |
| `data/projects.ts` | Projects + case-study content + architecture diagrams |
| `data/experience.ts` | Timeline (work, education) + professional experience |
| `data/pipeline.ts` | "How I Build" stages |

### Placeholders

Anything not yet known is wrapped in `placeholder("…")`. It renders on the site as a **dashed amber chip** (or a dashed, inert button for links), so it can't be mistaken for real information.
Find them all with:

```bash
grep -rn "placeholder(" data/
```

Replace a placeholder by swapping `placeholder("…")` for a plain string, e.g.
`github: "https://github.com/aloke-xyz"`. To remove an optional item (such as a project's `liveUrl`), delete the line.

**Please review:** project overview/problem/solution/architecture text was drafted from your one-line descriptions — check it's accurate. The hospitality summary in `data/experience.ts` and "Dublin, Ireland" as your location are also assumptions to confirm.

## Integrations (optional)

- **GitHub section** — set `GITHUB_USERNAME` to load real public repos and language split (REST API, cached 6 h). Add `GITHUB_TOKEN` for the real contribution calendar. Without them the section shows sample data with a visible "Sample data" label. Logic: `lib/github.ts`.
- **Contact form** — `app/api/contact/route.ts` validates input server-side (shared rules in `lib/validation.ts`), has a honeypot and a basic rate limit, and sends via Resend when `RESEND_API_KEY` + `CONTACT_TO_EMAIL` are set. In development without keys, messages are logged to the terminal and the form shows success. In production without keys, it shows an error pointing people to email/LinkedIn. No keys ever reach the browser.

## Structure

```
app/                 layout (fonts, SEO, providers), page, API route, OG image, icon, robots, sitemap
components/
  animations/        Reveal, SplitText, ScrollText, Magnetic, Counter
  background/        NeuralCanvas (lazy-loaded 2D-canvas network)
  layout/            Navbar, Footer, CustomCursor, Providers
  projects/          ProjectCard, ProjectModal, ArchitectureDiagram, ProjectVisual
  sections/          Hero, About, Skills, Projects, HowIBuild, Experience, GitHubActivity, Contact(+Form)
  ui/                Button/ButtonLink, SectionHeading, Text (placeholder-aware), BrandIcons
data/                all content
lib/                 content helpers, hooks, github, validation, utils
```

## Notes on design decisions

- **Hero wormhole (`components/background/Wormhole.tsx`)** is a real 3D scene in raw WebGL2 — no Three.js. The geometry is a catenoid (an Einstein–Rosen bridge "embedding diagram"): a narrow throat that flares out into two sheets. A flowing grid streams down through the throat, speckles ride the flow, edges catch rim light and the throat glows white-hot, in dark blue and white. The pointer orbits and tilts the camera; scrolling out of the hero dives the camera toward the throat and speeds up the flow. Tune it with the constants at the top (`V_MAX`, `Y_SCALE`), the grid densities and colours in the fragment shader, and the camera / `uShift` values in `draw()`.
  - Performance safeguards: renders below native resolution with additive blending (no depth buffer), lowers resolution further if frames run slow, starts only once the page is idle, pauses off-screen and in background tabs, and draws one still frame with reduced motion.
  - Fallback: if WebGL2 is unavailable or would run on the CPU (software renderer, i.e. no GPU), it swaps to the lightweight 2D-canvas neural network (`NeuralCanvas.tsx`).
- **Reduced motion:** `MotionConfig reducedMotion="user"` plus a global CSS rule disables transform animations, the orbit rotation, and the canvas animation.
- **Custom cursor** only mounts on devices with a fine, hovering pointer. Add `data-cursor="view" | "open" | "hover" | "hidden"` to any element to control it; external links (`target="_blank"`) show `OPEN ↗` automatically.
- **Hero entrance is CSS-driven** so the headline paints before JavaScript hydrates (better LCP).
- Project cover art is drawn in SVG (`ProjectVisual.tsx`). Swap in real screenshots with `next/image` when you have them.
