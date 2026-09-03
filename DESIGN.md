---
name: ROLLFORWARD
description: An endurance-racing telemetry wall fused with an aircraft black-box recorder for observable optimistic state.
colors:
  void: "#050607"
  void-soft: "#090b0f"
  asphalt: "#0e1117"
  carbon: "#151922"
  magnesium: "#f4f6fb"
  sheet: "#e3e6ec"
  sheet-deep: "#cfd4dd"
  ink: "#11141a"
  steel: "#9aa3b4"
  steel-dark: "#586170"
  cobalt: "#3157dc"
  cobalt-light: "#8da2ff"
  amber: "#ff9f57"
  red: "#ff6259"
  line-dark: "rgba(231, 235, 245, 0.16)"
  line-light: "rgba(17, 20, 26, 0.18)"
typography:
  display:
    fontFamily: "Outfit Variable, Segoe UI, sans-serif"
    fontSize: "clamp(3.25rem, 6.6vw, 6rem)"
    fontWeight: 460
    lineHeight: 0.84
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Outfit Variable, Segoe UI, sans-serif"
    fontSize: "clamp(3rem, 6vw, 6rem)"
    fontWeight: 460
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Outfit Variable, Segoe UI, sans-serif"
    fontSize: "clamp(1.45rem, 2.4vw, 2.6rem)"
    fontWeight: 470
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Outfit Variable, Segoe UI, sans-serif"
    fontSize: "clamp(1rem, 1.3vw, 1.2rem)"
    lineHeight: 1.6
  control-label:
    fontFamily: "Outfit Variable, Segoe UI, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 560
    letterSpacing: "0.08em"
  data-label:
    fontFamily: "ui-monospace, Cascadia Mono, SFMono-Regular, Consolas, monospace"
    fontSize: "0.58rem"
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  hard: "0"
  operational-card: "14px"
  pill: "999px"
  circle: "50%"
spacing:
  tight: "8px"
  control: "10px"
  cluster: "18px"
  content: "24px"
  panel: "42px"
  mobile-gutter: "18px"
  page-gutter: "clamp(24px, 5vw, 84px)"
  section-y: "clamp(130px, 15vw, 220px)"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.magnesium}"
    typography: "{typography.control-label}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "50px"
  button-primary-hover:
    backgroundColor: "{colors.magnesium}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.magnesium}"
    typography: "{typography.control-label}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "50px"
  flight-panel:
    backgroundColor: "{colors.asphalt}"
    textColor: "{colors.magnesium}"
    rounded: "{rounded.hard}"
    padding: "clamp(28px, 4vw, 58px)"
  evidence-primary:
    backgroundColor: "{colors.magnesium}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hard}"
    padding: "clamp(24px, 3vw, 48px)"
---

# Design System: ROLLFORWARD

## Overview

**Creative North Star: "The Telemetry Black Box"**

ROLLFORWARD makes the split between immediate operator intent and eventual server truth physically legible. Its world combines the disciplined telemetry wall of endurance racing with the sequential evidence of an aircraft black-box recorder: asphalt-dark operational spaces, magnesium evidence sheets, machined hairlines, cobalt projection lanes, and amber fault states.

The product story moves from witness to proof to operation. An editorial split hero states the thesis beside a live dual-reality model; a structured evidence field explains the invariants; a flight recorder exposes the failure sequence; the command deck lets a reviewer reproduce it. The cinematic automotive reference informs pace, contrast, and material character, but no branding or composition is copied.

**Key Characteristics:**

- Editorial scale paired with instrument-grade detail.
- Hard-edged story surfaces; rounded geometry is reserved for controls, operational cards, and state lamps.
- Alternating dark cockpit and light evidence fields, punctuated by full cobalt evidence blocks.
- Every technical claim connects to observable UI state, source, or tests.
- Measurement grids appear only where telemetry or comparison gives them meaning.

**Implementation map:**

- `src/styles.css` — normative color variables, global type, layout, component states, responsive rules, and reduced-motion CSS.
- `src/App.tsx` — GSAP entrance, scroll-fade, proof reveal, and desktop flight-recorder choreography.
- `src/components/TruthTunnel.tsx` — Three.js dual-reality model and its nonvisual equivalent.
- `src/components/Hero.tsx` — editorial thesis and deterministic failure action.
- `src/components/ProofGrid.tsx` — 4×2 evidence matrix, guarantee marquee, recorder, failure accordion, and reviewer carousel.
- `src/components/CommandDeck.tsx` and `src/components/MutationLedger.tsx` — operational controls, state cards, error/loading states, and event evidence.
- `src/main.tsx` — self-hosted Outfit Variable import.

The durable direction contract is the first body comment in `index.html` (Impeccable seed `682616a0`). Implementation refinements retain the separate GPT Taste seed `236` constraints captured by the shipped carousel, marquee, horizontal accordion, scroll pinning, and tunnel scale/fade behavior.

**The Evidence-First Rule.** Interface language may describe only behavior the running system, repository, or tests demonstrate. Never invent latency, adoption, performance, or production claims.

## Colors

The palette moves between cold near-black machinery and pale evidence paper; cobalt identifies projected action, while amber and red are reserved for risk and recovery.

### Primary

- **Electric Cobalt (`cobalt`)** — primary actions, selected network profiles, projected state, evidence panels, footer, and themed scrollbars.
- **Projection Light (`cobalt-light`)** — active intent, projected nodes, thin progress, and luminous state lamps. Use it as a signal, not a large background.

### Secondary

- **Safety Amber (`amber`)** — focus rings, offline or recovery state, the fracture panel, and conflict disclosure.
- **Fault Red (`red`)** — high-risk release markers and destructive/error semantics only.

### Neutral

- **Asphalt Void (`void`)** — canonical page and command-deck background.
- **Soft Void (`void-soft`)** and **Carbon (`carbon`)** — reserved dark steps defined in the source palette; promote them only when a repeated tonal layer needs separation.
- **Asphalt (`asphalt`)** — recorder and equipment panels.
- **Magnesium (`magnesium`)** — high-contrast text, controls, and clean evidence surfaces.
- **Evidence Sheet (`sheet`)** — long-form light sections.
- **Deep Sheet (`sheet-deep`)** — reserved light tonal step.
- **Black Ink (`ink`)** — type and dark evidence surfaces on light sections.
- **Steel (`steel`)** and **Dark Steel (`steel-dark`)** — canonical markers and secondary copy on dark and light fields respectively.
- **Dark Hairline (`line-dark`)** and **Light Hairline (`line-light`)** — structural dividers on their corresponding backgrounds.

Local literals such as the recorder's darker panel step, the release-card surface, and the red error banner remain component-scoped. Do not promote a one-off tonal variant into the global palette until it is reused.

**The Semantic Cobalt Rule.** Cobalt means projection, selection, or evidence. It is not ambient decoration.

**The Fault Escalation Rule.** Amber means attention, offline, conflict, or recovery; red means high risk or actionable error. Never swap them for variety.

## Typography

**Primary Font:** Outfit Variable, self-hosted through `@fontsource-variable/outfit`, with Segoe UI and sans-serif fallbacks.

**Data Font:** the system monospace stack defined by `--mono`; use it only for versions, status, event time, code, measurements, counters, and instrumentation labels.

**Character:** Outfit supplies compact editorial authority without becoming a display costume. Variable weights in the narrow 350–570 range keep headings precise and copy human; monospace creates a second voice only where exact values require it.

### Hierarchy

- **Hero display** — three authored lines, uppercase, weight 460, tight `-0.04em` tracking, and 0.84 line-height. The outlined middle line shifts laterally to visualize divergence. Desktop uses the frontmatter display scale; mobile uses `clamp(3rem, 16vw, 5rem)` at 0.87 line-height.
- **Section headline** — weight 460 and `clamp(3rem, 6vw, 6rem)` at 0.92 line-height. Mobile resolves to `clamp(2.8rem, 14vw, 4.5rem)`. Keep headings balanced and normally two or three lines.
- **Feature title** — weights 470–480 and roughly `clamp(1.45rem, 2.4vw, 2.6rem)` with `-0.025em` to `-0.03em` tracking.
- **Body / lede** — `1rem` to `1.2rem`, 1.6–1.65 line-height, and a maximum measure of 56–60ch for editorial copy; dense event copy may reduce to `0.71rem`–`0.88rem` when contrast remains strong.
- **Data label** — `0.54rem`–`0.78rem`, generally uppercase, tracked `0.04em`–`0.11em`, and set in monospace. Operational secondary text stays within the implemented 0.58–0.68 white-alpha range on dark surfaces; important panel descriptions use the upper end of that range.

**The Two-Voice Rule.** Outfit speaks to people; monospace reports machine state. Never set marketing headings or ordinary prose in monospace.

**The Tight-Display Rule.** Display tracking may reach `-0.04em`, never tighter. Do not use gradient text, fake condensed system faces, or a generic kicker above a heading.

## Layout

The desktop shell is fluid with a `1540px` maximum content width and page gutters of `clamp(24px, 5vw, 84px)`. Major sections use tall, cinematic vertical spacing; smaller spaces should come from the extracted 8/10/18/24/42px rhythm. Alignment favors 7/5 editorial splits: the hero, section introductions, failure heading, and command heading all place a dominant statement against supporting evidence.

- **Hero:** full viewport height; 7fr copy / 5fr live model with the headline held to three lines.
- **Evidence matrix:** an exact, gapless 4×2 footprint with 1px seams. The primary invariant occupies 4 cells, two compact proofs occupy 1 cell each, and causal ordering occupies 2 cells: `4 + 1 + 1 + 2 = 8`. Do not add a ninth cell or loosen the seams.
- **Flight recorder:** 3.2fr heading / 8.8fr panel window; panels are up to 920px wide and 670px tall.
- **Command deck:** 1.72fr releases / 0.88fr ledger inside one bordered cockpit, not two floating dashboards.
- **Footer:** 8fr statement / 4fr action field over a large low-contrast wordmark.

### Responsive behavior

- **At 1180px and below:** tighten the hero and command columns; the chaos toolbar becomes two rows with profile controls spanning the second row.
- **At 959px and below:** hide center navigation, stack the hero, change the proof footprint to 2 columns × 4 rows, turn the recorder into native horizontal scroll with snap, stack command deck over ledger, and collapse the footer to one column. GSAP scroll pinning does not run below 960px.
- **At 680px and below:** use 18px gutters; shorten “Inspect source” to “Source”; make hero actions and command controls full width; hide the tunnel release list but preserve state readouts; linearize the proof grid; stack the failure accordion vertically; and stack toolbar, panels, footer metadata, and error recovery without horizontal overflow.

### Motion and sequencing

Motion explains state and chronology; it is not evenly sprinkled decoration.

- Hero lines rise from their clipping rows (`yPercent: 112`, 1.25s, 0.1s stagger, `expo.out`); supporting copy follows from 28px below over 0.9s with `power3.out`.
- The live tunnel reveals through clip-path and scale (0.86 to rest, 1.55s, `expo.inOut`), then scales to 0.91 and fades to 0.2 as the hero leaves.
- Proof cells reveal once with vertical travel and `power3.out` as they enter the viewport.
- At 960px and above, the recorder pins, translates by its measured overflow with a 0.8 scrub, and scales/fades each panel from 0.86/0.28 to full presence. Smaller screens use direct touch/keyboard scrolling instead.
- The guarantee marquee travels linearly over 32s. State transitions use 180–220ms; progress uses 400ms with `cubic-bezier(0.16, 1, 0.3, 1)`; the failure accordion uses the same ease over 650ms.
- Progress bars animate `scaleX()` from a left transform origin. Never animate width for live state.

**The One Authored Sequence Rule.** Preserve the hero reveal and flight-recorder narrative as the dominant motion moments; new sections should not repeat the same entrance pattern by habit.

## Elevation & Depth

This is a flat-by-default system. Depth comes from tonal layering, 1px structural rules, clipped fields, vignettes, WebGL fog, and selective perspective. Broad shadow is confined to the hero model (`-52px 0 110px rgba(0, 0, 0, 0.34)`) and the distant cobalt orb (`0 0 120px rgba(65, 105, 255, 0.12)`). Small cobalt glows belong only to active nodes, progress, and state lamps.

Backdrop blur is functional: the fixed navigation and chaos toolbar need separation from moving material underneath. It is not a reusable glass-card effect. Evidence cards, recorder panels, and cockpit panes remain flat, with border or tonal contrast rather than generic drop shadows.

**The Instrument-Light Rule.** A glow must identify active or projected state. Never place zero-offset colored halos around passive decoration.

**The Flat Evidence Rule.** Evidence sits on hard, printable planes. Use seams and tonal blocks, not soft floating cards.

## Shapes

The core form language is machined and rectilinear. Story panels, evidence cells, recorder frames, alert banners, navigation fields, and the command shell have square corners. The 14px radius belongs specifically to interactive release cards, where it separates repeatable operational objects from the surrounding chassis.

Pills are reserved for compact actions, filters, status chips, and toggle choices; circles are reserved for icon buttons, status lamps, and the branch mark. Structural borders are 1px. Thin rails, short progress lines, and compact lamps should feel instrument-built, not ornamental.

**The Reserved-Radius Rule.** Do not round large content sections. Use 14px only for operational cards and 999px/50% only for controls or indicators.

## Components

### Navigation

- Fixed, centered, and capped at 1540px; 74px tall on desktop and 66px on mobile.
- A three-column desktop composition keeps brand, section links, and source action balanced. Under 960px, retain only brand and source.
- Links reveal a current-color underline on hover with a 6px offset; no filled nav pills.

### Buttons and controls

- Primary and secondary hero actions are 50px tall pills with 22px horizontal padding and an 11px icon gap. Primary reverses from cobalt to magnesium/ink on hover; secondary remains transparent and strengthens its hairline.
- Buttons lift by 2px on hover, except disabled actions. Disabled failure-path actions use a wait cursor and 0.52 opacity.
- Command controls are at least 44px tall. Selected connection controls become magnesium/ink; selected profiles become cobalt/magnesium.
- Icon-only controls are 44–46px circles with accessible names. Text-only ledger actions reveal an underline on hover.

### Evidence matrix

- Preserve the exact 8-cell occupancy and 1px seams described in Layout.
- The primary 4-cell proof holds title, diagram, and explanatory copy. Compact 1-cell proofs use one icon and one high-signal metric. The 2-cell ordering proof is a dark telemetry surface because its lanes are actual measurements.
- The matrix is not a reusable card gallery; it is a single evidence instrument.

### Flight recorder

- Four hard-edged panels represent intent, dispatch, fracture, and reconciliation in that order.
- Panels one and two are dark, panel three is safety amber, and panel four is cobalt. Code/evidence stays on a bottom hairline.
- Desktop interaction is scroll-pinned GSAP choreography; tablet/mobile interaction is focusable, scrollable, and snap-aligned.

### Failure accordion and reviewer carousel

- Each failure slice is keyboard-focusable. Hover or focus expands it from flex 1 to 2.25 and applies its semantic surface: ink, cobalt, amber, then ink.
- On mobile the accordion becomes a vertical list; focus/hover expands height from 250px to 330px.
- The cobalt reviewer block changes only through explicit previous/next controls. It is evidence navigation, not an autoplaying testimonial carousel.

### Command deck

- One shared bordered shell contains release state and mutation history. The release list owns the wider column; the ledger is divided by one hairline.
- Release cards expose default, projected/pending, disabled-complete, moderate-risk, and high-risk states. Loading uses the existing skeleton; load failure uses the red alert with a named retry action.
- Pending release cards tint toward cobalt, change the sync chip to “projected,” and carry the primary action in cobalt. The progress visual is paired with a semantic progressbar.
- The ledger limits the visible chronology to nine events, uses distinct server/recovery markers, and offers explicit export and clearing actions.

### Three.js truth tunnel

The tunnel is a live state visualization, not a decorative animation. The left steel rail is canonical state and the right cobalt rail is projected state. Each release has paired nodes positioned along stage gates; node depth also incorporates progress. Divergence brightens the link and projected halo; active mutations raise emissive intensity and pulse; transport state, active intent count, precondition version, and current release stages are rendered as readable HTML overlays.

The camera uses a 38° perspective, subtle pointer parallax, bounded pixel ratio (1.7), ACES filmic tone mapping, exponential fog, additive gates/rails, and deterministic particles. If WebGL fails, the canvas receives a static fallback surface. The canvas is hidden from assistive technology and paired with a screen-reader figcaption; live state remains available in HTML.

### Accessibility and browser surfaces

- Every keyboard focus target uses a 2px amber focus ring with 4px offset; inset-expanding accordion focus uses a -2px offset.
- Preserve 44px minimum interactive targets, visible disabled/error/loading states, `aria-pressed` toggles, named regions, `aria-live` state, progress semantics, and labels on icon-only buttons.
- Keep decorative Lucide icons and the WebGL canvas `aria-hidden`; preserve the textual tunnel summary and readouts.
- Theme selection, scrollbars, link underline offset, tabular numerals/data labels, and focus rings from the palette.
- Keep body copy at WCAG AA contrast. Small informational command-deck text uses the raised 0.58–0.68 white-alpha range; do not dim it further. Dormant controls may sit at 0.5 only when hover and selection restore strong contrast.
- Reduced motion is a hard contract: skip all GSAP setup; disable smooth scroll; reduce CSS animation/transition duration to 0.01ms; stop and deduplicate the marquee; make Three.js nodes snap to state; and disable particle travel, pointer parallax, world drift, and halo pulsing.

## Do's and Don'ts

### Do

- **Do** preserve the witness → proof → failure sequence → operation → source story.
- **Do** use cobalt only for projection, selection, primary action, and evidence.
- **Do** keep the hero to two or three visually authored lines and section headings balanced.
- **Do** reserve telemetry grids for genuine state, ordering, or measurement surfaces.
- **Do** expose hover, focus, selected, disabled, loading, error, offline, pending, conflict, and recovery states.
- **Do** keep claims qualitative unless a measurement is produced by the actual system.
- **Do** verify desktop at 1440×900 and mobile at 390×844 with no horizontal overflow and zero automated Axe violations.

### Don't

- **Don't** regress to a generic SaaS hero followed by a dashboard-card grid.
- **Don't** add kicker labels, gradient text, decorative glass, fake telemetry, or monospace as a technical costume.
- **Don't** turn the exact proof matrix into a general tiled page scaffold or add cards beyond its 8-cell contract.
- **Don't** use cobalt and amber as interchangeable accents, or use red for anything noncritical.
- **Don't** animate layout width; use transforms for progress and spatial state.
- **Don't** make evidence carousels autoplay, hide failure states behind modals, or replace descriptive recovery copy with generic errors.
- **Don't** add motion without a static reduced-motion equivalent.

### Contributor checklist

- [ ] Uses only the documented palette roles and Outfit/mono type roles.
- [ ] Preserves 1540px containers, responsive breakpoints, and 18px mobile gutters.
- [ ] Keeps the proof matrix at 4+1+1+2 occupancy and recorder order at four phases.
- [ ] Implements keyboard, focus, loading, disabled, error, and reduced-motion states.
- [ ] Tests 1440×900 and 390×844 for contrast, overflow, and Axe regressions.
- [ ] Links every new engineering claim to observable product or repository evidence.
