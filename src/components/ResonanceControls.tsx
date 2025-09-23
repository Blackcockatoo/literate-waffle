import React from 'react';
import { ModeOption, PairOption } from '../data/loaders';

interface ResonanceControlsProps {
  pair: PairOption;
  mode: ModeOption;
  rotation: number;
  pairs: PairOption[];
  modes: ModeOption[];
  onPairChange: (pair: PairOption) => void;
  onModeChange: (mode: ModeOption) => void;
  onRotationChange: (rotation: number) => void;
  onSnapToTop: () => void;
  loading?: boolean;
  recommendedRotation?: number | null;
  recommendedZeros?: number | null;
}

const ResonanceControls: React.FC<ResonanceControlsProps> = ({
  pair,
  mode,
  rotation,
  pairs,
  modes,
  onPairChange,
  onModeChange,
  onRotationChange,
  onSnapToTop,
  loading = false,
  recommendedRotation,
  recommendedZeros
}) => {
  const handlePairChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onPairChange(event.target.value as PairOption);
  };

  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onModeChange(event.target.value as ModeOption);
  };

  const handleRotationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRotationChange(Number(event.target.value));
  };

  return (
    <div className="w-full rounded-xl bg-slate-800/70 p-4 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">Pair</label>
          <select
            value={pair}
            onChange={handlePairChange}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-400 focus:outline-none"
            disabled={loading}
          >
            {pairs.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">Mode</label>
          <select
            value={mode}
            onChange={handleModeChange}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:border-blue-400 focus:outline-none"
            disabled={loading}
          >
            {modes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">Rotation</label>
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min={0}
              max={59}
              step={1}
              value={rotation}
              onChange={handleRotationChange}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              <span>{rotation} steps</span>
              <span>{rotation * 6}&deg;</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:w-48">
          <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">Energy</label>
          <button
            type="button"
            onClick={onSnapToTop}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || recommendedRotation === null || recommendedRotation === undefined}
          >
            Snap to Top
          </button>
          {recommendedRotation !== null && recommendedRotation !== undefined ? (
            <p className="text-xs text-slate-300">
              Best rotation {recommendedRotation} ({(recommendedRotation ?? 0) * 6}
              &deg;) · zeros: {recommendedZeros ?? '—'}
            </p>
          ) : (
            <p className="text-xs text-slate-500">No energy data for this selection.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResonanceControls;
