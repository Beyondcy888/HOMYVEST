# Product

<!-- impeccable:product-schema 1 -->

> Source of these answers: the owner's written brief in `docs/02_PROJECT_BRIEF.md`, `docs/04_SITE_FLOW_AND_STORY.md` and `docs/07_CONTENT_AND_COPY.md`. The owner was away during setup and the brief instructs the build to run unattended, so no live interview took place. Where this file and `docs/` disagree, `docs/` wins.

## Platform

web

## Stack

Set by the owner's brief (`docs/09_TECH_ARCHITECTURE.md`): Vite, React 19 (JSX), TypeScript for the calculator engine only, GSAP 3 (ScrollTrigger, SplitText), Lenis, three.js with React Three Fiber 9 and drei 10, zustand, Vitest, Playwright. Static output, no server code.

## Users

- **Owners of empty land in Indonesia.** The plot costs them tax and upkeep and earns nothing. They don't know what they're allowed to build, what would earn the most, or what building and running a property involves. They are not architects or investors.
- **Owners of an idle or unfinished (*mangkrak*) building.** They need to know whether it can be completed or extended within the rules, what business would suit it, and that someone can continue the construction.
- Secondary: capital-only investors without land. Served by one FAQ answer pointing to Behomy's Equity Partnership; no section of their own.

Visitors read in English (default) or Bahasa Indonesia, mostly on phones, and contact the company through WhatsApp.

## Product Purpose

HOMYVEST is a permanent campaign: an always-open invitation to owners of idle land and property. The site is two pages: a short main page that gets a visitor to leave their number within seconds and then explains who we are, how it works and who runs it, and `/portofolio/`, where the 3D showpieces tell the story in motion. After a few minutes a visitor must know who HOMYVEST is, what it does, why this team, what their own land could become (through the land-check calculator with live 3D), and exactly how to move forward (leave a number in the form, or WhatsApp with their answers and results prefilled).

Success is an owner sending a WhatsApp message that carries their land-check results.

## Positioning

One team from empty land to monthly report: HOMYVEST finds the potential, HomyEight builds, Behomy operates. Three things separate it from an ordinary build-to-rent offer, and the page must make them felt rather than list them:

1. The land decides the use (stays, offices, cafés, sports venues), not a catalogue.
2. Behomy's hybrid operations mix daily and monthly stays so rooms keep earning across seasons.
3. There is more than one way in: empty land, or an idle or unfinished building.

HOMYVEST is not a developer and does not sell buildings, units or land.

## Operating Context

- Visitors arrive from campaigns and referrals, often on a phone, often in Indonesian.
- The calculator uses Indonesian zoning terms (KDB, KLB, KDH; KRK/PKKPR; PBG). Each is explained in plain language where it first appears.
- Every call to action goes to WhatsApp `+62 821-1010-6088` (`https://wa.me/6282110106088`) with a prefilled message.
- There is no email, address or domain yet. `https://homyvest.example` is a placeholder.

## Capabilities and Constraints

- Main page, in order: hero with the lead funnel (phone number → funding → details), what is HOMYVEST, end-to-end (plan · design · build · operate), Behomy (hero, hybrid model, stats, places it runs, before and after, the team), projects, land check, what happens next with the portfolio card, FAQ, footer.
- Portfolio page, in order: intro and index, the 3D story, the Maxone walkthrough, the padel hall, beyond stays, closing.
- Calculator formulas, defaults and rounding are locked (`docs/05_CALCULATOR_SPEC.md`); its tests must pass. 3D in the calculator must match the numbers exactly.
- Facts and numbers come only from the facts sheet in `docs/02_PROJECT_BRIEF.md` §6. Never claim guaranteed income, guaranteed occupancy, timelines, prices, awards, or cities not listed. Never use "90%".
- Project captions stay as styled placeholders until the owner fills them in (`src/content/projects.js`).
- Original renders in `renders/` are read-only and never upscaled.
- The site must work without 3D (reduced motion, no WebGL, slow phones).
- Undecided: the real domain, project captions and categories, higher-resolution versions of three facade images.

## Brand Commitments

- Name: HOMYVEST. No logo; a wordmark in Archivo that expands to HOMY INVESTASI on hover.
- Partners named as HomyEight (builds) and Behomy (operates). Keep brand names, "Kos-kosan" and "Ruko" unchanged in both languages.
- Voice: calm, warm, plain-spoken, confident. Short sentences. Speaks to one owner ("your land" / "lahan Anda"). No hype words, no exclamation marks in body copy, never "USP" or "why choose us". Indonesian is written natively with "Anda".
- Visual commitments made binding by the owner: black and white only, Archivo only, colour arrives only through the property renders, and the 3D follows a white clay architectural-model language (the SliderCentral reference).

## Evidence on Hand

- 32 original renders in `renders/`: facades, interiors, the Maxone hotel lobby and dining (7 views and a floor plan), offices, a café, a mini-soccer arena, and a padel hall in three axonometric stages.
- Behomy figures: 82% average occupancy and 65.4% average GOP margin (Aug 2025–Mar 2026), 3,000+ rooms, 100+ locations in 18 areas, rated 4.7+, official hotel-chain tag on 4 OTAs, 500+ creators.
- HomyEight figures: 50+ projects, founded 2021 with roots back to 2011, in-house furniture workshop.
- Absent, and not to be fabricated: testimonials, client names beyond those in the brief, prices, construction timelines, awards, an email or street address for HOMYVEST.

## Product Principles

1. Show, don't claim. The reasons to choose this team are concluded from the story, the visuals and the numbers, never presented as a list.
2. Honest numbers first. Gross figures are labelled gross; examples are labelled examples; estimates are never promises.
3. The land decides. Every part of the page keeps the range of uses open.
4. One clear next step. From anywhere, WhatsApp is at most two taps away.
5. Smoothness over spectacle. The site must be lovely with 3D and complete without it.

## Accessibility & Inclusion

WCAG 2.2 AA. Body text contrast at least 4.5:1 in both themes, visible focus on every control, touch targets at least 44 × 44 px, every 3D canvas has a text alternative, pinned scroll scenes can be skipped, reduced motion is fully honoured, and the language toggle updates `<html lang>`.
