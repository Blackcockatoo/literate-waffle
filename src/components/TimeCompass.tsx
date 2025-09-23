import React from 'react';

export interface TimeCompassProps {
  cx: number;
  cy: number;
  numberString: string;
  rotationRad: number;
  color: string;
  overlay?: number[];
  radius?: number;
  label: string;
}

const HIGHLIGHT_FILL = 'rgba(250, 204, 21, 0.35)';
const HIGHLIGHT_STROKE = 'rgba(250, 204, 21, 0.65)';

const TimeCompass: React.FC<TimeCompassProps> = ({
  cx,
  cy,
  numberString,
  rotationRad,
  color,
  overlay,
  radius = 120,
  label
}) => {
  const digits = React.useMemo(() => numberString.split('').map((d) => Number(d)), [numberString]);
  const step = (Math.PI * 2) / digits.length;

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle cx={0} cy={0} r={radius + 40} fill="rgba(15, 23, 42, 0.6)" stroke={color} strokeWidth={2} />
      <circle cx={0} cy={0} r={4} fill={color} />
      {digits.map((digit, index) => {
        const angle = index * step + rotationRad;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const dotRadius = (0.8 + (digit / 10) * 0.6) * 6;
        const highlight = overlay?.[index] === 1;

        return (
          <g key={index}>
            {highlight && (
              <circle cx={x} cy={y} r={dotRadius + 6} fill={HIGHLIGHT_FILL} stroke={HIGHLIGHT_STROKE} strokeWidth={2} />
            )}
            <circle cx={x} cy={y} r={dotRadius} fill={color} opacity={0.85} />
            <text
              x={x}
              y={y}
              fill="#f8fafc"
              fontSize={12}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ pointerEvents: 'none', fontWeight: 500 }}
            >
              {digit}
            </text>
          </g>
        );
      })}
      {digits.map((_, index) => {
        if ((index + 1) % 5 !== 0) {
          return null;
        }
        const angle = index * step + rotationRad;
        const labelRadius = radius + 22;
        const x = Math.cos(angle) * labelRadius;
        const y = Math.sin(angle) * labelRadius;
        return (
          <text
            key={`label-${index}`}
            x={x}
            y={y}
            fill="#e2e8f0"
            fontSize={14}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ pointerEvents: 'none', fontWeight: 600 }}
          >
            {index + 1}
          </text>
        );
      })}
      <text x={0} y={radius + 64} fill={color} fontSize={18} textAnchor="middle" style={{ fontWeight: 600 }}>
        {label}
      </text>
    </g>
  );
};

export default TimeCompass;
