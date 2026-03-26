# Design System Specification

## 1. Overview & Creative North Star: "The Architectural Monolith"

This design system is built upon the concept of **The Architectural Monolith**. It is a quiet, authoritative environment that rejects the "noisy" density of traditional SaaS platforms. Instead of competing for attention, the UI recedes, providing a precise, high-end canvas for creation and technical monitoring.

The system breaks the "template" look through **intentional asymmetry** and **mathematical precision**. We do not use standard border radii or playful shadows; every element is hard-edged (0px radius) and aligned to a strict 1px grid. It feels less like a website and more like a high-end specialized developer tool or a physical CAD interface.

**Key Principles:**
- **Quiet Precision:** Every line has a functional reason to exist.
- **Dimensionality via Geometry:** Depth is achieved through isometric 3D shapes rather than gradients or drop shadows.
- **The "Void" Philosophy:** Pure black (#000000) is not just a background; it is the space in which ideas are built. Pure white (#FFFFFF) is the light that defines them.

---

## 2. Colors: Pure Contrast & Tonal Hierarchy

The palette is strictly binary, using the high-contrast relationship between pure black and pure white. Functional status is the only exception.

### The Palette
- **Surface (Primary):** `surface` (#131313) - The base of the interface.
- **On-Surface:** `primary` (#FFFFFF) - All critical text and primary geometric strokes.
- **The "No-Line" Rule:** Prohibit the use of standard 1px borders for sectioning. Boundaries must be defined through background shifts using `surface_container_lowest` (#0E0E0E) for recessed areas and `surface_container_high` (#2A2A2A) for elevated panes.
- **Glass & Gradient:** For floating toolbars or overlays, use `surface` at 80% opacity with a `20px` backdrop blur. This allows the isometric grid to bleed through, maintaining spatial awareness.

### Accent & Status
- **Live State:** `tertiary_container` (#F95A56) - A soft, architectural red used exclusively for "Live" indicators.
- **Activity Pulse:** `tertiary` (#FFDAD7) at 20% opacity for subtle, rhythmic status animations.

---

## 3. Typography: The Editorial Grid

We use **Inter** as a geometric, high-precision typeface. The hierarchy is designed to feel like a technical manual—highly organized and legible at small scales.

- **Display (display-lg):** 3.5rem. Used for major structural titles. Tracking: -0.02em.
- **Headlines (headline-sm):** 1.5rem. Used for section headers. Bold weight (700) to contrast against the thin 1px UI lines.
- **Titles (title-sm):** 1rem. Medium weight (500). Used for component headings.
- **Labels (label-sm):** 0.6875rem. All-caps with +0.05em tracking. This is the "signature" style for technical metadata and isometric labels.

---

## 4. Elevation & Depth: Isometric Structuralism

Traditional shadows are replaced by **Tonal Layering** and **Isometric Lighting**.

- **The Layering Principle:** Depth is conveyed by "nesting" containers. 
    - *Background:* `surface_dim` (#131313)
    - *Nested Panel:* `surface_container_low` (#1B1B1B)
    - *Active Element:* `surface_bright` (#393939)
- **Isometric Lighting:** 3D cubes must use flat surface colors to denote light direction. 
    - *Top Face:* `primary` (#FFFFFF) 
    - *Left Face:* `secondary` (#C6C6C7)
    - *Right Face:* `outline` (#919191)
- **Ghost Borders:** If a container requires a border for accessibility, use `outline_variant` (#474747) at 20% opacity. Never use 100% opaque borders for non-interactive containers.

---

## 5. Components: Functional Primitives

All components follow the **0px Roundedness Scale**. 

### Buttons
- **Primary:** `primary` (#FFFFFF) background with `on_primary` (#1A1C1C) text. 1px solid stroke.
- **Secondary:** Transparent background with a 1px `primary` stroke. 
- **States:** Hovering a button should invert its color scheme instantly (no-duration transition) to mimic technical feedback.

### Isometric Cubes
- The core visual primitive. Use 1px `primary` lines for the wireframe. 
- **Interactive State:** When a cube is "Live," the top face pulses with `tertiary_container` (#F95A56).

### Input Fields
- **Default:** A single 1px line at the bottom (`outline`). No box.
- **Focus:** The line transitions to `primary` (#FFFFFF) and a subtle 1px "caret" appears at the edge of the input area.

### Cards & Lists
- **No Dividers:** Prohibit 1px horizontal lines between list items. Use `2.5rem` (10) spacing or a `surface_container_low` background shift to denote separation.
- **Asymmetric Grid:** Align list text to the far left, and metadata (Labels) to the far right to maximize white space.

---

## 6. Do's and Don'ts

### Do:
- **Use Vertical Space:** Utilize the `spacing.24` (6rem) scale to let the architectural elements breathe.
- **Align to 1px:** Ensure every stroke sits exactly on a pixel to maintain the "precise tool" aesthetic.
- **Monochrome-First:** Design the entire experience in Black and White before adding the single "Live" accent color.

### Don't:
- **No Rounded Corners:** Never use anything other than `0px`. Roundness breaks the architectural "Build" metaphor.
- **No Gamification:** Avoid playful micro-interactions, "bounce" easing, or congratulatory messages. The UI should be stoic.
- **No Grays for Text:** Text must be either pure `primary` (white) for headers or `on_surface_variant` (#C6C6C6) for secondary metadata. Middle-range grays create visual mud.