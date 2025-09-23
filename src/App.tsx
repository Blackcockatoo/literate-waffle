import React from 'react';
import TimeCompass from './components/TimeCompass';
import ResonanceControls from './components/ResonanceControls';
import {
  MODE_OPTIONS,
  PAIR_OPTIONS,
  SEQUENCE_COLORS,
  SEQUENCES,
  getSequenceKeysForPair,
  loadEnergyData,
  loadHeatmapData,
  ModeOption,
  PairOption,
  EnergyRow,
  HeatmapRow,
  SequenceKey
} from './data/loaders';

const SVG_WIDTH = 900;
const SVG_HEIGHT = 420;
const CENTER_LEFT = { x: 260, y: 200 };
const CENTER_RIGHT = { x: 640, y: 200 };

const App: React.FC = () => {
  const [pair, setPair] = React.useState<PairOption>('Red60-Blue60');
  const [mode, setMode] = React.useState<ModeOption>('sum10_zero');
  const [rotation, setRotation] = React.useState<number>(0);
  const [heatmapRows, setHeatmapRows] = React.useState<HeatmapRow[]>([]);
  const [energyRows, setEnergyRows] = React.useState<EnergyRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sequenceError, setSequenceError] = React.useState<string | null>(null);

  const svgRef = React.useRef<SVGSVGElement | null>(null);

  React.useEffect(() => {
    let isActive = true;
    setLoading(true);
    Promise.all([loadHeatmapData(), loadEnergyData()])
      .then(([heatmap, energy]) => {
        if (!isActive) {
          return;
        }
        setHeatmapRows(heatmap);
        setEnergyRows(energy);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isActive) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Unable to load datasets.';
        setError(message);
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  React.useEffect(() => {
    setRotation(0);
  }, [pair, mode]);

  const rotationRadians = React.useMemo(() => rotation * (Math.PI / 30), [rotation]);

  const overlay = React.useMemo(() => {
    const map = new Array(60).fill(0);
    if (heatmapRows.length === 0) {
      return map;
    }
    heatmapRows
      .filter((row) => row.pair === pair && row.mode === mode && row.rotation === rotation)
      .forEach((row) => {
        const index = Math.max(0, Math.min(59, row.position - 1));
        map[index] = row.zero_flag ? 1 : 0;
      });
    return map;
  }, [heatmapRows, pair, mode, rotation]);

  const activeOverlayCount = React.useMemo(() => overlay.filter((value) => value === 1).length, [overlay]);

  const energyForSelection = React.useMemo(
    () => energyRows.filter((row) => row.pair === pair && row.mode === mode),
    [energyRows, pair, mode]
  );

  const recommendedEnergy = React.useMemo(() => {
    if (energyForSelection.length === 0) {
      return null;
    }
    return energyForSelection.reduce((best, row) => {
      if (!best) {
        return row;
      }
      if (row.zeros_per_rotation > best.zeros_per_rotation) {
        return row;
      }
      if (row.zeros_per_rotation === best.zeros_per_rotation && row.rotation < best.rotation) {
        return row;
      }
      return best;
    }, null as EnergyRow | null);
  }, [energyForSelection]);

  const zerosAtRotation = React.useMemo(() => {
    const match = energyForSelection.find((row) => row.rotation === rotation);
    return match ? match.zeros_per_rotation : null;
  }, [energyForSelection, rotation]);

  const sequenceInfo = React.useMemo(() => {
    try {
      return {
        keys: getSequenceKeysForPair(pair),
        error: null as string | null
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to resolve the selected sequence pair.';
      const fallback: SequenceKey[] = ['Lukus60', 'Lukus60'];
      return { keys: fallback, error: message };
    }
  }, [pair]);

  React.useEffect(() => {
    setSequenceError(sequenceInfo.error);
  }, [sequenceInfo.error]);

  const sequenceKeys = sequenceInfo.keys;

  const handlePairChange = (nextPair: PairOption) => {
    setPair(nextPair);
  };

  const handleModeChange = (nextMode: ModeOption) => {
    setMode(nextMode);
  };

  const handleRotationChange = (nextRotation: number) => {
    setRotation(nextRotation);
  };

  const handleSnapToTop = () => {
    if (recommendedEnergy) {
      setRotation(recommendedEnergy.rotation);
    }
  };

  const handleExportPng = () => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();
    const { width, height } = svg.viewBox.baseVal.width
      ? { width: svg.viewBox.baseVal.width, height: svg.viewBox.baseVal.height }
      : { width: svg.clientWidth, height: svg.clientHeight };

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }
      context.fillStyle = '#0f172a';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `resonance-compass-${pair}-${mode}-rot${rotation}.png`;
      link.click();
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-100">Resonance Compass Explorer</h1>
            <p className="text-sm text-slate-400">
              Visualise resonance heatmaps across rotations and zero overlays.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportPng}
            className="self-start rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-blue-950 transition hover:bg-blue-400"
            disabled={loading}
          >
            Export PNG
          </button>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <ResonanceControls
          pair={pair}
          mode={mode}
          rotation={rotation}
          pairs={PAIR_OPTIONS}
          modes={MODE_OPTIONS}
          onPairChange={handlePairChange}
          onModeChange={handleModeChange}
          onRotationChange={handleRotationChange}
          onSnapToTop={handleSnapToTop}
          loading={loading}
          recommendedRotation={recommendedEnergy?.rotation ?? null}
          recommendedZeros={recommendedEnergy?.zeros_per_rotation ?? null}
        />

        {sequenceError && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-200" role="status">
            <p className="font-semibold">{sequenceError}</p>
            <p className="text-sm text-amber-200/80">
              Double-check the configured pair names or update the available sequences in loaders.ts.
            </p>
          </div>
        )}

        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-red-200">
            <p className="font-semibold">{error}</p>
            <p className="text-sm text-red-200/80">Please verify the CSV files in /public/data/.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <section className="rounded-xl bg-slate-800/40 p-4 shadow-lg shadow-slate-900/30">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-100">Time Compass Overlay</h2>
                    <p className="text-sm text-slate-400">
                      Overlay active zero positions for the selected pair, mode, and rotation.
                    </p>
                  </div>
                </div>
                <div className="overflow-auto">
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                    className="mx-auto block h-auto w-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="rgba(15, 23, 42, 0.95)" />
                    <TimeCompass
                      cx={CENTER_LEFT.x}
                      cy={CENTER_LEFT.y}
                      numberString={SEQUENCES[sequenceKeys[0]]}
                      rotationRad={rotationRadians}
                      color={SEQUENCE_COLORS[sequenceKeys[0]]}
                      overlay={overlay}
                      label={sequenceKeys[0]}
                    />
                    <TimeCompass
                      cx={CENTER_RIGHT.x}
                      cy={CENTER_RIGHT.y}
                      numberString={SEQUENCES[sequenceKeys[1] ?? sequenceKeys[0]]}
                      rotationRad={rotationRadians}
                      color={SEQUENCE_COLORS[sequenceKeys[1] ?? sequenceKeys[0]]}
                      overlay={overlay}
                      label={sequenceKeys[1] ?? sequenceKeys[0]}
                    />
                  </svg>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Active Overlay</h3>
                <p className="mt-2 text-3xl font-semibold text-amber-300">{activeOverlayCount}</p>
                <p className="text-xs text-slate-500">Highlighted zero positions at rotation {rotation}.</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Rotation</h3>
                <p className="mt-2 text-3xl font-semibold text-blue-300">{rotation}</p>
                <p className="text-xs text-slate-500">Orientation offset of {rotation * 6}&deg;.</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Zeros / Rotation</h3>
                <p className="mt-2 text-3xl font-semibold text-emerald-300">{zerosAtRotation ?? '—'}</p>
                <p className="text-xs text-slate-500">Energy density for this configuration.</p>
              </div>
            </section>
          </div>
        )}
      </main>
      <footer className="border-t border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Resonance Labs. Built with React, TypeScript, and Tailwind CSS.
        </div>
      </footer>
    </div>
  );
};

export default App;
