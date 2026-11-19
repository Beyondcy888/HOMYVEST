---
name: HOMYVEST
description: A quiet, black-and-white architecture-studio page where colour arrives only through the property renders.
colors:
  paper: "#FAFAF7"
  paper-2: "#F2F1EC"
  ink: "#0B0B0A"
  ink-2: "#3B3A37"
  muted: "#74726C"
  line: "#DCDAD3"
  clay: "#EEECE6"
  clay-shadow: "#CFCAC0"
  zone-green: "#8C9C7A"
  dark-paper: "#0C0C0B"
  dark-paper-2: "#161614"
  dark-ink: "#F3F2EE"
  dark-ink-2: "#C8C6BF"
  dark-muted: "#8E8C86"
  dark-line: "#2B2A27"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 8.5vw, 9.5rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  h1:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  h2:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.75rem)"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  h3:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.15rem, 1.6vw, 1.4rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.05vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  small:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0em"
  label:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
  stat:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 7vw, 7.5rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
rounded:
  none: "0px"
  hair: "2px"
spacing:
  gutter: "clamp(20px, 5vw, 80px)"
  section: "clamp(96px, 14vh, 200px)"
  max: "1440px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "18px 28px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 0"
---

# Design System: HOMYVEST

Source of truth: `docs/03_BRAND_AND_DESIGN.md`. This file mirrors it for design tools. Where they disagree, `docs/` wins.

## Overview

HOMYVEST should feel like a quiet, expensive architecture studio, not a property listing site. The page is black and white, set entirely in Archivo, with large type against large images and a great deal of air.

One idea organises everything: **white clay means planned and being built; full colour means real, alive and earning.** The 3D scenes are matte white architectural models. Colour arrives only when a clay model resolves into a real render, or when a photograph opens like a window onto a colourful room. Every arrival of colour should feel earned.

The reference for the 3D storytelling is a white clay model on a white ground with soft contact shadows, seen from a high three-quarter camera with a long lens. Wall fragments drift in and assemble into a building with its top cut away so the rooms are visible. Nothing bounces. Pieces settle with an exponential ease-out.

## Colors

Black and white with warm neutrals. There is no brand colour, no gradient and no tinted UI.

### Neutral
- **Paper** `#FAFAF7`: the page.
- **Paper 2** `#F2F1EC`: raised surfaces, the open zone in the calculator.
- **Ink** `#0B0B0A`: text and primary buttons.
- **Ink 2** `#3B3A37`: secondary text.
- **Muted** `#74726C`: captions and help text, at least 4.5:1 on paper.
- **Line** `#DCDAD3`: hairlines.
- **Clay** `#EEECE6` and **Clay shadow** `#CFCAC0`: the 3D model material.

Dark theme swaps paper and ink (`#0C0C0B` / `#F3F2EE`). The clay stays light in dark mode: white models on near-black.

### Named Rules
- **The one functional colour.** The calculator's "must stay green" zone uses zone green `#8C9C7A` in the split bar, the legend and the 3D. Nowhere else.
- **Warnings are never red.** Over-limit and warning states use ink, an icon and a diagonal hatch.
- **The lone accent in clay scenes** is a single near-black element (`#1C1B19`), such as a stair core.
- **Warm light, once.** Window glass warms to `#FFD9A8` only in the hero's "alive" beat.

## Typography

Archivo Variable for everything, self-hosted, using both the weight axis (100–900) and the width axis (62–125%).

### Hierarchy
- **Display**: 800, width 100–112%, −0.035em, line height 0.92. Hero beats and section openers.
- **H1**: 700, −0.03em, line height 1.0. Section titles.
- **H2**: 650, −0.02em. Sub-sections.
- **H3**: 600. Steps and small headings.
- **Body**: 400, line height 1.55, measure 60–72 characters.
- **Small**: 0.875rem. Help text, notes, footnotes.
- **Label**: 0.75rem, 600, width 112%, 0.12em tracking, uppercase. Section labels and tags.
- **Stat**: 800, width 90%, −0.04em. Big numbers.

### Named Rules
- **Tabular numbers** on every figure that changes.
- **Balanced headings, pretty paragraphs** (`text-wrap`).
- **Three voices for captions:** project name in bold, place in regular, type and year in muted italic.
- **The wordmark** is HOMYVEST at weight 900 and width 125%, tracking −0.02em. On hover it breathes open to HOMY INVESTASI: new letters slide in around the existing ones while the width axis eases from 125% to 104%.

## Layout

- 12-column grid, maximum content width 1440px, outer margins `clamp(20px, 5vw, 80px)`. Left and right content edges are equal.
- Sections breathe: `clamp(96px, 14vh, 200px)` between them.
- Asymmetric, editorial compositions. Big type against big images. No rows of identical cards where a more considered layout works.
- Hairline rules (`1px` line colour) instead of boxes.
- Three pinned, scroll-driven scenes (hero story, Maxone walkthrough, padel assembly). Each has a skip link and a fixed scroll length.
- Mobile first in behaviour: one column at 390px, full-width buttons, a full-screen menu, a floating WhatsApp button after the hero.

## Elevation & Depth

There are no drop shadows on interface elements. Depth comes from three places only: soft contact shadows and ambient occlusion inside the 3D scenes, the 2.5D depth parallax on photographic renders, and overlap between type and image.

## Shapes

Square corners everywhere (0–2px). No pills, no rounded cards. The one round element is the mobile floating WhatsApp button.

## Components

### Buttons
- **Primary:** solid ink with paper text, square corners, generous padding, weight 600. On hover the label slides up and is replaced by a copy of itself (a 0.35s clip).
- **Secondary:** text with an underline that draws in on hover.
- **WhatsApp:** the primary style with a small monochrome glyph.

### Inputs / Fields
Large, quiet fields with a hairline bottom border, the label above and help text below in muted. Units sit inside the field on the right (`m`, `%`, `×`, `Rp`).

### Navigation
A sticky, minimal header: wordmark left, four text links, the EN | ID toggle and a compact WhatsApp button. Transparent over the hero, paper with a hairline afterwards. It hides on scroll down, shows on scroll up, and stays hidden while a pinned scene is active.

### Tabs and steppers
Typographic (numbers and words) with an underline indicator that slides.

### Stats
A huge number, a one-line label and a small footnote marker.

### Images
Full-bleed or large, square corners, never inside a shadowed rounded card. They enter with a slow scale from 1.06 to 1.0.

### Motion
- Reveals use `expo.out` over 0.8–1.2s. Camera moves and scrubbing use `power2.inOut` or are scrubbed linearly by scroll. Nothing is bouncy or elastic.
- Headings rise line by line behind a mask. Body text only fades up.
- One main motion idea per viewport. If two things move, one of them is slow.
- Reduced motion: no scrubbing, parallax, camera moves or rolling counters. Pinned scenes become static sequences of images and text.

## Do's and Don'ts

### Do:
- Let the renders carry all the colour.
- Use hairlines, whitespace and type scale to organise, before reaching for a container.
- Keep every number traceable to the facts sheet or the calculator.
- Give every pinned scene a skip link.
- Keep the dark theme as polished as the light one.

### Don't:
- Gradient blobs, glassmorphism, neon glows, drop-shadowed rounded cards.
- Three-column feature grids with icons, testimonial carousels, "Why choose us" lists.
- Centre everything.
- Emoji, exclamation marks, icons inside circles.
- A second accent colour, or red for warnings.
- Auto-playing carousels, cursor trails, or scroll-jacking that fights the visitor.
- Text over a busy area of a render without a scrim.
