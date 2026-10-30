// Line drawings for the landing page. Everything is generated deterministically so
// server and client render identical markup. Strokes marked data-draw are drawn in by
// GSAP; fills marked data-tone fade in after.

const INK = "#282828";
const SOFT = "#9c9b96";
const BRAND = "#fa3600";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const f = (n: number) => n.toFixed(1);

// Bare winter tree, grown recursively. Segments are bucketed by stroke width so a
// tree renders as a handful of paths instead of hundreds of lines.
export function treePaths(x: number, y: number, h: number, seed: number, depth = 8) {
  const r = rng(seed);
  const buckets = new Map<number, string[]>();
  const up = -Math.PI / 2;
  const grow = (x0: number, y0: number, a: number, len: number, d: number, w: number) => {
    const x1 = x0 + Math.cos(a) * len;
    const y1 = y0 + Math.sin(a) * len;
    const bend = (r() - 0.5) * len * 0.3;
    const mx = (x0 + x1) / 2 + Math.cos(a + Math.PI / 2) * bend;
    const my = (y0 + y1) / 2 + Math.sin(a + Math.PI / 2) * bend;
    const key = Math.max(0.5, Math.round(w * 4) / 4);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(`M${f(x0)} ${f(y0)}Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}`);
    if (d === 0) return;
    const n = d > 3 && r() < 0.4 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = 0.22 + r() * 0.36;
      let na = a + (n === 2 ? (i ? spread : -spread) : (i - 1) * spread * 1.15) + (r() - 0.5) * 0.18;
      na += (up - na) * 0.12;
      grow(x1, y1, na, len * (0.7 + r() * 0.12), d - 1, w * 0.66);
    }
  };
  grow(x, y, up + (r() - 0.5) * 0.06, h * 0.26, depth, h / 42);
  return [...buckets].sort((a, b) => b[0] - a[0]).map(([w, ds]) => ({ w, d: ds.join("") }));
}

function Tree({ x, y, h, seed, tone = INK, depth }: { x: number; y: number; h: number; seed: number; tone?: string; depth?: number }) {
  return (
    <g stroke={tone} fill="none" strokeLinecap="round">
      {treePaths(x, y, h, seed, depth).map((p) => (
        <path key={p.w} d={p.d} strokeWidth={p.w} data-draw />
      ))}
    </g>
  );
}

export function Patterns({ id = "p" }: { id?: string }) {
  return (
    <defs>
      <pattern id={`${id}-stipple`} width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r=".62" fill={INK} />
        <circle cx="3.6" cy="3.4" r=".5" fill={INK} />
      </pattern>
      <pattern id={`${id}-stipple-light`} width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="2" r=".55" fill={INK} />
        <circle cx="5" cy="5.5" r=".45" fill={INK} />
      </pattern>
      <pattern id={`${id}-hatch`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="5" stroke={INK} strokeWidth=".8" />
      </pattern>
      <pattern id={`${id}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" fill="none" stroke={INK} strokeOpacity=".08" strokeWidth="1" />
      </pattern>
    </defs>
  );
}

function Wheel({ cx, cy, id }: { cx: number; cy: number; id: string }) {
  const lugs = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return <circle key={i} cx={cx + Math.cos(a) * 17} cy={cy + Math.sin(a) * 17} r="2" fill={INK} data-tone />;
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r="44" fill={INK} data-tone />
      <circle cx={cx} cy={cy} r="44" fill="none" stroke={INK} strokeWidth="1.6" data-draw />
      <circle cx={cx} cy={cy} r="29" fill="var(--paper)" stroke={INK} strokeWidth="1.4" data-draw />
      <circle cx={cx} cy={cy} r="29" fill={`url(#${id}-stipple-light)`} data-tone />
      <circle cx={cx} cy={cy} r="22" fill="none" stroke={INK} strokeWidth="1" data-draw />
      <circle cx={cx} cy={cy} r="9" fill="var(--paper)" stroke={INK} strokeWidth="1.4" data-draw />
      {lugs}
    </g>
  );
}

// Side elevation of a 32 ft container truck on an Indian highway.
export function TruckScene({ id = "hero", markers = true }: { id?: string; markers?: boolean }) {
  const corrugation = Array.from({ length: 57 }, (_, i) => `M${384 + i * 12.1} 110V342`).join("");
  return (
    <svg viewBox="-60 60 1380 410" role="img" aria-label="Line drawing of a 32 foot container truck on the highway">
      <Patterns id={id} />

      {/* Trees behind the truck */}
      <Tree x={70} y={440} h={350} seed={11} tone={SOFT} depth={7} />
      <Tree x={-10} y={440} h={300} seed={29} />
      <Tree x={1150} y={440} h={330} seed={7} tone={SOFT} depth={7} />
      <Tree x={1238} y={440} h={370} seed={41} />

      {/* Ground shadow */}
      <path d="M150 440H1110L1160 456H196Z" fill={`url(#${id}-stipple)`} opacity=".7" data-tone />

      {/* Container */}
      <g>
        <rect x="372" y="96" width="718" height="260" fill="var(--paper)" stroke={INK} strokeWidth="1.6" data-draw />
        <path d={corrugation} stroke={INK} strokeWidth=".7" strokeOpacity=".75" data-draw />
        <path d="M372 110H1090M372 342H1090" stroke={INK} strokeWidth="1.2" data-draw />
        <rect x="372" y="96" width="12" height="260" fill={`url(#${id}-hatch)`} stroke={INK} strokeWidth="1" data-draw />
        <rect x="1078" y="96" width="12" height="260" fill={`url(#${id}-hatch)`} stroke={INK} strokeWidth="1" data-draw />
        {/* Shadow cast by the cab deflector */}
        <path d="M384 110H600L384 300Z" fill={`url(#${id}-stipple)`} data-tone />
        <path d="M384 342H1078V356H384Z" fill={`url(#${id}-stipple)`} data-tone />
        <rect x="420" y="128" width="96" height="30" fill="var(--paper)" stroke={INK} strokeWidth="1" data-draw />
        <text x="468" y="148" textAnchor="middle" className="svg-mono" fontSize="13" fill={INK} data-tone>
          32 FT
        </text>
        <rect x="1090" y="320" width="8" height="18" fill={BRAND} data-tone />
      </g>

      {/* Chassis, tank, side guard */}
      <rect x="140" y="356" width="962" height="15" fill={INK} data-tone />
      <rect x="140" y="356" width="962" height="15" fill="none" stroke={INK} strokeWidth="1.2" data-draw />
      <rect x="390" y="372" width="96" height="36" rx="10" fill="var(--paper)" stroke={INK} strokeWidth="1.3" data-draw />
      <rect x="390" y="372" width="96" height="36" rx="10" fill={`url(#${id}-stipple-light)`} data-tone />
      <path d="M414 372V408M462 372V408" stroke={INK} strokeWidth="1" data-draw />
      <path d="M500 384H790M500 400H790M520 371V404M640 371V404M760 371V404" stroke={INK} strokeWidth="1.3" data-draw />

      {/* Mudguards and wheels */}
      <path d="M800 372Q800 334 860 334H960Q1018 334 1018 372" fill="none" stroke={INK} strokeWidth="1.4" data-draw />
      <rect x="1020" y="372" width="12" height="54" fill={INK} data-tone />
      <Wheel cx={250} cy={396} id={id} />
      <Wheel cx={862} cy={396} id={id} />
      <Wheel cx={958} cy={396} id={id} />

      {/* Cab */}
      <g>
        <path d="M200 146L214 102L352 94V146Z" fill="var(--paper)" stroke={INK} strokeWidth="1.5" data-draw />
        <path d="M214 102L352 94V146H222Z" fill={`url(#${id}-stipple-light)`} data-tone />
        <path
          d="M150 404V262L162 250L186 158Q190 146 202 146H352V404H302Q302 340 250 340Q198 340 198 404Z"
          fill="var(--paper)"
          stroke={INK}
          strokeWidth="1.6"
          data-draw
        />
        <path d="M168 250L190 166H230V250Z" fill={`url(#${id}-stipple)`} stroke={INK} strokeWidth="1.2" data-draw />
        <path d="M248 166H328V242H248V182Z" fill="var(--paper)" stroke={INK} strokeWidth="1.3" data-draw />
        <path d="M252 238L324 170" stroke={INK} strokeWidth=".6" strokeOpacity=".5" data-draw />
        <path d="M240 156H336V378H240Z" fill="none" stroke={INK} strokeWidth="1" data-draw />
        <rect x="314" y="262" width="16" height="5" fill={INK} data-tone />
        <path d="M150 292H352M150 304H352" stroke={INK} strokeWidth="1" data-draw />
        <rect x="150" y="292" width="202" height="12" fill={`url(#${id}-hatch)`} data-tone />
        <path d="M336 156H352V404H336Z" fill={`url(#${id}-stipple)`} data-tone />
        <path d="M188 194L170 190M164 176H172V218H164Z" fill="var(--paper)" stroke={INK} strokeWidth="1.3" data-draw />
        <rect x="146" y="316" width="14" height="22" fill="var(--paper)" stroke={INK} strokeWidth="1.2" data-draw />
        <rect x="134" y="380" width="66" height="24" fill="var(--paper)" stroke={INK} strokeWidth="1.4" data-draw />
        <rect x="134" y="380" width="66" height="24" fill={`url(#${id}-hatch)`} data-tone />
        <path d="M250 382H296M250 396H296" stroke={INK} strokeWidth="2" data-draw />
      </g>

      {/* Milestone, NH 48 */}
      <g transform="translate(1120 440)">
        <path d="M-22 0V-58A22 22 0 0 1 22 -58V0Z" fill="var(--paper)" stroke={INK} strokeWidth="1.4" data-draw />
        <path d="M-22 -58A22 22 0 0 1 22 -58V-50H-22Z" fill={BRAND} data-tone />
        <text y="-34" textAnchor="middle" className="svg-mono" fontSize="8.5" fill={INK} data-tone>
          JAIPUR
        </text>
        <text y="-18" textAnchor="middle" className="svg-sans" fontWeight="600" fontSize="14" fill={INK} data-tone>
          142
        </text>
        <path d="M-30 0H30" stroke={INK} strokeWidth="1.4" data-draw />
      </g>

      {/* Ground */}
      <path d="M-60 440H1320" stroke={INK} strokeWidth="1.6" data-draw />
      <path d="M-60 452H1320" stroke={INK} strokeWidth=".6" strokeDasharray="2 6" strokeOpacity=".6" data-tone />

      {markers && (
        <g fill={BRAND} data-tone>
          <rect x="280" y="194" width="11" height="11" data-marker="0" />
          <rect x="826" y="222" width="11" height="11" data-marker="1" />
        </g>
      )}
    </svg>
  );
}

// Lattice phone tower with sector antennas and a sun behind it. The mono version is the
// black-and-white print; the colour version adds the orange sun, its halo and the signal.
export function TowerScene({ id = "tower", colour = false }: { id?: string; colour?: boolean }) {
  const levels = [600, 505, 420, 346, 282, 228, 182, 142, 108];
  const xAt = (y: number, side: -1 | 1) => 200 + side * (24 + ((y - 108) / 492) * 74);
  const bracing = levels.slice(0, -1).map((y0, i) => {
    const y1 = levels[i + 1];
    return `M${f(xAt(y0, -1))} ${y0}L${f(xAt(y1, 1))} ${y1}M${f(xAt(y0, 1))} ${y0}L${f(xAt(y1, -1))} ${y1}M${f(xAt(y1, -1))} ${y1}H${f(xAt(y1, 1))}`;
  });
  const signal = colour ? BRAND : INK;
  return (
    <svg viewBox="0 0 400 640" role="img" aria-label="Line drawing of a mobile phone tower">
      <Patterns id={id} />
      {colour ? (
        <g data-sun>
          <defs>
            <radialGradient id={`${id}-glow`} cx=".5" cy="1" r=".5">
              <stop offset="0" stopColor={BRAND} stopOpacity=".2" />
              <stop offset="1" stopColor={BRAND} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="380" width="400" height="220" fill={`url(#${id}-glow)`} />
          <circle cx="262" cy="196" r="150" fill="none" stroke={BRAND} strokeOpacity=".4" strokeWidth=".8" strokeDasharray="2 5" />
          <circle cx="262" cy="196" r="122" fill="none" stroke={BRAND} strokeOpacity=".6" strokeWidth=".8" />
          <circle cx="262" cy="196" r="96" fill={BRAND} />
        </g>
      ) : (
        <g data-sun>
          <circle cx="262" cy="196" r="96" fill="#cfcec8" />
          <circle cx="262" cy="196" r="96" fill={`url(#${id}-hatch)`} opacity=".22" />
          <circle cx="262" cy="196" r="96" fill="none" stroke={SOFT} strokeWidth=".8" />
        </g>
      )}
      <path d={`M${xAt(600, -1)} 600L${xAt(108, -1)} 108M${xAt(600, 1)} 600L${xAt(108, 1)} 108`} stroke={INK} strokeWidth="2.4" data-draw />
      <path d={bracing.join("")} stroke={INK} strokeWidth="1" fill="none" data-draw />
      <path d="M200 600V30" stroke={INK} strokeWidth=".7" strokeDasharray="3 4" data-tone />
      <path d="M200 108V24" stroke={INK} strokeWidth="2" data-draw />
      {colour && <circle cx="200" cy="22" r="3.2" fill={BRAND} />}
      <path d="M150 104H250V110H150Z M150 92V104M250 92V104M150 92H250" fill="var(--paper)" stroke={INK} strokeWidth="1.2" data-draw />
      {[160, 192, 224].map((x) => (
        <g key={x}>
          <rect x={x} y="38" width="16" height="52" fill="var(--paper)" stroke={INK} strokeWidth="1.3" data-draw />
          <rect x={x + 8} y="38" width="8" height="52" fill={`url(#${id}-stipple)`} data-tone />
        </g>
      ))}
      <ellipse cx="162" cy="168" rx="11" ry="20" fill="var(--paper)" stroke={INK} strokeWidth="1.3" data-draw />
      <path d="M162 168H186M246 214H222" stroke={INK} strokeWidth="1" data-draw />
      <ellipse cx="248" cy="214" rx="9" ry="16" fill="var(--paper)" stroke={INK} strokeWidth="1.3" data-draw />
      {[36, 62, 90].map((r) => (
        <path key={r} d={`M${200 + r} ${64 - r * 0.7}A${r} ${r} 0 0 1 ${200 + r} ${64 + r * 0.7}`} fill="none" stroke={signal} strokeWidth={colour ? 1.3 : 0.9} strokeDasharray="3 4" transform="translate(40 0)" data-tone />
      ))}
      <g>
        <rect x="282" y="540" width="92" height="60" fill="var(--paper)" stroke={INK} strokeWidth="1.4" data-draw />
        <path d="M276 540H380" stroke={INK} strokeWidth="2.4" data-draw />
        <rect x="294" y="556" width="22" height="44" fill="none" stroke={INK} strokeWidth="1" data-draw />
        <rect x="330" y="556" width="30" height="22" fill={colour ? BRAND : `url(#${id}-hatch)`} stroke={INK} strokeWidth="1" data-draw />
        <path d="M352 540H374V600H352Z" fill={`url(#${id}-stipple)`} data-tone />
      </g>
      <path d={Array.from({ length: 14 }, (_, i) => `M${14 + i * 18} 600V584`).join("") + "M14 588H262"} stroke={INK} strokeWidth=".9" data-draw />
      <path d="M0 600H400" stroke={INK} strokeWidth="1.6" data-draw />
      <path d="M118 600H282L300 612H104Z" fill={`url(#${id}-stipple)`} opacity=".6" data-tone />
    </svg>
  );
}

// Sawtooth-roof factory with three loading bays and a truck backed into one.
export function YardScene({ id = "yard" }: { id?: string }) {
  const teeth = Array.from({ length: 5 }, (_, i) => {
    const x = 40 + i * 104;
    return `M${x} 262V196L${x + 104} 262`;
  }).join("");
  const glass = Array.from({ length: 5 }, (_, i) => {
    const x = 40 + i * 104;
    return `M${x + 4} 204V258M${x + 4} 230H${x + 40}`;
  }).join("");
  const shutter = (x: number) => Array.from({ length: 21 }, (_, i) => `M${x} ${346 + i * 6}H${x + 120}`).join("");
  return (
    <svg viewBox="0 0 600 560" role="img" aria-label="Line drawing of a factory loading yard with a truck at the dock">
      <Patterns id={id} />
      <circle cx="430" cy="150" r="84" fill={BRAND} data-sun data-tone />
      <path d={teeth + "M560 262V196"} fill="none" stroke={INK} strokeWidth="1.6" data-draw />
      <path d={glass} stroke={INK} strokeWidth=".9" data-draw />
      <rect x="40" y="262" width="520" height="210" fill="var(--paper)" stroke={INK} strokeWidth="1.6" data-draw />
      <rect x="40" y="262" width="520" height="22" fill={`url(#${id}-stipple)`} data-tone />
      <rect x="80" y="340" width="120" height="130" fill="var(--paper)" stroke={INK} strokeWidth="1.3" data-draw />
      <path d={shutter(80)} stroke={INK} strokeWidth=".6" data-draw />
      <rect x="250" y="340" width="120" height="130" fill={`url(#${id}-stipple)`} stroke={INK} strokeWidth="1.3" data-draw />
      <rect x="420" y="340" width="120" height="130" fill={BRAND} data-tone />
      <rect x="420" y="340" width="120" height="130" fill="none" stroke={INK} strokeWidth="1.3" data-draw />
      <path d={shutter(420)} stroke={INK} strokeWidth=".6" strokeOpacity=".5" data-draw />
      <rect x="30" y="470" width="540" height="30" fill={`url(#${id}-hatch)`} stroke={INK} strokeWidth="1.4" data-draw />

      {/* Truck back */}
      <g>
        <rect x="256" y="318" width="108" height="150" fill="var(--paper)" stroke={INK} strokeWidth="1.6" data-draw />
        <path d="M310 330V460M272 330V460M290 330V460M330 330V460M348 330V460" stroke={INK} strokeWidth="1" data-draw />
        <path d="M266 398H280M300 398H314M320 398H334M338 398H352" stroke={INK} strokeWidth="2" data-draw />
        <rect x="256" y="318" width="108" height="14" fill={INK} data-tone />
        <text x="310" y="328.5" textAnchor="middle" className="svg-mono" fontSize="7.5" fill="var(--paper)" data-tone>
          HORN OK PLEASE
        </text>
        <rect x="250" y="468" width="120" height="10" fill="var(--paper)" stroke={INK} strokeWidth="1.3" data-draw />
        <rect x="286" y="468" width="48" height="10" fill={`url(#${id}-hatch)`} data-tone />
        <rect x="258" y="478" width="30" height="22" rx="3" fill={INK} data-tone />
        <rect x="332" y="478" width="30" height="22" rx="3" fill={INK} data-tone />
        <rect x="258" y="452" width="8" height="10" fill={BRAND} data-tone />
        <rect x="354" y="452" width="8" height="10" fill={BRAND} data-tone />
      </g>

      {/* A loader on the dock */}
      <g stroke={INK} strokeWidth="1.3" fill="none" strokeLinecap="round" data-draw>
        <circle cx="222" cy="436" r="4" />
        <path d="M222 440V456M222 446L215 452M222 446L229 450M222 456L218 470M222 456L226 470" />
      </g>
      <path d="M0 500H600" stroke={INK} strokeWidth="1.6" data-draw />
    </svg>
  );
}

// A highway running toward the horizon, with a milestone and a plaza grid.
export function RoadScene({ id = "road" }: { id?: string }) {
  const hy = 170;
  const vx = 320;
  const fan = Array.from({ length: 17 }, (_, i) => -320 + i * 80)
    .map((x) => `M${vx} ${hy}L${x} 360`)
    .join("");
  const rows = [0.05, 0.12, 0.22, 0.36, 0.56, 0.82].map((s) => `M0 ${f(hy + 190 * s)}H640`).join("");
  const dashes = [
    [0.04, 0.07],
    [0.11, 0.16],
    [0.21, 0.3],
    [0.37, 0.5],
    [0.6, 0.8],
  ]
    .map(([a, b]) => {
      const ya = hy + 190 * a;
      const yb = hy + 190 * b;
      const wa = 0.6 + a * 6;
      const wb = 0.6 + b * 6;
      return `M${f(vx - wa)} ${f(ya)}L${f(vx + wa)} ${f(ya)}L${f(vx + wb)} ${f(yb)}L${f(vx - wb)} ${f(yb)}Z`;
    })
    .join("");
  return (
    <svg viewBox="0 0 640 360" role="img" aria-label="Line drawing of the highway to Jaipur">
      <Patterns id={id} />
      <clipPath id={`${id}-sky`}>
        <rect x="0" y="0" width="640" height={hy} />
      </clipPath>
      <circle cx="404" cy="150" r="46" fill={BRAND} clipPath={`url(#${id}-sky)`} data-tone />
      <path d={`M0 ${hy}H640`} stroke={INK} strokeWidth="1.3" data-draw />
      <path d="M0 170Q60 150 120 160T250 156T420 162T640 152" fill="none" stroke={INK} strokeWidth=".8" strokeOpacity=".6" data-draw />
      <path d={fan + rows} stroke={INK} strokeWidth=".6" strokeOpacity=".35" strokeDasharray="2 4" data-tone />
      <path d={`M${vx} ${hy}L70 360M${vx} ${hy}L570 360`} stroke={INK} strokeWidth="1.6" data-draw />
      <path d={`M${vx - 6} ${hy}L70 360H570L${vx + 6} ${hy}Z`} fill={`url(#${id}-stipple-light)`} opacity=".55" data-tone />
      <path d={dashes} fill={INK} data-tone />
      <rect x="313" y="160" width="14" height="9" fill={INK} data-tone />
      <g transform="translate(508 318) scale(1.35)">
        <path d="M-22 0V-58A22 22 0 0 1 22 -58V0Z" fill="var(--paper)" stroke={INK} strokeWidth="1.2" data-draw />
        <path d="M-22 -58A22 22 0 0 1 22 -58V-50H-22Z" fill={BRAND} data-tone />
        <text y="-34" textAnchor="middle" className="svg-mono" fontSize="8.5" fill={INK} data-tone>
          JAIPUR
        </text>
        <text y="-17" textAnchor="middle" className="svg-sans" fontWeight="600" fontSize="14" fill={INK} data-tone>
          268
        </text>
      </g>
      <Tree x={44} y={286} h={150} seed={5} depth={6} />
      <Tree x={150} y={214} h={70} seed={19} tone={SOFT} depth={5} />
      <Tree x={232} y={184} h={30} seed={23} tone={SOFT} depth={4} />
    </svg>
  );
}

// Schematic of the Okhla to Jaipur lane on NH 48, drawn like a floor plan.
export const ROUTE = "M700 200L640 260V330L520 450H440L300 590H262";
export const OWNERS = [
  { id: "raju", x: 878, y: 186, n: "01" },
  { id: "gurpreet", x: 800, y: 28, n: "02" },
  { id: "anwar", x: 640, y: 260, n: "03" },
  { id: "check", x: 520, y: 450, n: "04" },
] as const;

function Dim({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const nx = Math.cos(a + Math.PI / 2) * 6;
  const ny = Math.sin(a + Math.PI / 2) * 6;
  let deg = (a * 180) / Math.PI;
  if (deg > 90 || deg < -90) deg += 180;
  const mx = (x1 + x2) / 2 - nx * 1.6;
  const my = (y1 + y2) / 2 - ny * 1.6;
  return (
    <g data-dim>
      <path
        d={`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}M${f(x1 - nx)} ${f(y1 - ny)}L${f(x1 + nx)} ${f(y1 + ny)}M${f(x2 - nx)} ${f(y2 - ny)}L${f(x2 + nx)} ${f(y2 + ny)}`}
        stroke={INK}
        strokeWidth=".8"
      />
      <text
        x={f(mx)}
        y={f(my)}
        transform={`rotate(${f(deg)} ${f(mx)} ${f(my)})`}
        textAnchor="middle"
        className="svg-mono"
        fontSize="10.5"
        fill={INK}
        style={{ paintOrder: "stroke", stroke: "var(--paper)", strokeWidth: 4 }}
      >
        {label}
      </text>
    </g>
  );
}

export function RouteMap({ id = "route" }: { id?: string }) {
  const towns: [number, number, string, "l" | "r"][] = [
    [878, 186, "OKHLA", "r"],
    [800, 28, "KUNDLI", "r"],
    [640, 260, "GURUGRAM", "r"],
    [640, 330, "MANESAR", "r"],
    [520, 450, "NEEMRANA", "r"],
    [440, 450, "BEHROR", "l"],
    [370, 520, "KOTPUTLI", "r"],
    [300, 590, "SHAHPURA", "r"],
  ];
  return (
    <svg viewBox="0 0 1000 720" role="img" aria-label="Map of the Okhla to Jaipur lane on NH 48 with truck owners marked">
      <Patterns id={id} />
      <rect x="0" y="0" width="1000" height="720" fill={`url(#${id}-grid)`} />

      {/* Delhi: ring road and city grid */}
      <g stroke={INK} strokeWidth="9" fill="none" strokeLinecap="square" data-wall>
        <path d="M700 64V200H780M806 200H900V128M900 104V64H820M792 64H700" />
        <path d="M150 560H262V700M262 700H90V600M90 578V560H124" />
      </g>
      <path d={ROUTE} stroke={INK} strokeWidth="11" fill="none" strokeLinejoin="miter" data-wall data-route />
      <g stroke={INK} strokeWidth="4.5" fill="none" data-street>
        <path d="M760 64V200M840 64V112M840 140V200M700 120H760M790 120H900M700 160H840" />
        <path d="M150 560V616M90 630H262M224 560V616" />
        <path d="M800 64V20M900 160H990M640 330H560M530 330H420M520 450L560 560V680M90 640H10M262 640H330" />
      </g>
      <g stroke={INK} strokeWidth="1" fill="none" strokeDasharray="5 4" data-faint>
        <path d="M716 80H884V184H716ZM106 576H246V684H106Z" />
        <path d="M714 214L654 274V336L534 456H446L306 596" strokeOpacity=".6" />
      </g>

      {/* Dimensions */}
      <g data-dims>
        <Dim x1={262} y1={712} x2={878} y2={712} label="OKHLA TO JAIPUR, 268 KM" />
        <Dim x1={36} y1={200} x2={36} y2={590} label="NH 48" />
        <Dim x1={666} y1={262} x2={666} y2={330} label="38 KM" />
        <Dim x1={548} y1={470} x2={472} y2={470} label="22 KM" />
        <Dim x1={420} y1={490} x2={324} y2={586} label="118 KM" />
        <Dim x1={612} y1={348} x2={538} y2={422} label="54 KM" />
      </g>

      {/* Towns */}
      <g data-labels>
        {towns.map(([x, y, name, side]) => (
          <g key={name}>
            <rect x={x - 4} y={y - 4} width="8" height="8" fill="var(--paper)" stroke={INK} strokeWidth="1.2" />
            <text
              x={side === "r" ? x + 12 : x - 12}
              y={y + 4}
              textAnchor={side === "r" ? "start" : "end"}
              className="svg-mono"
              fontSize="11"
              fill={INK}
              style={{ paintOrder: "stroke", stroke: "var(--paper)", strokeWidth: 4 }}
            >
              {name}
            </text>
          </g>
        ))}
        <text x="176" y="676" textAnchor="middle" className="svg-sans" fontWeight="600" fontSize="22" letterSpacing="-0.5" fill={INK}>
          JAIPUR
        </text>
        <text x="790" y="148" textAnchor="middle" className="svg-sans" fontWeight="600" fontSize="22" letterSpacing="-0.5" fill={INK}>
          DELHI
        </text>
      </g>

      {/* Owners Bhaada called */}
      <g data-owners>
        {OWNERS.map((o) => (
          <g key={o.id} data-owner={o.id}>
            <path d={`M${o.x} ${o.y - 46}V${o.y - 16}M${o.x - 5} ${o.y - 22}L${o.x} ${o.y - 14}L${o.x + 5} ${o.y - 22}`} stroke={BRAND} strokeWidth="1.4" fill="none" />
            <rect x={o.x - 11} y={o.y - 11} width="22" height="22" fill={BRAND} />
            <text x={o.x} y={o.y + 4} textAnchor="middle" className="svg-mono" fontSize="10" fill="#fff">
              {o.n}
            </text>
          </g>
        ))}
      </g>
      <rect x="-8" y="-8" width="16" height="16" fill={BRAND} stroke="var(--paper)" strokeWidth="3" data-truck opacity="0" />
    </svg>
  );
}

// Isometric wireframes for the problem cards.
const C30 = Math.cos(Math.PI / 6);
function iso(ox: number, oy: number) {
  const p = (x: number, y: number, z: number) => `${f(ox + (x - y) * C30)} ${f(oy + (x + y) * 0.5 - z)}`;
  const poly = (pts: [number, number, number][], close = true) => `M${pts.map((q) => p(...q)).join("L")}${close ? "Z" : ""}`;
  const box = (x: number, y: number, z: number, w: number, d: number, h: number) => ({
    solid:
      poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]) +
      poly([[x + w, y, z + h], [x + w, y, z], [x + w, y + d, z], [x, y + d, z], [x, y + d, z + h]], false) +
      poly([[x + w, y + d, z], [x + w, y + d, z + h]], false),
    hidden: poly([[x, y, z], [x + w, y, z]], false) + poly([[x, y, z], [x, y + d, z]], false) + poly([[x, y, z], [x, y, z + h]], false),
  });
  const ring = (cx: number, cy: number, z: number, r: number) =>
    poly(Array.from({ length: 48 }, (_, i) => [cx + Math.cos((i / 48) * Math.PI * 2) * r, cy + Math.sin((i / 48) * Math.PI * 2) * r, z] as [number, number, number]));
  return { p, poly, box, ring };
}

function IsoFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 240 200" aria-hidden fill="none" stroke={INK} strokeWidth="1" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function IsoPhone() {
  const g = iso(120, 135);
  const b = g.box(-15, -6, 0, 30, 12, 104);
  const keys = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) keys.push(g.poly([[-10 + c * 8, 6, 12 + r * 9], [-5 + c * 8, 6, 12 + r * 9], [-5 + c * 8, 6, 17 + r * 9], [-10 + c * 8, 6, 17 + r * 9]]));
  return (
    <IsoFrame>
      <path d={g.poly([[-50, -50, 0], [50, -50, 0], [50, 50, 0], [-50, 50, 0]])} strokeDasharray="3 3" strokeOpacity=".5" />
      <path d={b.hidden} strokeDasharray="3 3" strokeOpacity=".6" />
      <path d={b.solid} />
      <path d={g.poly([[-11, 6, 56], [11, 6, 56], [11, 6, 94], [-11, 6, 94]])} />
      <path d={keys.join("")} strokeWidth=".8" />
      <path d={g.poly([[-5, 6, 99], [5, 6, 99]], false)} />
      <path d={g.poly([[9, 0, 104], [9, 0, 124]], false)} strokeWidth="1.6" />
    </IsoFrame>
  );
}

export function IsoChats() {
  const g = iso(116.5, 135.5);
  const slabs = [0, 30, 60].map((z, i) => {
    const x = -40 + (i % 2) * 10;
    const b = g.box(x, -28, z, 74, 52, 6);
    const tail = g.poly([[x + 74, 14, z + 6], [x + 88, 22, z + 6], [x + 74, 22, z + 6]]);
    const text = [10, 22, 34].map((y) => g.poly([[x + 10, y - 28, z + 6], [x + (y === 34 ? 40 : 60), y - 28, z + 6]], false)).join("");
    return { b, tail, text };
  });
  return (
    <IsoFrame>
      {slabs.map((s, i) => (
        <g key={i}>
          <path d={s.b.hidden} strokeDasharray="3 3" strokeOpacity=".5" />
          <path d={s.b.solid} fill="var(--paper)" />
          <path d={s.tail} fill="var(--paper)" />
          <path d={s.text} strokeWidth=".8" />
        </g>
      ))}
    </IsoFrame>
  );
}

export function IsoRadar() {
  const g = iso(120, 127);
  const b = g.box(-36, -14, 0, 72, 28, 28);
  const ribs = Array.from({ length: 8 }, (_, i) => g.poly([[-30 + i * 8.5, 14, 3], [-30 + i * 8.5, 14, 25]], false)).join("");
  return (
    <IsoFrame>
      <path d={g.ring(0, 0, 0, 62)} strokeDasharray="3 3" strokeOpacity=".55" />
      <path d={g.ring(0, 0, 0, 44)} strokeDasharray="3 3" strokeOpacity=".35" />
      <path d={b.hidden} strokeDasharray="3 3" strokeOpacity=".6" />
      <path d={b.solid} />
      <path d={ribs} strokeWidth=".8" />
      <path d={g.poly([[0, 0, 28], [0, 0, 86]], false)} strokeDasharray="2 3" />
      <path d={g.ring(0, 0, 86, 7)} />
      <path d={g.ring(0, 0, 86, 16)} strokeOpacity=".4" />
    </IsoFrame>
  );
}

export function IsoEmpty() {
  const g = iso(120, 106);
  const w = 84;
  const d = 40;
  const h = 34;
  const t = 4;
  return (
    <IsoFrame>
      <path d={g.poly([[-60, -46, 0], [60, -46, 0], [60, 46, 0], [-60, 46, 0]])} strokeDasharray="3 3" strokeOpacity=".5" />
      <path d={g.poly([[-42, -20, 0], [-42, -20, h]], false) + g.poly([[-42, -20, 0], [w - 42, -20, 0]], false) + g.poly([[-42, -20, 0], [-42, d - 20, 0]], false)} strokeOpacity=".7" />
      <path d={g.poly([[-42 + t, -20 + t, h], [w - 42 - t, -20 + t, h], [w - 42 - t, d - 20 - t, h], [-42 + t, d - 20 - t, h]])} />
      <path d={g.poly([[-42, -20, h], [w - 42, -20, h], [w - 42, d - 20, h], [-42, d - 20, h]])} />
      <path d={g.poly([[w - 42, -20, h], [w - 42, -20, 0], [w - 42, d - 20, 0], [-42, d - 20, 0], [-42, d - 20, h]], false) + g.poly([[w - 42, d - 20, 0], [w - 42, d - 20, h]], false)} />
      <path d={Array.from({ length: 9 }, (_, i) => g.poly([[-36 + i * 9, d - 20, 4], [-36 + i * 9, d - 20, h - 4]], false)).join("")} strokeWidth=".8" />
    </IsoFrame>
  );
}

export function LogoMark({ size = 30 }: { size?: number }) {
  const g = iso(16, 9);
  const b = g.box(-9, -5, 0, 20, 10, 12);
  const ribs = [0, 1, 2, 3].map((i) => g.poly([[-6 + i * 4.5, 5, 2], [-6 + i * 4.5, 5, 10]], false)).join("");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden>
      <g transform="translate(0 10)">
        <path d={b.solid} />
        <path d={ribs} strokeWidth="1" />
      </g>
    </svg>
  );
}
