---
name: SANAT
description: La red social de la escena musical de Tucumán, con mascotas como marca.
colors:
  violet-primary: "#7e22ce"
  violet-hover: "#9333ea"
  violet-deep: "#581c87"
  violet-soft: "#f3e8ff"
  violet-light: "#c084fc"
  string-violet: "#7B0099"
  ground: "#0f0f0f"
  wall-ground: "#0c0c0c"
  surface: "#1a1a1a"
  surface-low: "#141414"
  border: "#2a2a2a"
  border-strong: "#3a3a3a"
  poster-ink: "#121212"
  poster-paper: "#f4efe6"
  paper-ink: "#1c1917"
  paper-soft: "#57534e"
  text-primary: "#fafafa"
  tape-lilac: "rgba(233, 213, 255, 0.62)"
typography:
  display:
    fontFamily: "Nirvana, sans-serif"
    fontSize: "clamp(3.6rem, 15vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "0.05em"
  headline:
    fontFamily: "Nirvana, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.05em"
  poster-headline:
    fontFamily: "Anton, Nirvana, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0.01em"
  handwritten:
    fontFamily: "Permanent Marker, cursive"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
  retro-osd:
    fontFamily: "Press Start 2P, Courier New, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.05em"
rounded:
  sm: "2px"
  lg: "8px"
  xl: "12px"
  poster-button: "14px"
  2xl: "16px"
  sticker: "22px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.violet-primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.violet-hover}"
  chip-filter:
    backgroundColor: "{colors.surface-low}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
  chip-filter-active:
    backgroundColor: "{colors.violet-primary}"
    textColor: "{colors.text-primary}"
  input:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "14px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "16px"
  poster-paper:
    backgroundColor: "{colors.poster-paper}"
    textColor: "{colors.paper-ink}"
    rounded: "0px"
    padding: "28px"
  poster-violet:
    backgroundColor: "{colors.violet-primary}"
    textColor: "{colors.text-primary}"
    rounded: "0px"
    padding: "28px"
  poster-ink:
    backgroundColor: "{colors.poster-ink}"
    textColor: "{colors.text-primary}"
    rounded: "0px"
    padding: "28px"
  button-paste-dark:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.poster-button}"
    padding: "16px 28px"
  button-paste-violet:
    backgroundColor: "{colors.violet-primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.poster-button}"
    padding: "16px 28px"
  button-paste-violet-hover:
    backgroundColor: "{colors.violet-hover}"
  sticker:
    backgroundColor: "#ffffff"
    rounded: "{rounded.sticker}"
    padding: "26px 22px 18px"
---

# Design System: SANAT

## Overview

**Creative North Star: "La pared de la sala de ensayo"**

SANAT is a near-black rehearsal room with one violet light on. Inside the app the room is tidy: tonal dark surfaces stacked a step apart, thin charcoal borders, violet reserved for the action you are meant to take, and the Nirvana brand face on every h1 and h2. Musical nods (guitar strings, equalizer bars, a retro TV) sit at the edges, never in the way of the task.

The mascots are the brand. They are square cartoon characters drawn with thick black outlines and a cartoon drop of solid black beneath them, wearing one of dozens of costumes. Every surface that introduces SANAT should let them show up and be touched.

The public welcome page extends the room outward to its wall: a brick ground, paper, violet and ink posters taped up at slight angles, mascots peeled on as white stickers, and Anton for the poster headlines. That extension is where the poster vocabulary lives; the logged-in app keeps its calmer card language.

**Key Characteristics:**
- Near-black tonal grounds (#0f0f0f, #141414, #1a1a1a) separated by #2a2a2a hairlines.
- One violet accent family, purple-700 at rest and purple-600 on hover.
- Nirvana for brand and section titles; Anton only for poster headlines on the wall.
- Mascots are always the real Mascot component; photo and initial avatars are round with a thin grey ring.
- Motion is small, looping and character-driven, and always stops under reduced motion.

## Colors

A dark-room palette: graphite grounds, a single violet voice, and on the wall, warm poster paper.

### Primary
- **Rehearsal Violet** (violet-primary): primary buttons, active filter chips, the sent chat bubble, the violet poster, the long marquee tape. The only saturated UI color.
- **Lit Violet** (violet-hover): hover state of every violet action.
- **Deep Violet** (violet-deep): date numerals on paper posters.
- **Violet Haze** (violet-soft): body copy set on a violet poster.
- **Focus Violet** (violet-light): the 3px focus outline on the wall.
- **Guitar String Violet** (string-violet): the vertical string gradients on the login screen only.

### Neutral
- **Room Black** (ground): app background, inputs, the dark paste button.
- **Wall Black** (wall-ground): base under the brick tile on the welcome page.
- **Amp Grey** (surface) and **Low Shelf** (surface-low): cards and inactive chips, one step above the ground.
- **Cable Grey** (border) and **Worn Cable** (border-strong): hairline borders and dividers.
- **Poster Ink** (poster-ink): the black poster.
- **Poster Paper** (poster-paper), **Paper Ink** (paper-ink), **Pencil Grey** (paper-soft): the light poster's ground, headline and body text.
- **Lilac Tape** (tape-lilac): translucent tape strips holding posters.

### Named Rules
**The One Voice Rule.** Violet is the only accent in the UI. Mascot colors (green, orange, blue, pink, yellow, teal, red, purple) belong to the characters, never to buttons or chrome.

**The Paper Is Only On The Wall Rule.** Poster Paper and Lilac Tape appear on the welcome wall; logged-in screens stay on the graphite grounds.

## Typography

**Display Font:** Nirvana (self-hosted, single weight, with sans-serif fallback)
**Poster Font:** Anton (self-hosted via @fontsource, weight 400)
**Handwritten Font:** Permanent Marker (Google Fonts)
**Body Font:** system sans via Tailwind defaults
**Retro Font:** Press Start 2P (Google Fonts), SANAT TV on-screen display only

**Character:** Nirvana is the band logo, grungy and spaced; Anton is the gig-poster shout; Permanent Marker is the note scribbled on the flyer.

### Hierarchy
- **Display** (Nirvana 400, clamp(3.6rem, 15vw, 6rem), 0.9): the SANAT wordmark on the main poster.
- **Headline** (Nirvana 400, 2.25rem to 6rem, 1): every h1/h2 in the app; big single-word poster callouts (BAJISTA, JAM, DARKORE) and date numerals on the wall.
- **Poster Headline** (Anton 400, 2.25rem mobile to 3.75rem desktop, 1 to 1.05): section headlines and event titles on wall posters.
- **Handwritten** (Permanent Marker, 1.125rem to 1.5rem): band names, captions, the Darkore quote and signature.
- **Body** (400, 14px, 1.5; 16-18px with relaxed leading on posters, max-width 65ch): app body is mostly text-sm.
- **Label** (600, 12px): chips, tabs, metadata.

### Named Rules
**The No Fake Bold Rule.** Nirvana has one weight. Headlines set in it keep font-synthesis off and the 0.05em tracking; never add font-bold to it.

**The Anton Stays On Paper Rule.** Anton is scoped to the wall and only for poster headlines; app screens keep Nirvana for titles.

## Layout

App screens are single-column and phone-first, with a fixed bottom nav and 80px of bottom padding on every main. Content sits in max-w containers (5xl to 6xl) with 16px side padding, 24px from sm up. Spacing follows Tailwind's 4px grid, most often 8, 12, 16 and 24px.

The wall uses a three-column hero from lg (1fr, up to 600px, 1fr) with side posters, collapsing to one full-width poster with stickers around it on phones. Lower sections alternate a two-column poster (1fr / 1.1fr) with deliberate overlap: a poster may pull 24-28px over its neighbor. Posters tilt between -2.4deg and +4deg. Stickers tilt more, 9-14deg. Nothing on the wall sits perfectly square except the empty slot at the end.

## Elevation & Depth

The app is tonal: depth comes from stepping #0f0f0f to #141414 to #1a1a1a with hairline borders, plus soft dark shadows on floating chrome such as the bottom nav (0 -5px 20px rgba(0,0,0,0.5)). The wall is physical: paper sits on brick with a short contact shadow and a long soft drop, stickers lift further on hover.

### Shadow Vocabulary
- **Poster Rest** (`0 2px 2px rgba(0,0,0,0.35), 0 18px 34px -10px rgba(0,0,0,0.75)`): every poster.
- **Sticker Rest** (`0 2px 3px rgba(0,0,0,0.4), 0 10px 22px -8px rgba(0,0,0,0.8)`) and **Sticker Lift** (`0 4px 6px rgba(0,0,0,0.35), 0 26px 36px -12px rgba(0,0,0,0.85)`): mascot stickers at rest and on hover/focus.
- **Tape Contact** (`0 1px 2px rgba(0,0,0,0.25)`): tape strips.
- **Paste Button Drop** (`0 10px 22px -10px rgba(0,0,0,0.9)`): wall buttons.
- **Mascot Line Shadow** (`6px 6px 0 0 #000` body, `3px 3px 0 0 #000` limbs): part of the mascot drawing itself, inside the Mascot component only.

### Named Rules
**The Drawing Is Not The Interface Rule.** The solid black offset shadow and 3-4px black outline belong to the mascot illustration. UI cards, buttons and posters use soft shadows or tonal steps, never the mascot's hard line.

## Shapes

App chrome is gently rounded: inputs 8px, buttons 12px, cards 12-16px, chips and avatars fully round. Mascots are near-square boxes (2px corners) with thick outlines. On the wall, posters are square-cornered paper with a noise grain and, on violet, a halftone dot corner; stickers are 22px die-cut cards whose bottom-right corner peels on hover; paste buttons are 14px.

## Components

### Buttons
- **Shape:** gently rounded (12px).
- **Primary:** Rehearsal Violet with white semibold text, 8px 16px for inline actions, full width 12px tall padding in modals.
- **Hover / Focus:** shifts to Lit Violet; disabled drops to 40% opacity.
- **Paste Buttons (wall):** 14px corners, 16px 28px, 17px bold. Dark on violet posters, violet on dark ground. Hover lifts 3px and tilts -1deg; active presses to 0.98.

### Chips
- **Style:** fully round, 12px semibold, Low Shelf with Cable Grey border, grey text.
- **State:** active fills Rehearsal Violet with a purple-500 border.

### Cards / Containers
- **Corner Style:** 12-16px.
- **Background:** Amp Grey on Room Black.
- **Shadow Strategy:** tonal, see Elevation.
- **Border:** 1px Cable Grey.
- **Internal Padding:** 16-24px.

### Inputs / Fields
- **Style:** Room Black fill, 1px Cable Grey stroke, 8px corners, 14px padding, grey-600 placeholder.
- **Focus:** border turns purple-600 with a 1px purple ring at 30%.

### Navigation
- **Bottom nav:** fixed, Room Black at 95% with backdrop blur, violet hairline top border, soft upward shadow. Mobile-first; present on every logged-in screen.
- **Wall header:** transparent over the wall, becomes Room Black at 90% with blur and a #262626 border after 24px of scroll. Violet-200 text links, violet Crear cuenta button.

### Mascot (signature)
The real Mascot component in any of the public costumes and colors; eyes follow the pointer; idles with a 3s ±3deg wiggle. The Dark King costume is Darkore's alone.

### Poster (wall)
Paper, violet or ink sheet with noise grain, held by lilac tape (one centered strip or two corner strips). Pastes in when it enters the viewport: drops 46px with +7deg extra rotation and settles over 0.85s on cubic-bezier(0.16, 1, 0.3, 1), staggered 130ms; the tape stretches on after.

### Mascot Sticker (wall)
A white 22px card holding a mascot, tilted; on hover it lifts 8px, counter-rotates and the corner peels; a tap swaps the costume with a 0.5s pop.

### Darkore Flame (wall)
A red-orange radial glow in screen blend rising from the Dark King's eyes onto the ink poster; flickers on when the section arrives, then breathes on a 2.6s loop.

## Do's and Don'ts

### Do:
- **Do** keep violet as the single UI accent: purple-700 at rest, purple-600 on hover.
- **Do** set h1/h2 in Nirvana with font-synthesis off and 0.05em tracking.
- **Do** draw mascots only with the real Mascot component and its costumes, never a redrawn or generic character.
- **Do** stop every loop (wiggle, paste, marquee, flame, equalizer) under prefers-reduced-motion, leaving content fully visible.
- **Do** tilt wall posters within -2.4deg to +4deg and hold them with Lilac Tape.

### Don't:
- **Don't** borrow mascot colors for buttons, links or chrome.
- **Don't** apply the mascot's solid black offset shadow or thick outline to UI surfaces.
- **Don't** bold Nirvana or use it at body sizes.
- **Don't** bring Poster Paper, tape or Anton into logged-in app screens.
- **Don't** give the Dark King costume to any mascot other than Darkore's.
