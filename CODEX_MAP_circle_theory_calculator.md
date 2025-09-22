
# Circle Theory Calculator — Insight Explorer (v2)
**Codex Runbook** — Build from scratch, end‑to‑end.

> Goal: A fast, zero-friction **Insight Explorer** for your 60‑point mandala work. It loads CSVs, renders heatmaps and prime density, and auto-surfaces strongest signals (anchors, bands, clusters).

---

## 0) Name, Stack, and Targets

- **Project name:** `circle-theory-calculator` (Insight Explorer v2)
- **Stack:** Vite + React + TypeScript + TailwindCSS + Shadcn UI + Recharts (or Canvas/D3)
- **Data ingest:** CSVs from `/public/data/*.csv` (see Schemas)
- **Build:** `vite` / `bun` (or `pnpm`/`npm`)
- **Deploy:** Netlify (SPA), include `_redirects`

---

## 1) Functional Overview

The app visualizes pairwise interactions and prime patterns across a 60×60 rotation–position grid (your mandala). It supports two XOR modes and prime density overlays, then surfaces insights:

- **Heatmaps**
  - **Sum‑mod‑10 zero** heatmap per pair × rotation (0–59) × position (1–60)
  - **Bitwise‑hex XOR zero** heatmap, same geometry
- **Prime density**
  - Windowed probable‑prime rates per position and per rotation (k ranges)
- **Insights**
  - Top rotations (zero bands), anchor positions, longest consecutive zero runs
  - Largest connected zero cluster (4‑neighbor) per map
  - Optional FFT peaks on mod‑9 drift / heatmap rows

---

## 2) Inputs & Schemas

All CSVs go in `public/data/`.

### 2.1 Heatmaps — long form (preferred)
- **File:** `heatmap_all_pairs_sum10zeros_long.csv`
- **Columns:**  
  `pair:string` (e.g., `Red60-Blue60`),  
  `mode:string` = `"sum10_zero"`,  
  `rotation:int` in `[0..59]`,  
  `position:int` in `[1..60]`,  
  `zero_flag:int` in `{0,1}`

- **File:** `heatmap_all_pairs_bithexzeros_long.csv`
- **Columns:** same as above but `mode = "bithex_zero"`.

> The app will **pivot** to wide matrices as needed.

### 2.2 Insight tables (optional, accelerates UI)
- **File:** `energy_summary.csv`
- **Columns:** `pair, mode, total_zeros, avg_zeros_per_rotation, max_zeros_single_rotation, avg_zeros_per_position, max_zeros_single_position, max_consecutive_zeros_any_rotation, largest_connected_zero_cluster`

- **File:** `energy_rotations.csv`
- **Columns:** `pair, mode, rotation, zeros_per_rotation`

- **File:** `energy_positions.csv`
- **Columns:** `pair, mode, position, zeros_per_position`

- **File:** `energy_runs.csv`
- **Columns:** `pair, mode, rotation, max_consecutive_zeros`

### 2.3 Prime windows (for density overlays)
- **File:** `rolling_probable_primes.csv`
- **Columns:** `sequence:string` ∈ {`Red60`,`Black60`,`Blue60`,`Lukus60`},  
  `window_size:int` (k), `start_index_1b:int`, `slice:string`, `is_probable_prime:int{0,1}`

> The app aggregates prime **density by position** and **by rotation** live.

---

## 3) UI / UX spec

### 3.1 Main Layout
- **Header:** Pair selector (`Red60-Blue60`, `Red60-Black60`, …), Mode selector (`sum‑10` / `bit‑hex`), k‑range input for prime overlay.
- **Left Panel:** **Heatmap** (60×60), scroll‑zoom, hover tooltip.
  - Tooltip: `rotation, position, zero_flag, prime_density_at_position, max_run_here (if applicable)`
- **Right Panel (Insights):**
  - **Top 5 rotations** (zeros per rotation)
  - **Top 10 positions** (zeros per position)
  - **Longest streaks** (max consecutive zeros per rotation)
  - **Largest cluster size**
  - Buttons: “Export PNG”, “Copy Insight Snippet”
- **Footer:** Data source badge + timestamp

### 3.2 Controls
- Pair dropdown, Mode toggle (sum‑10 / bit‑hex), Rotation slider (spotlight a row), Prime overlay on/off + k range (`3..20`, `3..30`).
- Checkboxes: “Show clusters”, “Show runs”, “Show anchor pins”.

---

## 4) Component Map

```
src/
  App.tsx                        // app shell, routes (single page)
  components/
    HeatmapCanvas.tsx            // fast canvas rendering of 60x60 grid
    Controls.tsx                 // pair/mode/k-range toggles, sliders
    InsightPanel.tsx             // lists: top rotations, positions, runs, cluster size
    Tooltip.tsx                  // hover info
  data/
    loaders.ts                   // CSV loaders (Papaparse/d3), normalizers, pivot helpers
    selectors.ts                 // memoized selectors for current view
  logic/
    aggregates.ts                // zeros/rotation, zeros/position, runs, clusters
    primeDensity.ts              // compute prime density by pos/rot
    fft.ts                       // optional: frequency peaks
  styles/
    index.css, tailwind base
```

**Contracts**
- `HeatmapCanvas` props: `{ matrix: number[][], highlightRotation?: number, anchors?: number[], clusters?: Cluster[], onHover?: (rot,pos)=>void }`
- `Controls` props: `{ pairs, modes, onChange }`
- `InsightPanel` props: `{ topRotations: Row[], topPositions: Row[], topRuns: Row[], clusterSize: number }`

---

## 5) Algorithms (core)

### 5.1 Pivot long → matrix
- Input: rows of `{rotation, position, zero_flag}`.
- Output: `matrix[rotation][position-1] ∈ {0,1}` of shape 60×60.

### 5.2 Zeros per rotation / position
- Rotation: `sum(matrix[r][:])`.
- Position: `sum(matrix[:][c])`.

### 5.3 Longest consecutive zeros (per rotation)
- Scan across positions left→right; track `run, maxRun`.

### 5.4 Largest connected zero cluster (4‑neighbor)
- BFS/DFS over 60×60 grid of `1`s; mark visited; keep largest count.

### 5.5 Prime density overlays
- From `rolling_probable_primes.csv`, compute:
  - **By position:** count of prime windows that include `position` / total windows covering `position`.
  - **By rotation:** apply rotation mapping if analyzing pair interaction; else per sequence baseline.

### 5.6 FFT (optional)
- For each rotation row (length 60), compute FFT magnitude; report top frequencies (expect harmonics at 6°, 12°, 15°, 20°, 30°, 60).

---

## 6) Implementation Tasks (Codex Checklist)

### 6.1 Scaffold & Tooling
- `bun create vite@latest circle-theory-calculator -- --template react-ts`
- Add Tailwind + Shadcn UI; set up `src/components/ui/*`.
- Add Recharts (or D3), Papaparse (or d3‑fetch).

### 6.2 Data ingestion
- Create `public/data/` and expect files:
  - `heatmap_all_pairs_sum10zeros_long.csv`
  - `heatmap_all_pairs_bithexzeros_long.csv`
  - `energy_summary.csv`, `energy_rotations.csv`, `energy_positions.csv`, `energy_runs.csv`
  - `rolling_probable_primes.csv`
- Implement `loaders.ts`:
  - CSV parsing, typing, and `long → matrix` pivots.
  - Memoized selectors by `pair` & `mode`.

### 6.3 Logic & Aggregates
- Implement `aggregates.ts`: zeros/rotation, zeros/position, runs, cluster BFS.
- Implement `primeDensity.ts`: density per position; optional per rotation.

### 6.4 UI
- `Controls.tsx`: pair dropdown, mode toggle, k‑range, checkboxes, rotation slider.
- `HeatmapCanvas.tsx`: performant drawing, color scale (0/1), overlay layers.
- `InsightPanel.tsx`: compute/render top lists; “Export PNG” with canvas `toDataURL`.
- `Tooltip.tsx`: show live metrics at hover coordinates.

### 6.5 QA & Acceptance
- Seed `/public/data/` with sample CSVs; a minimal subset is OK.
- Verify:
  - Matrix renders correctly for each pair/mode.
  - Top 5 rotations match `energy_rotations.csv` sorting.
  - Top 10 positions match `energy_positions.csv` sorting.
  - Longest run equals `energy_runs.csv` for selected pair/mode.
  - Cluster size equals `energy_summary.csv` for selected pair/mode.
- Add Vitest for `aggregates.ts` and `primeDensity.ts`.

### 6.6 Build/Deploy
- `netlify.toml` with SPA redirect:
  ```
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
- `bun run build` → deploy `/dist` to Netlify.

---

## 7) Sample CSV Snippets

### 7.1 `heatmap_all_pairs_sum10zeros_long.csv`
```
pair,mode,rotation,position,zero_flag
Red60-Blue60,sum10_zero,0,1,0
Red60-Blue60,sum10_zero,0,2,1
...
```

### 7.2 `energy_rotations.csv`
```
pair,mode,rotation,zeros_per_rotation
Red60-Blue60,sum10_zero,0,12
Red60-Blue60,sum10_zero,1,14
...
```

### 7.3 `rolling_probable_primes.csv`
```
sequence,window_size,start_index_1b,slice,is_probable_prime
Red60,5,1,11303,0
Red60,5,2,13031,1
...
```

---

## 8) Non-Goals (v2)
- No server/API. Pure SPA.
- No database. Bookmarks stored in LocalStorage.
- No heavy 3D viz; keep canvas/SVG 2D.

---

## 9) Acceptance Criteria

- **Performance:** initial data load < 1s for CSVs up to ~500k rows; heatmap render < 16ms per frame.
- **Correctness:** Insight lists in UI match precomputed `energy_*` CSVs for the same pair/mode.
- **Usability:** from fresh clone → `bun install && bun dev` shows working app with provided sample data.
- **Export:** “Export PNG” saves current heatmap view with labels.

---

## 10) Stretch (optional, v2.1)
- FFT spectrum panel with harmonic markers.
- Multi‑pair overlay (blend modes).
- Automations: nightly digest export (markdown) from loaded data.
- Palette presets (B$S brand): midnight blue, dirty gold, neon cyan.

---

## 11) Commands

```bash
# scaffold
bun create vite@latest circle-theory-calculator -- --template react-ts
cd circle-theory-calculator

# deps
bun add tailwindcss postcss autoprefixer
bun add -D @types/d3
bun add papaparse recharts class-variance-authority clsx tailwind-merge

# init tailwind
npx tailwindcss init -p

# dev
bun dev

# build
bun run build
```

---

## 12) Files to place now (so app runs first try)

- `public/data/heatmap_all_pairs_sum10zeros_long.csv`
- `public/data/heatmap_all_pairs_bithexzeros_long.csv`
- `public/data/energy_summary.csv`
- `public/data/energy_rotations.csv`
- `public/data/energy_positions.csv`
- `public/data/energy_runs.csv`
- `public/data/rolling_probable_primes.csv`

> Use the CSVs exported earlier from your workbook v5. Keep headers identical.
