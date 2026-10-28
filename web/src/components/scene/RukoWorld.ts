import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

// Material Design "call" icon (Apache 2.0), 24x24 viewBox.
const HANDSET_PATH =
  "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z";

const PALETTE = {
  skyTop: "#9481e3",
  skyMid: "#b8a5ef",
  horizon: "#e6d0f5",
  cloud: "#f6cdef",
  fog: "#cdb8f0",
  ground: "#3a1264",
  grassBase: "#24084a",
  grassTip: "#8a3cd8",
  grassTip2: "#c56cff",
  rock: "#8c7aa8",
  water: "#b49cec",
  glyphA: "#ff3fd8",
  glyphB: "#7a1cff",
  glyphCore: "#ffe3fc",
  petal: "#4b2370",
};

type Vec3 = [number, number, number];
type Stop = { cam: Vec3; look: Vec3; glyph: Vec3; scale: number };

/**
 * Camera stops along the scroll journey. Stop i pairs with text panel i;
 * the last stop flies the camera through the particle ring.
 */
const STOPS: Stop[] = [
  { cam: [0, 2.3, 10], look: [0, 3.6, -20], glyph: [0, 7.2, -20], scale: 1 },
  { cam: [-3, 3.2, 3], look: [3, 4.6, -20], glyph: [6.5, 6.6, -17], scale: 0.85 },
  { cam: [2, 1.6, -3], look: [-1.5, 6.4, -24], glyph: [-3.2, 8.8, -21], scale: 1.15 },
  { cam: [-5, 2.4, -1], look: [-5, 4.2, -24], glyph: [-10.8, 6.8, -21], scale: 0.95 },
  { cam: [0, 2.1, 5], look: [0, 4.9, -20], glyph: [0, 7.4, -18], scale: 1.05 },
  { cam: [0, 7.4, -17.6], look: [0, 7.4, -40], glyph: [0, 7.4, -18], scale: 1.25 },
];
export const STAGE_COUNT = STOPS.length - 1;

const color = (hex: string) => new THREE.Color(hex);

function terrainHeight(x: number, z: number) {
  const n = Math.sin(x * 0.35) * 0.18 + Math.sin(x * 0.11 + z * 0.3) * 0.25;
  if (z > 1.2) return THREE.MathUtils.smoothstep(z, 1.2, 2.6) * 0.35 + n * 0.3 - 0.25;
  if (z < -22) {
    const rise = THREE.MathUtils.smoothstep(-z, 22, 30);
    return rise * (1.1 + n * 2.2 + Math.sin(x * 0.07) * 1.4) - 0.6 * (1 - rise);
  }
  return -0.6;
}

const GRASS_VERT = /* glsl */ `
  uniform float uTime;
  varying float vH;
  varying float vVar;
  #include <common>
  #include <fog_pars_vertex>
  void main() {
    vec3 pos = position;
    float h = uv.y;
    pos.x *= (1.0 - h * 0.9);
    vec3 root = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    float variation = fract(sin(dot(root.xz, vec2(12.9898, 78.233))) * 43758.5453);
    float wind = sin(uTime * 1.1 + root.x * 0.32 + root.z * 0.18) * 0.6
               + sin(uTime * 2.4 + root.x * 1.3 + variation * 6.28) * 0.25;
    vec4 world = instanceMatrix * vec4(pos, 1.0);
    world.x += wind * h * h * 0.38;
    world.z += wind * h * h * 0.12;
    vec4 mvPosition = modelViewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    vH = h;
    vVar = variation;
    #include <fog_vertex>
  }
`;

const GRASS_FRAG = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uTip;
  uniform vec3 uTip2;
  varying float vH;
  varying float vVar;
  #include <common>
  #include <fog_pars_fragment>
  void main() {
    vec3 tip = mix(uTip, uTip2, vVar);
    vec3 col = mix(uBase, tip, smoothstep(0.0, 1.0, vH));
    col *= 0.8 + vVar * 0.4;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uCloud;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  #include <common>
  void main() {
    float y = clamp(vDir.y, -1.0, 1.0);
    vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.18, y));
    col = mix(col, uTop, smoothstep(0.18, 0.7, y));
    vec2 cp = vDir.xz / max(vDir.y + 0.25, 0.05) * 1.4 + vec2(uTime * 0.012, uTime * 0.004);
    float clouds = smoothstep(0.52, 0.85, fbm(cp));
    clouds *= smoothstep(0.02, 0.3, y);
    col = mix(col, uCloud, clouds * 0.55);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const GLYPH_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uLevel;
  uniform float uReveal;
  uniform float uMorph;
  uniform vec3 uMouse;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uCore;
  attribute vec3 aShape1;
  attribute vec3 aShape2;
  attribute vec3 aShape3;
  attribute vec3 aShape4;
  attribute vec3 aScatter;
  attribute vec4 aRand;
  attribute float aKind;
  varying vec3 vColor;
  varying float vAlpha;

  vec3 shapeAt(float i) {
    if (i < 0.5) return position;
    if (i < 1.5) return aShape1;
    if (i < 2.5) return aShape2;
    if (i < 3.5) return aShape3;
    return aShape4;
  }

  void main() {
    float k = floor(uMorph);
    float f = uMorph - k;
    float blend = smoothstep(0.0, 1.0, f);
    vec3 shape = mix(shapeAt(k), shapeAt(min(k + 1.0, 4.0)), blend);

    // Particles swirl outwards while travelling between shapes.
    float travel = sin(f * 3.14159);
    shape += vec3(sin(aRand.x * 31.0 + uTime), cos(aRand.y * 27.0 + uTime * 0.8), sin(aRand.z * 19.0)) * travel * 2.2;

    vec3 p = mix(aScatter, shape, uReveal);
    float t = uTime * 0.7 + aRand.x * 6.2831;
    float jitter = 0.05 + aKind * 0.25;
    p += vec3(sin(t), cos(t * 1.3), sin(t * 0.7)) * jitter * (1.0 + uLevel * 5.0);
    p += normalize(p + 0.0001) * uLevel * (0.6 + aRand.z) * 0.9;
    if (aKind > 0.5) p.y += mod(uTime * 0.25 * (0.3 + aRand.y) + aRand.x * 8.0, 8.0) - 4.0;

    // Cursor: particles near the pointer burst outwards and glow white-hot.
    vec3 d = p - uMouse;
    float hover = smoothstep(2.8, 0.0, length(d.xy));
    float swirl = aRand.w * 6.2831 + uTime * 2.0;
    p += normalize(d + vec3(0.0001)) * hover * 1.6 * (0.4 + aRand.w);
    p.z += hover * sin(swirl) * 1.2;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float twinkle = 0.55 + 0.45 * sin(uTime * (2.0 + aRand.y * 4.0) + aRand.x * 40.0);
    gl_PointSize = uSize * (0.35 + aRand.z) * (0.75 + twinkle * 0.5) * uPixelRatio / -mv.z;
    gl_PointSize *= (1.0 + uLevel * 0.8) * (1.0 + hover * 0.9);

    float core = smoothstep(4.5, 0.0, length(shape.xy));
    vColor = mix(mix(uColorA, uColorB, aRand.y * aRand.y), uCore, core * core * 0.55 * (1.0 - aKind));
    vColor = mix(vColor, uCore, step(0.9, aRand.w) * 0.85);
    vColor = mix(vColor, vec3(1.0), hover * 0.75);
    vAlpha = twinkle * mix(1.0, 0.35, aKind);
  }
`;

const GLYPH_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  #include <common>
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vColor, a * vAlpha * uOpacity * 0.9);
    #include <colorspace_fragment>
  }
`;

const PETAL_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute vec4 aRand;
  varying float vRot;
  void main() {
    vec3 p = position;
    float fall = mod(p.y - uTime * (0.35 + aRand.x * 0.4), 16.0);
    p.y = fall - 1.0;
    p.x += sin(uTime * 0.6 + aRand.y * 6.28) * 1.2 + uTime * 0.25;
    p.x = mod(p.x + 30.0, 60.0) - 30.0;
    p.z += cos(uTime * 0.4 + aRand.z * 6.28) * 0.8;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (14.0 + aRand.w * 18.0) * uPixelRatio / -mv.z;
    vRot = uTime * (0.5 + aRand.x) + aRand.y * 6.28;
  }
`;

const PETAL_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vRot;
  #include <common>
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float s = sin(vRot), co = cos(vRot);
    c = mat2(co, -s, s, co) * c;
    c.x *= 2.2;
    float a = smoothstep(0.5, 0.35, length(c));
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a * 0.75);
    #include <colorspace_fragment>
  }
`;

const WATER_SHADER = {
  name: "RukoWater",
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
    uTint: { value: color(PALETTE.water) },
    uFogColor: { value: color(PALETTE.fog) },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec3 uTint;
    uniform vec3 uFogColor;
    varying vec4 vUv;
    varying vec3 vWorld;
    #include <common>
    void main() {
      vec4 uv = vUv;
      float w = sin(vWorld.x * 0.35 + uTime * 0.6) * 0.5
              + sin(vWorld.z * 0.9 - uTime * 0.9 + vWorld.x * 0.15) * 0.5;
      uv.xy += w * 0.0022 * uv.w;
      vec3 base = texture2DProj(tDiffuse, uv).rgb;
      vec3 col = mix(base, uTint, 0.3);
      float dist = length(vWorld - cameraPosition);
      col = mix(col, uFogColor, smoothstep(25.0, 110.0, dist));
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

/** Samples points from anything drawn in black on a 256px canvas. */
function sampleDrawing(count: number, width: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const filled: number[] = [];
  for (let i = 0; i < size * size; i++) if (data[i * 4 + 3] > 128) filled.push(i);

  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const idx = filled[Math.floor(Math.random() * filled.length)];
    out[i * 3] = ((idx % size) + Math.random()) / size - 0.5;
    out[i * 3 + 1] = -((Math.floor(idx / size) + Math.random()) / size - 0.5);
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
  }
  for (let i = 0; i < out.length; i++) out[i] *= width;
  return out;
}

const drawHandset = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.translate(size * 0.06, size * 0.06);
  ctx.scale((size * 0.88) / 24, (size * 0.88) / 24);
  ctx.fill(new Path2D(HANDSET_PATH));
};

const drawRupee = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.font = `700 ${size * 0.95}px "Inter Tight", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("₹", size / 2, size * 0.54);
};

const drawHeart = (ctx: CanvasRenderingContext2D, size: number) => {
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    ctx.lineTo(size / 2 + x * size * 0.028, size * 0.47 - y * size * 0.028);
  }
  ctx.fill();
};

function sampleCloud(count: number, radius: number) {
  const out = new Float32Array(count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    v.randomDirection().multiplyScalar(radius * Math.cbrt(Math.random()));
    v.y *= 0.85;
    out.set([v.x, v.y, v.z], i * 3);
  }
  return out;
}

function sampleRing(count: number, radius: number, tube: number) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const b = Math.random() * Math.PI * 2;
    const r = tube * Math.sqrt(Math.random());
    out.set([(radius + r * Math.cos(b)) * Math.cos(a), (radius + r * Math.cos(b)) * Math.sin(a), r * Math.sin(b)], i * 3);
  }
  return out;
}

const lerp3 = (a: Vec3, b: Vec3, t: number, out: THREE.Vector3) =>
  out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);

export class RukoWorld {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private glyph!: THREE.Points;
  private glyphMaterial!: THREE.ShaderMaterial;
  private grassMaterial!: THREE.ShaderMaterial;
  private skyMaterial!: THREE.ShaderMaterial;
  private petalMaterial!: THREE.ShaderMaterial;
  private water!: Reflector;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(10, 10);
  private pointerSmooth = new THREE.Vector2(0, 0);
  private mouseLocal = new THREE.Vector3(100, 100, 0);
  private hoverPlane = new THREE.Plane();
  private level = 0;
  private targetLevel = 0;
  private stage = 0;
  private targetStage = 0;
  private introStart = -1;
  private active = true;
  private disposed = false;
  private isMobile: boolean;
  private baseSize: number;
  private tmp = {
    cam: new THREE.Vector3(),
    look: new THREE.Vector3(),
    glyph: new THREE.Vector3(),
    camB: new THREE.Vector3(),
    glyphB: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    hit: new THREE.Vector3(),
  };

  constructor(canvas: HTMLCanvasElement) {
    this.isMobile = window.innerWidth < 768;
    this.baseSize = this.isMobile ? 55 : 72;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    this.camera = new THREE.PerspectiveCamera(this.isMobile ? 60 : 42, window.innerWidth / window.innerHeight, 0.1, 600);
    this.camera.position.set(0, 3.6, 16);

    this.scene.fog = new THREE.Fog(color(PALETTE.fog), 25, 120);

    this.buildSky();
    this.buildLights();
    this.buildTerrain();
    this.buildWater();
    this.buildRocks();
    this.buildGrass();
    this.buildGlyph();
    this.buildPetals();

    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointerMove);
    this.renderer.setAnimationLoop(this.tick);
  }

  /** Fly the camera into its resting position. */
  intro() {
    this.introStart = this.clock.getElapsedTime();
  }

  /** Scroll position along the journey, 0..STAGE_COUNT. */
  setStage(stage: number) {
    this.targetStage = THREE.MathUtils.clamp(stage, 0, STAGE_COUNT);
  }

  /** 0..1 loudness of Ruko's voice; drives the particle sculpture. */
  setVoiceLevel(level: number) {
    this.targetLevel = THREE.MathUtils.clamp(level, 0, 1);
  }

  /** Stop rendering while the 3D world is scrolled out of view. */
  setActive(active: boolean) {
    this.active = active;
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointerMove);
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.water.dispose();
    this.renderer.dispose();
  }

  private buildSky() {
    this.skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: color(PALETTE.skyTop) },
        uMid: { value: color(PALETTE.skyMid) },
        uHorizon: { value: color(PALETTE.horizon) },
        uCloud: { value: color(PALETTE.cloud) },
        uTime: { value: 0 },
      },
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), this.skyMaterial);
    sky.renderOrder = -1;
    this.scene.add(sky);
  }

  private buildLights() {
    this.scene.add(new THREE.HemisphereLight(color("#e4d6ff"), color("#3b1a5c"), 1.6));
    const sun = new THREE.DirectionalLight(color("#ffd6f4"), 1.4);
    sun.position.set(-20, 18, -30);
    this.scene.add(sun);
  }

  private buildTerrain() {
    const geo = new THREE.PlaneGeometry(260, 140, 180, 100);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, -50);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: color(PALETTE.ground), roughness: 1, flatShading: true }),
    );
    this.scene.add(ground);
  }

  private buildWater() {
    const size = new THREE.Vector2(window.innerWidth, window.innerHeight).multiplyScalar(0.5 * this.renderer.getPixelRatio());
    this.water = new Reflector(new THREE.PlaneGeometry(260, 30), {
      shader: WATER_SHADER,
      textureWidth: size.x,
      textureHeight: size.y,
      clipBias: 0.003,
    });
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.set(0, 0, -11);
    this.scene.add(this.water);
  }

  private buildRocks() {
    const material = new THREE.MeshStandardMaterial({ color: color(PALETTE.rock), roughness: 0.95, flatShading: true });
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const count = 46;
    const rocks = new THREE.InstancedMesh(geo, material, count);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      const x = (i / count - 0.5) * 150 + (Math.random() - 0.5) * 5;
      const z = -38 - Math.random() * 14;
      const h = 1.6 + Math.random() * 2.6 + (Math.abs(x) > 40 ? 1.6 : 0);
      const s = new THREE.Vector3(1.1 + Math.random() * 1.8, h, 1.2 + Math.random() * 1.5);
      q.setFromEuler(new THREE.Euler(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.25));
      m.compose(new THREE.Vector3(x, terrainHeight(x, z) + h * 0.3, z), q, s);
      rocks.setMatrixAt(i, m);
    }
    this.scene.add(rocks);
  }

  private buildGrass() {
    const blade = new THREE.PlaneGeometry(0.07, 1, 1, 4);
    blade.translate(0, 0.5, 0);
    this.grassMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uTime: { value: 0 },
          uBase: { value: color(PALETTE.grassBase) },
          uTip: { value: color(PALETTE.grassTip) },
          uTip2: { value: color(PALETTE.grassTip2) },
        },
      ]),
      vertexShader: GRASS_VERT,
      fragmentShader: GRASS_FRAG,
      side: THREE.DoubleSide,
      fog: true,
    });

    const scale = this.isMobile ? 0.45 : 1;
    const patches = [
      { count: Math.floor(30000 * scale), z: [3.2, 12], x: 16, height: [0.3, 0.75], width: [0.8, 1.5] },
      { count: Math.floor(26000 * scale), z: [-36, -23.5], x: 70, height: [0.7, 1.4], width: [1.6, 2.6] },
    ];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const yAxis = new THREE.Vector3(0, 1, 0);
    for (const p of patches) {
      const mesh = new THREE.InstancedMesh(blade, this.grassMaterial, p.count);
      for (let i = 0; i < p.count; i++) {
        const z = p.z[0] + Math.random() * (p.z[1] - p.z[0]);
        const spread = p.x + (z > 0 ? z * 0.9 : 0);
        const x = (Math.random() - 0.5) * 2 * spread;
        const h = p.height[0] + Math.random() * (p.height[1] - p.height[0]);
        const w = p.width[0] + Math.random() * (p.width[1] - p.width[0]);
        q.setFromAxisAngle(yAxis, Math.random() * Math.PI);
        m.compose(new THREE.Vector3(x, terrainHeight(x, z) - 0.05, z), q, new THREE.Vector3(w, h, 1));
        mesh.setMatrixAt(i, m);
      }
      mesh.frustumCulled = false;
      this.scene.add(mesh);
    }
  }

  private buildGlyph() {
    const width = this.isMobile ? 8.5 : 12;
    const shapeCount = this.isMobile ? 9000 : 16000;
    const haloCount = this.isMobile ? 1200 : 2600;
    const total = shapeCount + haloCount;

    const halo = new Float32Array(haloCount * 3);
    for (let i = 0; i < haloCount; i++) {
      const r = width * (0.35 + Math.random() * 0.45);
      const a = Math.random() * Math.PI * 2;
      halo.set([Math.cos(a) * r, (Math.random() - 0.5) * width * 0.9, Math.sin(a) * r * 0.4], i * 3);
    }
    const withHalo = (shape: Float32Array, depth = 0) => {
      const out = new Float32Array(total * 3);
      out.set(shape);
      if (depth) for (let i = 0; i < shapeCount; i++) out[i * 3 + 2] += (Math.random() - 0.5) * depth;
      out.set(halo, shapeCount * 3);
      return out;
    };

    const scatter = new Float32Array(total * 3);
    const dir = new THREE.Vector3();
    for (let i = 0; i < total; i++) {
      dir.randomDirection().multiplyScalar(14 + Math.random() * 20);
      scatter.set([dir.x, dir.y + 8, dir.z], i * 3);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(withHalo(sampleDrawing(shapeCount, width, drawHandset)), 3));
    geo.setAttribute("aShape1", new THREE.BufferAttribute(withHalo(sampleDrawing(shapeCount, width * 0.95, drawRupee)), 3));
    geo.setAttribute("aShape2", new THREE.BufferAttribute(withHalo(sampleCloud(shapeCount, width * 0.42)), 3));
    geo.setAttribute("aShape3", new THREE.BufferAttribute(withHalo(sampleDrawing(shapeCount, width, drawHeart)), 3));
    geo.setAttribute("aShape4", new THREE.BufferAttribute(withHalo(sampleRing(shapeCount, width * 0.38, width * 0.13)), 3));
    geo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(new Float32Array(total * 4).map(() => Math.random()), 4));
    geo.setAttribute("aKind", new THREE.BufferAttribute(new Float32Array(total).map((_, i) => (i < shapeCount ? 0 : 1)), 1));

    this.glyphMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: this.baseSize },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uLevel: { value: 0 },
        uReveal: { value: 0 },
        uMorph: { value: 0 },
        uOpacity: { value: 1 },
        uMouse: { value: this.mouseLocal },
        uColorA: { value: color(PALETTE.glyphA) },
        uColorB: { value: color(PALETTE.glyphB) },
        uCore: { value: color(PALETTE.glyphCore) },
      },
      vertexShader: GLYPH_VERT,
      fragmentShader: GLYPH_FRAG,
      transparent: true,
      depthWrite: false,
    });
    this.glyph = new THREE.Points(geo, this.glyphMaterial);
    this.glyph.position.set(...STOPS[0].glyph);
    this.glyph.frustumCulled = false;
    this.scene.add(this.glyph);
  }

  private buildPetals() {
    const count = this.isMobile ? 160 : 320;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions.set([(Math.random() - 0.5) * 60, Math.random() * 16, -30 + Math.random() * 40], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(new Float32Array(count * 4).map(() => Math.random()), 4));
    this.petalMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uColor: { value: color(PALETTE.petal) },
      },
      vertexShader: PETAL_VERT,
      fragmentShader: PETAL_FRAG,
      transparent: true,
      depthWrite: false,
    });
    const petals = new THREE.Points(geo, this.petalMaterial);
    petals.frustumCulled = false;
    this.scene.add(petals);
  }

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    const pr = this.renderer.getPixelRatio();
    this.water.getRenderTarget().setSize(w * 0.5 * pr, h * 0.5 * pr);
  };

  private onPointerMove = (e: PointerEvent) => {
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  };

  private tick = () => {
    if (this.disposed || !this.active) return;
    const t = this.clock.getElapsedTime();
    const { cam, look, glyph, camB, glyphB, dir, hit } = this.tmp;

    this.skyMaterial.uniforms.uTime.value = t;
    this.grassMaterial.uniforms.uTime.value = t;
    this.petalMaterial.uniforms.uTime.value = t;
    this.glyphMaterial.uniforms.uTime.value = t;
    (this.water.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

    // Scroll journey: ease between stops, holding still at the start of each.
    this.stage += (this.targetStage - this.stage) * 0.075;
    const k = Math.min(Math.floor(this.stage), STAGE_COUNT - 1);
    const travel = THREE.MathUtils.smoothstep(this.stage - k, 0.3, 1);
    const a = STOPS[k];
    const b = STOPS[k + 1];
    lerp3(a.cam, b.cam, travel, cam);
    lerp3(a.look, b.look, travel, look);
    lerp3(a.glyph, b.glyph, travel, glyph);
    const scale = THREE.MathUtils.lerp(a.scale, b.scale, travel);
    const finale = k === STAGE_COUNT - 1 ? travel : 0;

    // Intro: fly in from further back after "enter".
    const intro = this.introStart < 0 ? 0 : THREE.MathUtils.clamp((t - this.introStart) / 3.2, 0, 1);
    const ease = 1 - Math.pow(1 - intro, 3);
    lerp3([0, 3.6, 16], a.cam, ease, camB);
    if (k === 0 && intro < 1) cam.lerp(camB, 1 - travel);

    this.pointerSmooth.lerp(this.pointer.x > 5 ? new THREE.Vector2() : this.pointer, 0.04);
    const parallax = 1 - finale;
    this.camera.position.set(
      cam.x + this.pointerSmooth.x * 0.7 * parallax,
      cam.y + this.pointerSmooth.y * 0.3 * parallax,
      cam.z,
    );
    this.camera.lookAt(look.x + this.pointerSmooth.x * 0.3 * parallax, look.y, look.z);

    const reveal = this.glyphMaterial.uniforms.uReveal;
    reveal.value += ((this.introStart < 0 ? 0 : 1) - reveal.value) * 0.025;
    const morph = Math.min(k + travel, 4);
    this.glyphMaterial.uniforms.uMorph.value = morph;
    // Volumetric shapes (cloud, heart, ring) read better with bigger, bolder dots.
    this.glyphMaterial.uniforms.uSize.value = this.baseSize * (1 + 1.1 * THREE.MathUtils.smoothstep(morph, 1.3, 2));

    this.level += (this.targetLevel - this.level) * 0.18;
    this.glyphMaterial.uniforms.uLevel.value = this.level;
    glyphB.set(0, Math.sin(t * 0.8) * 0.18, 0);
    this.glyph.position.copy(glyph).add(glyphB);
    this.glyph.scale.setScalar(scale);
    this.glyph.rotation.y = Math.sin(t * 0.35) * 0.55 * (1 - finale);
    this.glyph.rotation.z = finale * t * 0.15 + Math.sin(t * 0.22) * 0.06;

    // Pointer: project onto a plane through the sculpture, facing the camera.
    if (this.pointer.x < 5) {
      this.camera.getWorldDirection(dir).negate();
      this.hoverPlane.setFromNormalAndCoplanarPoint(dir, this.glyph.position);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (this.raycaster.ray.intersectPlane(this.hoverPlane, hit)) {
        this.glyph.worldToLocal(hit);
        this.mouseLocal.lerp(hit, 0.15);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };
}
