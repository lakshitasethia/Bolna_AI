// The painted tailgate of an Indian goods truck, drawn in SVG. Sits behind the
// product window the way Granola's collage sits behind its notepad.
export default function TruckArt({ className }: { className?: string }) {
  const scallops = Array.from({ length: 14 }, (_, i) => i * 34 + 17);
  const diamonds = Array.from({ length: 9 }, (_, i) => i * 54 + 27);
  return (
    <svg className={className} viewBox="0 0 480 640" role="img" aria-label="Painted truck tailgate reading Horn OK Please">
      <rect width="480" height="640" fill="#f3b61f" />

      <rect y="0" width="480" height="118" fill="#b4232c" />
      {scallops.map((x) => (
        <circle key={x} cx={x} cy="118" r="17" fill="#b4232c" />
      ))}
      {scallops.map((x) => (
        <circle key={`d${x}`} cx={x} cy="104" r="4" fill="#fff7e0" />
      ))}

      <rect y="170" width="480" height="64" fill="#1d6a4e" />
      {diamonds.map((x, i) => (
        <path
          key={x}
          d={`M${x} 178 L${x + 22} 202 L${x} 226 L${x - 22} 202 Z`}
          fill={i % 2 ? "#f3b61f" : "#fff7e0"}
          stroke="#1f4e9c"
          strokeWidth="3"
        />
      ))}

      <g fontFamily="var(--font-serif)" fill="#262420" textAnchor="end">
        <text x="452" y="318" fontSize="54">Horn</text>
        <text x="452" y="380" fontSize="54">OK</text>
        <text x="452" y="442" fontSize="54">Please</text>
      </g>

      <g transform="translate(380 532)">
        {[0, 45, 90, 135].map((r) => (
          <ellipse key={r} rx="16" ry="44" fill="#b4232c" opacity="0.85" transform={`rotate(${r})`} />
        ))}
        <circle r="14" fill="#fff7e0" stroke="#1f4e9c" strokeWidth="3" />
      </g>

      <rect y="606" width="480" height="34" fill="#1f4e9c" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M${i * 40} 640 L${i * 40 + 20} 612 L${i * 40 + 40} 640 Z`} fill="#fff7e0" opacity="0.9" />
      ))}
    </svg>
  );
}
