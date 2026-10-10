# Visual asset provenance

The supplied [Import Rescue design reference](https://claude.ai/artifact/CK2SMZybvsZ88j4zwifunW) was read in the signed-in browser, including its Overview, palette, typography, spacing, radii, and component examples. Its explicit design decisions take precedence over the general anti-slop defaults: Instrument Sans / IBM Plex Mono, paper #F5F4EF, forest #0D5446, the four named statuses, and precise bordered ledger surfaces.

The app icon is a code-native bracket and check mark. Interface glyphs follow the reference's 1.5px stroke treatment and are rendered as bare SVGs. They are not images of controls. The row map is a real visualization of the current source records; each square opens the corresponding receipt.

`public/assets/ledger-still-life.png` was generated with the built-in imagegen tool for the upload dialog. It is decorative, not evidence of data or actual financial records.

Final prompt:

> Use case: stylized-concept. Asset type: a small editorial illustration for the upload dialog of Import Rescue, a precise, quiet data-import repair tool. Primary request: an art-directed close-up still life of two slightly offset rectangular ledger sheets, with a few tiny rows of numeric data, one graphite metal binder clip, a translucent pale ledger-green ruler, and a dark forest-green rubber stamp resting nearby. The physical paper has subtle fibers, realistic restrained dimensionality, orthographic isometric viewpoint, soft directional daylight. Palette: off-white #F5F4EF, ink #1B1D1A, ledger green #0D5446, sage #D9E9E3. Plain off-white background matching #F5F4EF. Objects composed compactly in the center with generous negative space. No legible words, no logos, no buttons, no interface, no gradients or glow, no cartoon face. Wide 3:2 composition. This is a supporting illustration, calm and tactile, not a large marketing hero.

Instrument Sans and IBM Plex Mono are self-hosted through their Fontsource packages. See package licenses. No runtime Google Fonts requests are needed.
