# literate-waffle

Resonance Compass Explorer is a single-page application built with Vite, React, TypeScript, and Tailwind CSS. It visualises 60×60 resonance heatmaps for digit sequences and overlays zero flags on twin compasses.

## Getting Started

```bash
npm install
npm run dev
npm run build
```

The application expects CSV datasets in `public/data/`. Placeholder files are provided so the UI boots without custom data.

## Data Files

| File | Purpose |
| --- | --- |
| `public/data/heatmap_all_pairs_sum10zeros_long.csv` | Long-form zero flags for `sum10_zero` mode. |
| `public/data/heatmap_all_pairs_bithexzeros_long.csv` | Long-form zero flags for `bithex_zero` mode. |
| `public/data/energy_rotations.csv` | Aggregate zero counts per rotation for each pair/mode. |

## Features

- Select pair, mode, and rotation to explore overlays.
- Snap rotation to the highest zero density using energy summaries.
- Dual compass visualisation of paired digit sequences with highlighted zero positions.
- Export the current compass view as a PNG image.
- Netlify-ready configuration with SPA redirects and CI build checks.
