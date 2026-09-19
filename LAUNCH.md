# Aether Latch — launch plan

Concrete path from this static build to paid subscribers. No theatre: ship the web loop, measure it, then wrap.

## 1. Primary launch platform

**Web on your own domain, installed as a PWA, billed with Stripe subscriptions.**

That is the fastest path to money and the easiest place to iterate on feel.

- Deploy `dist/` (from `npm run build`) to Cloudflare Pages, Netlify, or equivalent on `play.aetherlatch.game` (or your brand).
- Keep the existing `manifest.webmanifest` and theme colour so “Add to Home Screen” works on iOS/Android without a store review.
- Put Stripe Checkout behind `subscribe()` and Customer Portal behind `restore()` — see `src/monetisation/subscribe.ts`. Checkout is hosted; you do not have to store cards.
- Price as shipped: **$4.99 / month** and **$29.99 / year** (~50% off). Yearly is the default highlight on the gate that appears after play #3.
- Why not stores first: review lag, 15–30% IAP tax, and you will change latch feel weekly. The web build is already the product.

Success on this step: a stranger can play three runs, hit the gate, pay, and immediately get unlimited plays + Pro badge + Aurora trail.

## 2. Distribution that scales

Do these in order. Do not open every door at once.

1. **Soft launch on itch.io and browser portals** (CrazyGames / Poki only after the gate is non-scammy and the session is stable). Goal is playtests and clip-worthy deaths, not revenue. Use a build flag later if a portal forbids a hard paywall; keep the same core loop.
2. **Own-site SEO + short video.** Index the domain. Ship 8–15s latch-and-snap clips to TikTok, Reels, and Shorts with on-screen “Hold to latch · Release to fly” and a link in bio. The mechanic is spectator-friendly; treat video as the storefront.
3. **Capacitor or Trusted Web Activity wrappers** once web conversion is proven. Same Canvas app, native IAP via RevenueCat, same entitlement name (`aether_subscribed`). App Store / Play are distribution, not a rewrite.
4. **Optional Steam page** after D7 retention is real. Ship a thin wrapper + Steam overlay; still no live-ops content treadmill.

Community: a single Discord or Twitter/X account is enough. Do not staff a live-ops calendar until seasonal challenges exist.

## 3. Why this scales

- **Short sessions (45–90s).** Low time-to-fun, high restart rate, cheap to advertise.
- **Clips.** Latch snap, shard punch, and dissolve read at a glance on mute.
- **Skill ceiling.** Combo routing and slingshot angles stay interesting without new levels.
- **Low content cost.** Difficulty is procedural (moving anchors, faster fractures, gravity wells). One art pass, not a weekly map pack.
- **Honest monetisation.** Three free transits, then a subscription for unlimited play — not interstitial ads or a shop full of IAP spam. That matches a skill toy people reopen daily.

The loop is the product. Do not dilute it with missions, energy timers, or cosmetic gacha in v1.

## 4. KPIs to watch

Instrument these from day one (even a simple event beacon is enough).

| KPI | Why it matters | Early target |
| --- | --- | --- |
| **D1 / D7 retention** | Did the feel hook? | D1 > 25%, D7 > 8% before scaling spend |
| **Free → paid after play #3** | Gate quality + price | > 4% of players who see the gate |
| **Average session length** | Juice vs. frustration | 2–4 minutes (several runs) |
| **Share rate** | Clip / result share or copy-link | Rising weekly; treat as free UA |

Also watch: latch success rate on the first run (tutorial health), death-to-retry time (must stay <200ms), and unsubscribe / refund rate after yearly.

If D1 is weak, fix feel — not the paywall. If D1 is strong and conversion is weak, rewrite gate copy or trial length, not the physics.

## 5. Suggested next engineering

In priority order, after this v1:

1. **Real Stripe Checkout + Customer Portal.** Webhook to record entitlements; never trust the client flag alone.
2. **Account sync.** Anonymous id → optional email magic link so Pro survives a new browser. Same flag, server-authoritative.
3. **Leaderboards.** Weekly seed + signed scores. Spectator clips need a number to chase.
4. **Seasonal challenges.** One rotating modifier (dense wells, fragile anchors) — still procedural, still no content farm.
5. **Native IAP** via RevenueCat when wrappers ship; map monthly/yearly product ids and call `restorePurchases()`.
6. **Telemetry.** Funnel: title → run start → first latch → first shard → death → retry / gate / checkout.

Do not add accounts, backends, or live payment APIs until the web loop is fun enough that you would pay for a fourth run yourself.
