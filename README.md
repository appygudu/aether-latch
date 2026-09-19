# Aether Latch

Slingshot a luminous mote through collapsing void-anchors — latch, swing, release, chain — before the dark closes in.

A production-ready browser game: Vite + TypeScript + Canvas 2D, playable on desktop and mobile, with a three-play freemium gate and live Razorpay hosted checkout.

## Play

```bash
npm install
npm run dev
```

Open the local URL Vite prints (default `http://localhost:5173`). Hold to fire an elastic filament at a ring-anchor, swing, then release to slingshot. Collect shards, chain latches for a combo, and avoid fractures and debris.

```bash
npm run build    # typecheck + production bundle
npm run preview  # serve the dist/ build
```

The app is a static single-page site. Deploy `dist/` to any host (Cloudflare Pages, Netlify, GitHub Pages, S3, your own domain).

## How it plays

- **Latch** — press/hold; the filament seeks the nearest valid anchor, or the one most aligned with your pointer if several are in range.
- **Swing** — an elastic tether with stretch, snap-back, and conserved momentum.
- **Fly** — release to slingshot; chain latch → swing → release to raise the multiplier.
- **Survive** — runs last about 80 seconds as the void collapses. Surviving the full collapse awards a bonus. Death dissolves the mote; retry is one tap.

High score and best combo persist in `localStorage`. The first successful latch dismisses the ghost prompt.

## Freemium

New players get **exactly 3 free plays**, stored as `aether_plays_used` in `localStorage`. Remaining plays are shown on the title screen and in the HUD.

After the third run, a subscription gate appears. The player cannot start another run until they are marked subscribed.

| Plan | Price | Razorpay checkout (live) |
| --- | --- | --- |
| Monthly | **₹419 / month** (~$4.99) | https://rzp.io/rzp/9v5vQRc4 |
| Yearly | **₹2499 / year** (~$29.99) | https://rzp.io/rzp/ObFehb1q |

Choosing a plan opens the Razorpay hosted payment link in a new tab. Hosted links cannot callback without a backend, so **I've paid — Unlock Pro** (restore / already subscribed) writes `aether_subscribed=true` in this browser after the player returns (`src/monetisation/subscribe.ts`).

Razorpay plan IDs (docs only): `plan_TdpXQDppRu26iS` (monthly), `plan_Tdpa4NZjvSmkPf` (yearly).

Subscribers receive:

- Unlimited plays
- A **Pro** badge on the results screen
- The locked **Aurora** trail colour

### localStorage keys

| Key | Purpose |
| --- | --- |
| `aether_plays_used` | Number of runs started |
| `aether_subscribed` | `"true"` when Pro is active |
| `aether_plan` | `monthly` or `yearly` |
| `aether_high_score` | Best score |
| `aether_best_combo` | Best combo |
| `aether_prompt_seen` | First-latch tutorial dismissed |
| `aether_muted` | Audio mute |

To reset a local profile, clear those keys in DevTools.

## Payments

The Stripe stub is replaced by **Razorpay hosted payment links**. `subscribe()` opens the live checkout URL; it does not set the entitlement. `restore()` / **I've paid — Unlock Pro** sets `aether_subscribed` locally.

A later backend can verify Razorpay webhooks and issue a signed entitlement so Pro survives a new browser. Native wrappers can still map RevenueCat packages to `aether_pro_monthly` / `aether_pro_yearly`.

See [LAUNCH.md](./LAUNCH.md) for platform sequence and KPIs.

## Project layout

```
src/audio/synth.ts            Procedural Web Audio
src/core/                     Config, math, input, camera, RNG
src/game/                     Loop, tether physics, entities, spawn, render
src/monetisation/subscribe.ts Razorpay hosted checkout + local unlock
src/storage/persist.ts        localStorage profile
src/ui/overlay.ts             Title, HUD, results, gate
```

No heavy engine. No Razorpay SDK or payment backend in this pass — hosted links only.
