"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════
   GLSL — Simplex 3D + Domain Warping + FBM
   ═══════════════════════════════════════════════════════════════ */
const NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Domain warping — warp coords through noise for organic flowing shapes
  float warpedNoise(vec3 p, float t) {
    vec3 q = vec3(
      snoise(p + vec3(0.0, 0.0, t * 0.12)),
      snoise(p + vec3(5.2, 1.3, t * 0.10)),
      snoise(p + vec3(1.7, 9.2, t * 0.08))
    );
    vec3 r = vec3(
      snoise(p + 4.0 * q + vec3(1.7, 9.2, t * 0.06)),
      snoise(p + 4.0 * q + vec3(8.3, 2.8, t * 0.07)),
      0.0
    );
    return snoise(p + 3.0 * r);
  }

  // FBM — layered noise octaves
  float fbm(vec3 p, float t) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p + t * 0.05 * float(i + 1));
      p = p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }
`;

/* ═══════════════════════════════════════════════════════════════
   LAYER 1: CHROME LIQUID — Domain-warped metallic surface
   ═══════════════════════════════════════════════════════════════ */
const chromeVertex = /* glsl */ `
  ${NOISE_GLSL}

  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScroll;

  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal2;
  varying float vMouseProximity;
  varying vec3 vWorldPos;
  varying float vWarp;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float t = uTime;

    // Domain warping for organic flow
    float warp1 = warpedNoise(vec3(pos.xy * 0.3, t * 0.04), t) * 0.7;
    float warp2 = warpedNoise(vec3(pos.xy * 0.8 + 50.0, t * 0.06), t) * 0.3;
    float detail = fbm(vec3(pos.xy * 1.5 + 100.0, t * 0.03), t) * 0.12;
    float elevation = warp1 + warp2 + detail;
    vWarp = warp1;

    // Mouse interaction — pressure dome + concentric ripples
    vec2 mWorld = uMouse * 4.0;
    float mDist = distance(pos.xy, mWorld);
    float dome = smoothstep(3.5, 0.0, mDist) * 0.4;
    float ripple = sin(mDist * 6.0 - uTime * 4.0) * smoothstep(5.0, 0.5, mDist) * 0.08;
    float ripple2 = sin(mDist * 12.0 - uTime * 6.0) * smoothstep(3.0, 0.3, mDist) * 0.03;
    elevation += dome + ripple + ripple2;
    vMouseProximity = smoothstep(3.5, 0.0, mDist);

    // Scroll — long wave
    float s = uScroll * 0.0006;
    elevation += sin(pos.x * 0.8 + s * 5.0) * 0.06;

    pos.z += elevation;
    vElevation = elevation;
    vWorldPos = pos;

    // Finite-difference normal (2 octaves for smoothness)
    float e = 0.02;
    float ex = warpedNoise(vec3((pos.x + e) * 0.3, pos.y * 0.3, t * 0.04), t) * 0.7
             + warpedNoise(vec3((pos.x + e) * 0.8 + 50.0, pos.y * 0.8 + 50.0, t * 0.06), t) * 0.3;
    float ey = warpedNoise(vec3(pos.x * 0.3, (pos.y + e) * 0.3, t * 0.04), t) * 0.7
             + warpedNoise(vec3(pos.x * 0.8 + 50.0, (pos.y + e) * 0.8 + 50.0, t * 0.06), t) * 0.3;
    float base = warp1 + warp2;
    vNormal2 = normalize(vec3(-(ex - base) / e, -(ey - base) / e, 1.0));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const chromeFragment = /* glsl */ `
  ${NOISE_GLSL}

  uniform float uTime;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHot;
  uniform vec3 uColorPeak;
  uniform float uOpacity;
  uniform float uIsDark;

  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal2;
  varying float vMouseProximity;
  varying vec3 vWorldPos;
  varying float vWarp;

  #define PI 3.141592653589793

  // GGX normal distribution for physically-based specular
  float D_GGX(float NdotH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;
    return a2 / (PI * d * d);
  }

  void main() {
    // Vignette
    float cDist = length(vUv - 0.5);
    float vignette = smoothstep(0.85, 0.05, cDist);

    // Temperature map from elevation
    float temp = smoothstep(-0.5, 0.8, vElevation);

    // 4-stop color gradient
    vec3 color = mix(uColorDeep, uColorMid, smoothstep(0.0, 0.25, temp));
    color = mix(color, uColorHot, smoothstep(0.3, 0.65, temp));
    color = mix(color, uColorPeak, smoothstep(0.75, 1.0, temp));

    // Iridescence — subtle oil-slick rainbow on peaks (dark mode only)
    float iridAngle = dot(vNormal2, vec3(0.0, 0.0, 1.0));
    vec3 iridescence = 0.5 + 0.5 * cos(6.283 * (iridAngle * 1.5 + vec3(0.0, 0.33, 0.67) + uTime * 0.02));
    color += iridescence * smoothstep(0.5, 0.9, temp) * 0.08 * uIsDark;

    // Fresnel — strong rim glow
    float fresnel = pow(1.0 - abs(iridAngle), 5.0);
    color += uColorHot * fresnel * 0.7;

    // GGX specular lights — automotive showroom
    vec3 viewDir = vec3(0.0, 0.0, 1.0);

    // Primary sweeping light (slow orbit)
    vec3 l1 = normalize(vec3(sin(uTime * 0.15) * 1.2, cos(uTime * 0.12) * 0.6, 1.0));
    vec3 h1 = normalize(l1 + viewDir);
    float spec1 = D_GGX(max(dot(vNormal2, h1), 0.0), 0.08);

    // Secondary fill light
    vec3 l2 = normalize(vec3(cos(uTime * 0.08) * 0.8, sin(uTime * 0.1) * 0.9, 0.8));
    vec3 h2 = normalize(l2 + viewDir);
    float spec2 = D_GGX(max(dot(vNormal2, h2), 0.0), 0.15);

    // Sharp highlight — razor-thin reflection like on a car body
    vec3 l3 = normalize(vec3(sin(uTime * 0.25 + 1.5), 0.3, 0.6));
    vec3 h3 = normalize(l3 + viewDir);
    float spec3 = D_GGX(max(dot(vNormal2, h3), 0.0), 0.03);

    // Anisotropic stretched highlight (car paint effect)
    vec3 l4 = normalize(vec3(0.0, sin(uTime * 0.08), 1.0));
    vec3 h4 = normalize(l4 + viewDir);
    float aniso = max(dot(vNormal2, h4), 0.0);
    float anisoSpec = pow(aniso, 256.0) * 0.6;

    color += uColorPeak * spec1 * 0.5;
    color += uColorHot * spec2 * 0.3;
    color += vec3(1.0) * spec3 * 0.25;
    color += vec3(1.0, 0.95, 0.9) * anisoSpec;

    // Mouse glow — bright center with falloff
    float mousePow = vMouseProximity * vMouseProximity;
    color += uColorHot * vMouseProximity * 0.5;
    color += uColorPeak * mousePow * 0.4;
    color += vec3(1.0) * mousePow * mousePow * 0.15; // white-hot center

    // Subsurface scattering approximation — red glow through peaks
    float sss = smoothstep(0.2, 0.8, temp) * (1.0 - fresnel) * 0.15;
    color += uColorHot * sss;

    // Heat veins — flowing through the surface
    float veins = warpedNoise(vec3(vUv * 8.0, uTime * 0.05), uTime * 0.5);
    float veinMask = smoothstep(0.2, 0.5, veins) * smoothstep(0.5, 0.2, veins) * 4.0;
    color += uColorHot * veinMask * 0.06;

    float alpha = vignette * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

function ChromeSurface() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const targetMouse = useRef(new THREE.Vector2(0, 0));
  const scrollRef = useRef(0);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uColorDeep: { value: new THREE.Color("#020101") },
      uColorMid: { value: new THREE.Color("#150404") },
      uColorHot: { value: new THREE.Color("#ef4444") },
      uColorPeak: { value: new THREE.Color("#ffa070") },
      uOpacity: { value: 0.6 },
      uIsDark: { value: 1.0 },
    }),
    [],
  );

  const handleMouse = useCallback(
    (e: MouseEvent) => {
      targetMouse.current.set(
        (e.clientX / size.width) * 2 - 1,
        -(e.clientY / size.height) * 2 + 1,
      );
    },
    [size],
  );

  const handleScroll = useCallback(() => {
    scrollRef.current = window.scrollY;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleMouse, handleScroll]);

  // Theme colors
  useEffect(() => {
    const update = () => {
      const dark = document.documentElement.classList.contains("dark");
      if (dark) {
        uniforms.uColorDeep.value.set("#010101");
        uniforms.uColorMid.value.set("#120303");
        uniforms.uColorHot.value.set("#ef4444");
        uniforms.uColorPeak.value.set("#ffaa77");
        uniforms.uOpacity.value = 0.7;
        uniforms.uIsDark.value = 1.0;
      } else {
        uniforms.uColorDeep.value.set("#f5f0ed");
        uniforms.uColorMid.value.set("#eeddd8");
        uniforms.uColorHot.value.set("#dc2626");
        uniforms.uColorPeak.value.set("#ff5555");
        uniforms.uOpacity.value = 0.18;
        uniforms.uIsDark.value = 0.0;
      }
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, [uniforms]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value += delta;
    mouseRef.current.lerp(targetMouse.current, 0.04);
    mat.uniforms.uMouse.value.copy(mouseRef.current);
    mat.uniforms.uScroll.value = scrollRef.current;
  });

  const aspect = size.width / size.height;
  const pw = 8 * Math.max(aspect, 1);
  const ph = 8 / Math.min(aspect, 1);

  return (
    <mesh ref={meshRef} rotation={[-0.25, 0, 0]} position={[0, 0.3, 0]}>
      <planeGeometry args={[pw, ph, 160, 160]} />
      <shaderMaterial
        vertexShader={chromeVertex}
        fragmentShader={chromeFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LAYER 2: FLOATING SHARDS — geometric debris with glow
   ═══════════════════════════════════════════════════════════════ */
const SHARD_COUNT = 120;

const shardVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aBrightness;
  attribute float aShape;

  uniform float uTime;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vBright;
  varying float vShape;

  void main() {
    vec3 pos = position;

    float t = uTime * 0.15 + aPhase;

    // Slow orbital drift
    pos.x += sin(t * 0.7 + pos.y * 0.3) * 0.3;
    pos.z += cos(t * 0.5 + pos.x * 0.2) * 0.2;
    pos.y += mod(uTime * (0.02 + aBrightness * 0.04) + aPhase * 10.0, 12.0) - 6.0;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPos.z);

    // Edge fade + twinkle
    float yNorm = (pos.y + 6.0) / 12.0;
    float edgeFade = smoothstep(0.0, 0.1, yNorm) * smoothstep(1.0, 0.88, yNorm);
    float twinkle = sin(uTime * 2.5 + aPhase * 30.0) * 0.3 + 0.7;

    vAlpha = edgeFade * twinkle * (0.15 + aBrightness * 0.85);
    vBright = aBrightness;
    vShape = aShape;
  }
`;

const shardFragment = /* glsl */ `
  uniform vec3 uEmberColor;
  uniform vec3 uEmberHot;

  varying float vAlpha;
  varying float vBright;
  varying float vShape;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float shape;
    if (vShape < 0.33) {
      // Diamond
      shape = 1.0 - (abs(c.x) + abs(c.y)) * 2.0;
    } else if (vShape < 0.66) {
      // Soft circle with hard core
      shape = smoothstep(0.5, 0.0, d);
    } else {
      // Cross/star
      float cross = min(abs(c.x), abs(c.y));
      shape = smoothstep(0.12, 0.0, cross) * smoothstep(0.5, 0.1, d);
    }
    shape = max(shape, 0.0);

    // Glow halo
    float halo = smoothstep(0.5, 0.15, d) * 0.4;
    float glow = shape + halo;

    vec3 color = mix(uEmberColor, uEmberHot, vBright * shape);
    // White-hot core for brightest particles
    color = mix(color, vec3(1.0, 0.98, 0.95), step(0.85, vBright) * shape * shape);

    gl_FragColor = vec4(color, glow * vAlpha);
  }
`;

function FloatingShards() {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(SHARD_COUNT * 3);
    const sizes = new Float32Array(SHARD_COUNT);
    const phases = new Float32Array(SHARD_COUNT);
    const brightness = new Float32Array(SHARD_COUNT);
    const shapes = new Float32Array(SHARD_COUNT);

    for (let i = 0; i < SHARD_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = Math.random() * 5 - 2;
      sizes[i] = Math.random() * 6 + 1.5;
      phases[i] = Math.random() * Math.PI * 2;
      brightness[i] = Math.random() ** 2.5; // power curve — few very bright
      shapes[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
    geo.setAttribute("aShape", new THREE.BufferAttribute(shapes, 1));

    const uni = {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
      uEmberColor: { value: new THREE.Color("#ee3311") },
      uEmberHot: { value: new THREE.Color("#ffcc88") },
    };

    return { geometry: geo, uniforms: uni };
  }, []);

  useEffect(() => {
    const update = () => {
      const dark = document.documentElement.classList.contains("dark");
      if (dark) {
        uniforms.uEmberColor.value.set("#dd2200");
        uniforms.uEmberHot.value.set("#ffbb66");
      } else {
        uniforms.uEmberColor.value.set("#cc2222");
        uniforms.uEmberHot.value.set("#ff7777");
      }
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, [uniforms]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value += delta;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={shardVertex}
        fragmentShader={shardFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LAYER 3: LIGHT SWEEPS — cinematic light streaks
   ═══════════════════════════════════════════════════════════════ */
const sweepVertex = /* glsl */ `
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aWidth;
  attribute float aY;

  uniform float uTime;

  varying float vAlpha;
  varying float vProgress;

  void main() {
    vec3 pos = position;

    // Sweep across screen — different speeds
    float cycle = mod(uTime * aSpeed + aPhase, 3.0) - 1.5;
    pos.x = cycle * 10.0;
    pos.y = aY;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aWidth * (200.0 / -mvPos.z);

    // Comet-like fade: bright head, long tail
    float progress = (cycle + 1.5) / 3.0;
    vProgress = progress;
    float headBright = smoothstep(0.0, 0.05, progress) * smoothstep(1.0, 0.7, progress);
    vAlpha = headBright * 0.25;
  }
`;

const sweepFragment = /* glsl */ `
  uniform vec3 uSweepColor;
  varying float vAlpha;
  varying float vProgress;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    // Horizontally stretched ellipse
    float d = length(vec2(c.x * 0.2, c.y * 2.5));
    if (d > 0.5) discard;

    float glow = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.15, 0.0, d);

    vec3 color = uSweepColor;
    color += vec3(1.0, 0.98, 0.95) * core * 0.5;

    gl_FragColor = vec4(color, glow * vAlpha);
  }
`;

const SWEEP_COUNT = 30;

function LightSweeps() {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(SWEEP_COUNT * 3);
    const phases = new Float32Array(SWEEP_COUNT);
    const speeds = new Float32Array(SWEEP_COUNT);
    const widths = new Float32Array(SWEEP_COUNT);
    const ys = new Float32Array(SWEEP_COUNT);

    for (let i = 0; i < SWEEP_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.random() * 2 - 0.5;
      phases[i] = Math.random() * 3;
      speeds[i] = 0.06 + Math.random() * 0.1;
      widths[i] = 4 + Math.random() * 12;
      ys[i] = (Math.random() - 0.5) * 7;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute("aWidth", new THREE.BufferAttribute(widths, 1));
    geo.setAttribute("aY", new THREE.BufferAttribute(ys, 1));

    const uni = {
      uTime: { value: 0 },
      uSweepColor: { value: new THREE.Color("#ff4422") },
    };

    return { geometry: geo, uniforms: uni };
  }, []);

  useEffect(() => {
    const update = () => {
      const dark = document.documentElement.classList.contains("dark");
      uniforms.uSweepColor.value.set(dark ? "#ff4422" : "#dd3322");
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, [uniforms]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value += delta;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={sweepVertex}
        fragmentShader={sweepFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL FADE — opacity drops as user scrolls
   ═══════════════════════════════════════════════════════════════ */
function useScrollFade(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const vh = window.innerHeight;
      const opacity = Math.max(0, 1 - window.scrollY / (vh * 1.8));
      el.style.opacity = String(opacity);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref]);
}

/* ═══════════════════════════════════════════════════════════════
   SCENE — Composited with post-processing
   ═══════════════════════════════════════════════════════════════ */
export default function FluidBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollFade(containerRef);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: "transparent" }}
      >
        <ChromeSurface />
        <FloatingShards />
        <LightSweeps />
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.3}
            luminanceSmoothing={0.4}
            intensity={1.2}
            mipmapBlur
          />
          <Noise opacity={0.03} />
          <Vignette eskil={false} offset={0.15} darkness={0.6} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
