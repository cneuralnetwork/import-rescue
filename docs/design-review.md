# Design-law review

Reviewed 11 October 2026 against every named point in the user-supplied law. The supplied [Claude design-system reference](https://claude.ai/artifact/CK2SMZybvsZ88j4zwifunW) takes precedence where it explicitly specifies paper colors, typography, table borders, semantic status colors, and compact components. This is a functioning data workbench, not a landing page. Optional premium techniques are evaluated for fit, not accumulated.

Changes from this review: contained narrow-screen table overflow; improved mobile type/touch sizes; added keyboard tab navigation/current-page semantics; aligned receipt comparisons; preserved visible-by-default content; checked light/dark outcomes and real interactions. Browser evidence and exact demo totals are in the build log.

| Design-law point | Review and disposition |
| --- | --- |
| Lucide React package | Not installed. Bare ledger/action SVG marks are local; the bracket-and-check brand mark is specific to this app. |
| Em dashes | No em dashes in authored interface copy; source CSV values are preserved verbatim. |
| Pill / eyebrow badge | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Fonts: Fraunces and Work Sans | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| Glowy pill buttons | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Oversized icon in a colored tile | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Floating cards | Not used. No floating or hover-lift motion; only tonal feedback and an operation indicator, with reduced-motion support. |
| Cut-off glow | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| The kitchen-sink card | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Fake macOS / app window mockup | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Font: Space Grotesk | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| Purple, and blue-to-purple gradients | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Gradient pill with icon and text | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| The default CTA button pair | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The three-tier pricing block | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The testimonial / quote card | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Gradient-circle initials avatar | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| The pre-footer CTA banner | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The logo lockup (gradient icon tile + wordmark) | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Font: Cormorant Garamond | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| The split hero | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Grid / graph-paper background | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Crude CSS/SVG "illustrations" | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The accent-bar card | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Background glow | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| The fake code-snippet window | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Fonts: Sora and JetBrains Mono | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| Floating tag pinned to an image | Not used. No floating or hover-lift motion; only tonal feedback and an operation indicator, with reduced-motion support. |
| Font: Syne | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| Gradient-filled headline text | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Fonts: Archivo, and Inter everywhere | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| Hairline light border on boxes | Reference exception: exact paper, raised, sunken, and line tokens are used for data surfaces. No glowing outlines. |
| Countdown timer | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The card hover-lift | Not used. No floating or hover-lift motion; only tonal feedback and an operation indicator, with reduced-motion support. |
| Letterspaced serif wordmark | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Fonts: high-contrast Didone serifs (Bodoni, Didot) | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| Monospace as the house voice | Mono is confined to source fields, IDs, row counts, money, rule codes, timestamps, and original JSON. Interface prose uses Instrument Sans. |
| One label treatment, everywhere | Navigation uses sentence case; labels, headings, data, and metadata have different sizes and weights. No tracked uppercase house style. |
| Botched glass | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| The faint grid background (restated, because it keeps happening) | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Botched fill animations | Not used. No floating or hover-lift motion; only tonal feedback and an operation indicator, with reduced-motion support. |
| Never hide content behind an entrance animation (the invisible-content trap) | No opacity-zero entrance states. All text and controls are visible without an animation completing. |
| Content sliced by an edge - the cut-off tell (and "clear the cut") | Fixed mobile overflow from the screen-reader table header; table overflow is contained locally. Drawers and dialogs scroll. No decorative notch crops text. |
| Misaligned parallel columns - the ragged comparison grid | Metrics share grid rows. Source/destination receipt cells share a CSS grid, and money columns align right. |
| Text jammed against the edge | Desktop gutters are 36/48px; compact layouts retain 18px content and 20px drawer gutters. Dialog close buttons have a separate reserved area. |
| The default all-around shadow | No shadows on cards/buttons. Only the upload modal uses one low-opacity directional shadow for overlay separation. |
| Content flung to the far edges (default asymmetry) | The main workspace is bounded to 1660px with one aligned workbench and receipt column, collapsing to one column on narrow screens. |
| Missing (or faked) logos and icons that would earn their place | No fabricated customers or partner logos. Integrations are named with honest configuration states. No claims of endorsement. |
| Nothing is actually centered - the chronic centering miss | Icons use grid/flex centering. Numeric table columns are intentionally right-aligned. Screenshot review checked buttons, glyphs, and receipt cells. |
| Faking a shadow with a second box | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| An icon or a logo with a box behind it | Bare brand and action marks; no tinted integration-logo tiles. |
| The little rule beside a label (the eyebrow tick) | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The oversized footer wordmark done as slop | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Colliding colours, and hard colour seams between sections | One reference token system throughout; green=repair, amber=decision, rust=quarantine, blue=reconciliation. No background gradients. |
| Botched shadow - the hard-edged box behind it | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Text you cannot read - colour with no contrast | Reference dark/light foreground pairs checked visually. Small mobile interface labels increased to 11–13px. Disabled controls remain visibly disabled. |
| The bloom that is just the element's shape, blurred | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The dot under the active nav item | Active navigation uses weight, text color, and a quiet selected surface. No dot or animated underline. |
| Content clipped where two sections overlap | Only standard modal/drawer overlays cross layers. Each contains its own scrolling content; no live text crosses a clipped section seam. |
| Cramped display type - no air to breathe | Separated count metrics, tabular data, clear operator spacing in the equation. Mobile count tracking reset to zero. |
| Grain sitting on top of the content | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| The cool blue-charcoal (dark slop's default palette) | Dark mode uses the reference green-black #121412 with #1B1E1B raised surface, not indigo slate. |
| The pastel candy gradient background | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Drifting soft-blend gradient blobs (the candy aurora) | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Radial glow halo behind an object | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| A hero that does not own the first screen | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The cream / beige "editorial" background | Reference exception: the user explicitly supplied #F5F4EF paper, #EBE9E2 sunken, and #D6D3C8 line tokens. |
| The slop gray (the default UI-kit neutral) | No default gray-100 surface. Surface values come from the supplied reference. |
| Default Google fonts, the whole rotation | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| The hover boop (a button that jumps) | Not used. No floating or hover-lift motion; only tonal feedback and an operation indicator, with reduced-motion support. |
| The inner-glow box (a badge that lights up from inside) | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| The off-center strike or cut line | Native del decoration on actual before-values only, visually checked next to the transformed cents. |
| The default hero stack | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The fixed background that just follows the scroll | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Hard image seams | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Saturated accent color | Reference exception: status colors are semantically prescribed. They communicate outcomes, rather than decorative headline emphasis. |
| Underline-fill hover animations | Not used. No floating or hover-lift motion; only tonal feedback and an operation indicator, with reduced-motion support. |
| The sun-and-moon theme toggle, and redrawn line icons | Theme control is a labeled text action with a split-paper swatch. Bare action glyphs follow the compact ledger reference; no sun/moon pill. |
| Unrounded hairline rules, lines used as decoration | Reference table rules divide actual records and provenance fields. No ornamental eyebrow ticks or process rails. |
| The kicker-plus-serif-H2 section head | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The big serif statement block | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The inset enquire island with a form | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The email-pill plus button form | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The image card with overlay caption | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| A flat fill under everything after the hero | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Recycling your own house style | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The hero stack with a panel on the right | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The multi-line headline (and the dangling accent word) | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The filled-button-next-to-outlined-button pair | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The small-label-over-big-heading section head | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Numbered steps beside a vertical line | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Stacking slop layouts (the compounding rule) | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The whole SaaS product-page template (the meta-skeleton) | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Labels and metadata as tinted pill chips, everywhere | Only the four prescribed status tags use semantic tinted surfaces; filenames, timestamps, destinations, and IDs are ordinary text. |
| Dead controls and fake interactivity | Real browser checks covered upload, fixture buttons, mapping approval, duplicate decisions, commit, filters/search, pagination, receipts, tabs, schema/staging navigation, and theme. Export payloads validated over HTTP. |
| Even the "tasteful" font swap | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| The same skeleton, recolored | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| The standard footer | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| No icons at all | Bare functional marks present for import, schema, staging, upload/download, receipts, and row navigation. |
| Avoiding the list is not design | Signature is the interactive source-row ledger: each square opens a real receipt; each changed value retains its original, rule, and approval. It is the actual product. |
| Real translucency (liquid glass) | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Self-colored borders and tonal elevation | Reference paper/raised/sunken surfaces provide depth without card lift or glow. |
| Bespoke geometry beats default shapes | Bracket-and-check mark and the source-row ledger provide the product signature. No novelty silhouette is added to data fields. |
| Bare icons, no container | Used on navigation, receipts, and actions. No decorative icon tiles. |
| Say less | Short action copy; longer explanations live in receipts, decisions, or documentation where they answer a concrete question. |
| Custom, in-house iconography | Local mark and a small consistent functional glyph set. No Lucide import or fake third-party brand marks. |
| Authored micro-interactions | Tonal 120ms states, row-map focus/selection, and operation progress. No hover translation, scale, or underline animation. |
| Considered light, not the default glow | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Premium noise | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Liquid-glass button: a concrete recipe | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Premium type usually means licensed type | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| Full-page, large-scale composition | A workbench occupies the viewport with the import, outcome ledger, data, and receipt. No marketing hero inserted before the tool. |
| Real logo walls (earned social proof) | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Blueprint / canvas backgrounds | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Inset "island" sections | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Good: crafted custom SVG renders | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Good: the gloss is the good part of glass | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Professional does not mean lifeless | The row map and receipt drilldown respond to real processing and operator decisions. Motion is restrained for a data-review task. |
| The good grid: a fine textured micro-grid | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Grainy gradients, never banded ones | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Scroll-authored motion | Not used. No floating or hover-lift motion; only tonal feedback and an operation indicator, with reduced-motion support. |
| The oversized footer wordmark, placed right | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| 1. One signature artifact | Interactive row-accounting ledger with per-value receipts. |
| 2. Atmosphere, not a flat fill | Reference exception for the operational workbench: restrained paper surfaces; one generated ledger still-life is confined to upload. |
| 3. Layered depth on the z-axis | Receipt drawer and upload dialog layer over the live data. No fake desktop chrome. |
| 4. The product as a real, populated artifact | Actual server/SQLite data populate every metric, table, event, decision, and receipt. Synthetic fixtures are labeled. |
| 5. Character in the display type | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| 6. One bespoke silhouette | Bare bracket-check mark echoes a validated cell; compact data geometry follows the supplied system. |
| 7. The nav is treated, not defaulted | Persistent ledger sidebar with actual recent imports and a narrow icon navigation at small widths. |
| 8. Real specificity | Exact supplier CSV headers, source hashes, rule IDs, record numbers, amounts, and timestamps. All demonstration supplier records are explicitly synthetic. |
| The formula | Adapted to the actual product and supplied reference: row ledger, paper materials, receipt layers, cohesive typography, functional navigation, and exact data. |
| The signature serif headline | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| Two-tone / accent headline | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Full-bleed atmospheric hero | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Animated character-field background | Not used. This is a working import workbench, not a marketing section or decorative mockup. |
| Gradient-filled icons (a jewel inside the mark) | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| The arrow is a tell, so sweat it | Arrows in data flows mean source-to-destination; row actions open a receipt. No decorative CTA arrow used as a hero gimmick. |
| One cohesive visual language ("synchronized edition") | Same reference palette, 2/4/8px radii, compact marks, short labels, and restrained state changes across screens. |
| The premium glass CTA, when it earns it | Not used. The supplied ledger reference uses quiet solid surfaces and no atmospheric effects. |
| Use real component libraries, do not hand-roll generic UI | Radix Dialog handles modal semantics and focus. Native input/select/button elements retain platform behavior. Tabs include arrow/Home/End keyboard navigation. |
| Cohesion is the whole game | All screens derive from one ledger system, including the upload still-life. No unrelated landing-page blocks. |
| "Creative" is not "realistic" | The brief is an operational import tool. Generated still-life supports that material vocabulary; it is not a stock hero substituting for product work. |
| Type without the Google slop shelf | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| The product-as-artifact is a signature, not the slop window | The ledger is functioning product UI, with real provenance and database reads. No faux macOS window. |
| Take the design LANGUAGE from references, never the content | Used supplied design tokens/components and wrote product-specific copy and behavior. No unrelated reference marketing copy reused. |
| "Distinctive font" keeps moving: even the nice free grotesques read generic | Reference exception: use the exact self-hosted Instrument Sans interface and IBM Plex Mono data families requested in the supplied design system. No additional display family. |
| Dead-looking is a fail on its own | Real row-state changes, decisions, receipts, and busy feedback animate the work through user action. Reduced-motion disables decorative progress animation. |
