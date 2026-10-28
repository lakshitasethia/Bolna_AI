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
  glyphCore: "#ffd9fb",
  petal: "#4b2370",
};

const color = (hex: string) => new THREE.Color(hex);

// Height of the terrain: a grassy bank in front of the camera, a lake in the
// middle, and rolling hills behind it.
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
  uniform vec3 uMouse;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uCore;
  attribute vec4 aRand;
  attribute float aKind;
  attribute vec3 aScatter;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = mix(aScatter, position, uReveal);
    float t = uTime * 0.7 + aRand.x * 6.2831;
    float jitter = 0.05 + aKind * 0.25;
    p += vec3(sin(t), cos(t * 1.3), sin(t * 0.7)) * jitter * (1.0 + uLevel * 5.0);
    p += normalize(p + 0.0001) * uLevel * (0.6 + aRand.z) * 0.9;
    if (aKind > 0.5) p.y += mod(uTime * 0.25 * (0.3 + aRand.y) + aRand.x * 8.0, 8.0) - 4.0;

    vec3 d = p - uMouse;
    float f = smoothstep(2.2, 0.0, length(d.xy));
    p += normalize(d + vec3(0.0001)) * f * 1.4 * (0.4 + aRand.w);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float twinkle = 0.55 + 0.45 * sin(uTime * (2.0 + aRand.y * 4.0) + aRand.x * 40.0);
    gl_PointSize = uSize * (0.35 + aRand.z) * (0.75 + twinkle * 0.5) * uPixelRatio / -mv.z;
    gl_PointSize *= 1.0 + uLevel * 0.8;

    float core = smoothstep(4.5, 0.0, length(position.xy));
    vColor = mix(mix(uColorA, uColorB, aRand.y * aRand.y), uCore, core * core * 0.55 * (1.0 - aKind));
    vColor = mix(vColor, uCore, step(0.9, aRand.w) * 0.85);
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

function sampleHandset(count: number, width: number) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(size * 0.06, size * 0.06);
  ctx.scale((size * 0.88) / 24, (size * 0.88) / 24);
  ctx.fill(new Path2D(HANDSET_PATH));
  const data = ctx.getImageData(0, 0, size, size).data;
  const filled: number[] = [];
  for (let i = 0; i < size * size; i++) if (data[i * 4 + 3] > 128) filled.push(i);

  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const idx = filled[Math.floor(Math.random() * filled.length)];
    const px = (idx % size) + Math.random();
    const py = Math.floor(idx / size) + Math.random();
    out[i * 3] = (px / size - 0.5) * width;
    out[i * 3 + 1] = -(py / size - 0.5) * width;
    out[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
  }
  return out;
}

export class RukoScene {
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
  private glyphPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 20);
  private level = 0;
  private targetLevel = 0;
  private introStart = -1;
  private disposed = false;
  private isMobile: boolean;

  constructor(private canvas: HTMLCanvasElement) {
    this.isMobile = window.innerWidth < 768;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    this.camera = new THREE.PerspectiveCamera(this.isMobile ? 60 : 42, window.innerWidth / window.innerHeight, 0.1, 600);
    this.camera.position.set(0, 3.2, 16);

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

  /** 0..1 loudness of Ruko's voice; drives the particle sculpture. */
  setVoiceLevel(level: number) {
    this.targetLevel = THREE.MathUtils.clamp(level, 0, 1);
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
    const positions = new Float32Array(total * 3);
    positions.set(sampleHandset(shapeCount, width));
    for (let i = shapeCount; i < total; i++) {
      const r = width * (0.35 + Math.random() * 0.45);
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * width * 0.9;
      positions[i * 3 + 2] = Math.sin(a) * r * 0.4;
    }
    const scatter = new Float32Array(total * 3);
    for (let i = 0; i < total; i++) {
      const dir = new THREE.Vector3().randomDirection().multiplyScalar(14 + Math.random() * 20);
      scatter.set([dir.x, dir.y + 8, dir.z], i * 3);
    }
    const rand = new Float32Array(total * 4).map(() => Math.random());
    const kind = new Float32Array(total).map((_, i) => (i < shapeCount ? 0 : 1));

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
    geo.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));

    this.glyphMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: this.isMobile ? 55 : 72 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uLevel: { value: 0 },
        uReveal: { value: 0 },
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
      blending: THREE.NormalBlending,
    });
    this.glyph = new THREE.Points(geo, this.glyphMaterial);
    this.glyph.position.set(0, this.isMobile ? 7.5 : 7.2, -20);
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
    if (this.disposed) return;
    const t = this.clock.getElapsedTime();

    this.skyMaterial.uniforms.uTime.value = t;
    this.grassMaterial.uniforms.uTime.value = t;
    this.petalMaterial.uniforms.uTime.value = t;
    this.glyphMaterial.uniforms.uTime.value = t;
    (this.water.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

    // Camera: fly-in after "enter", then gentle parallax that follows the pointer.
    const intro = this.introStart < 0 ? 0 : THREE.MathUtils.clamp((t - this.introStart) / 3.2, 0, 1);
    const ease = 1 - Math.pow(1 - intro, 3);
    this.pointerSmooth.lerp(this.pointer.x > 5 ? new THREE.Vector2() : this.pointer, 0.04);
    const camZ = THREE.MathUtils.lerp(16, 10, ease);
    const camY = THREE.MathUtils.lerp(3.6, 2.3, ease);
    this.camera.position.set(this.pointerSmooth.x * 0.7, camY + this.pointerSmooth.y * 0.3, camZ);
    this.camera.lookAt(this.pointerSmooth.x * 0.3, 3.6, -20);

    // Particles assemble into the handset as the experience opens.
    const reveal = this.glyphMaterial.uniforms.uReveal;
    reveal.value += ((this.introStart < 0 ? 0.0 : 1.0) - reveal.value) * 0.025;

    this.level += (this.targetLevel - this.level) * 0.18;
    this.glyphMaterial.uniforms.uLevel.value = this.level;
    this.glyph.rotation.y = Math.sin(t * 0.35) * 0.55;
    this.glyph.rotation.z = Math.sin(t * 0.22) * 0.06;
    this.glyph.position.y += (7.2 + Math.sin(t * 0.8) * 0.18 - this.glyph.position.y) * 0.05;

    // Pointer pushes particles away.
    if (this.pointer.x < 5) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.glyphPlane, hit)) {
        this.glyph.worldToLocal(hit);
        this.mouseLocal.lerp(hit, 0.15);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };
}
