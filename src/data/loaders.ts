import Papa, { ParseResult } from 'papaparse';

export type PairOption =
  | 'Red60-Blue60'
  | 'Red60-Black60'
  | 'Red60-Lukus60'
  | 'Black60-Blue60'
  | 'Black60-Lukus60'
  | 'Blue60-Lukus60';

export type ModeOption = 'sum10_zero' | 'bithex_zero';

export interface HeatmapRow {
  pair: PairOption;
  mode: ModeOption;
  rotation: number;
  position: number;
  zero_flag: number;
}

export interface EnergyRow {
  pair: PairOption;
  mode: ModeOption;
  rotation: number;
  zeros_per_rotation: number;
}

export type SequenceKey = 'Blue60' | 'Red60' | 'Black60' | 'Lukus60';

export const SEQUENCES: Record<SequenceKey, string> = {
  Blue60: '012776329785893036118967145479098334781325217074992143965631',
  Red60: '113031491493585389543778774590997079619617525721567332336510',
  Black60: '011235831459437077415617853819099875279651673033695493257291',
  Lukus60: '271828182845904523536028747135266249775724709369995957496696'
};

export const SEQUENCE_COLORS: Record<SequenceKey, string> = {
  Blue60: '#3b82f6',
  Red60: '#ef4444',
  Black60: '#4b5563',
  Lukus60: '#f59e0b'
};

export const PAIR_OPTIONS: PairOption[] = [
  'Red60-Blue60',
  'Red60-Black60',
  'Red60-Lukus60',
  'Black60-Blue60',
  'Black60-Lukus60',
  'Blue60-Lukus60'
];

export const MODE_OPTIONS: ModeOption[] = ['sum10_zero', 'bithex_zero'];

type ParsedRow = Record<string, unknown>;

function fetchCsvRows(path: string): Promise<ParsedRow[]> {
  return fetch(path)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status}`);
      }
      return response.text();
    })
    .then(
      (text) =>
        new Promise<ParsedRow[]>((resolve, reject) => {
          Papa.parse<ParsedRow>(text, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results: ParseResult<ParsedRow>) => {
              if (results.errors.length > 0) {
                reject(results.errors[0]);
                return;
              }
              resolve(results.data as ParsedRow[]);
            },
            error: (error: Error) => reject(error)
          });
        })
    );
}

function asPair(value: unknown): PairOption | null {
  return PAIR_OPTIONS.includes(value as PairOption) ? (value as PairOption) : null;
}

function asMode(value: unknown): ModeOption | null {
  return MODE_OPTIONS.includes(value as ModeOption) ? (value as ModeOption) : null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

const heatmapDataPromise: Promise<HeatmapRow[]> = Promise.all([
  fetchCsvRows('/data/heatmap_all_pairs_sum10zeros_long.csv'),
  fetchCsvRows('/data/heatmap_all_pairs_bithexzeros_long.csv')
]).then((all) =>
  all
    .flat()
    .map((row) => {
      const pair = asPair(row.pair);
      const mode = asMode(row.mode);
      const rotation = toNumber(row.rotation);
      const position = toNumber(row.position);
      const zeroFlag = toNumber(row.zero_flag);
      if (!pair || !mode || rotation === null || position === null || zeroFlag === null) {
        return null;
      }
      return {
        pair,
        mode,
        rotation: Math.max(0, Math.min(59, Math.round(rotation))),
        position: Math.max(1, Math.min(60, Math.round(position))),
        zero_flag: zeroFlag ? 1 : 0
      } as HeatmapRow;
    })
    .filter((row): row is HeatmapRow => row !== null)
);

const energyDataPromise: Promise<EnergyRow[]> = fetchCsvRows('/data/energy_rotations.csv').then((rows) =>
  rows
    .map((row) => {
      const pair = asPair(row.pair);
      const mode = asMode(row.mode);
      const rotation = toNumber(row.rotation);
      const zeros = toNumber(row.zeros_per_rotation);
      if (!pair || !mode || rotation === null || zeros === null) {
        return null;
      }
      return {
        pair,
        mode,
        rotation: Math.max(0, Math.min(59, Math.round(rotation))),
        zeros_per_rotation: zeros
      } as EnergyRow;
    })
    .filter((row): row is EnergyRow => row !== null)
);

export function loadHeatmapData(): Promise<HeatmapRow[]> {
  return heatmapDataPromise.then((rows) => [...rows]);
}

export function loadEnergyData(): Promise<EnergyRow[]> {
  return energyDataPromise.then((rows) => [...rows]);
}

export function getSequenceKeysForPair(pair: PairOption): SequenceKey[] {
  const parts = pair.split('-') as SequenceKey[];
  return parts.map((part) => (part in SEQUENCES ? part : 'Lukus60'));
}
