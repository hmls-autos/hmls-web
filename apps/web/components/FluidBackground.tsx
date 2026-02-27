"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════
   GLSL Simplex 3D Noise (Ashima Arts)
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
`;

/* ═══════════════════════════════════════════════════════════════
   FLUID MESH — Molten metal surface
   ═══════════════════════════════════════════════════════════════ */
const fluidVertex = /* glsl */ `
  ${NOISE_GLSL}

  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScroll;

  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal2;
  varying float vMouseProximity;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // 4-octave noise — organic, dramatic displacement
    float t = uTime * 0.1;
    float n1 = snoise(vec3(pos.x * 0.5, pos.y * 0.5, t)) * 0.55;
    float n2 = snoise(vec3(pos.x * 1.2, pos.y * 1.2, t * 1.8 + 50.0)) * 0.22;
    float n3 = snoise(vec3(pos.x * 2.8, pos.y * 2.8, t * 2.5 + 120.0)) * 0.08;
    float n4 = snoise(vec3(pos.x * 5.5, pos.y * 5.5, t * 3.5 + 250.0)) * 0.03;
    float elevation = n1 + n2 + n3 + n4;

    // Mouse dome + ripple
    vec2 mWorld = uMouse * 3.0;
    float mDist = distance(pos.xy, mWorld);
    float dome = smoothstep(2.5, 0.0, mDist) * 0.25;
    float ripple = sin(mDist * 6.0 - uTime * 2.5) * smoothstep(3.0, 0.5, mDist) * 0.08;
    elevation += dome + ripple;
    vMouseProximity = smoothstep(2.5, 0.0, mDist);

    // Scroll-linked wave
    float s = uScroll * 0.001;
    elevation += sin(pos.x * 1.5 + s * 5.0) * 0.04;
    elevation += cos(pos.y * 2.0 + s * 3.0) * 0.03;

    pos.z += elevation;
    vElevation = elevation;

    // Compute displaced normal
    float e = 0.01;
    float dx = (snoise(vec3((pos.x + e) * 0.5, pos.y * 0.5, t)) * 0.55
              + snoise(vec3((pos.x + e) * 1.2, pos.y * 1.2, t * 1.8 + 50.0)) * 0.22)
             - (n1 + n2);
    float dy = (snoise(vec3(pos.x * 0.5, (pos.y + e) * 0.5, t)) * 0.55
              + snoise(vec3(pos.x * 1.2, (pos.y + e) * 1.2, t * 1.8 + 50.0)) * 0.22)
             - (n1 + n2);
    vNormal2 = normalize(vec3(-dx / e, -dy / e, 1.0));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fluidFragment = /* glsl */ `
  ${NOISE_GLSL}

  uniform float uTime;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorHot;
  uniform vec3 uColorPeak;
  uniform float uOpacity;

  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vNormal2;
  varying float vMouseProximity;

  void main() {
    // Vignette
    float cDist = length(vUv - 0.5);
    float vignette = smoothstep(0.75, 0.15, cDist);

    // Temperature from elevation
    float temp = smoothstep(-0.3, 0.6, vElevation);

    // 4-stop gradient: deep → mid → hot → peak (white-hot)
    vec3 color = mix(uColorDeep, uColorMid, smoothstep(0.0, 0.35, temp));
    color = mix(color, uColorHot, smoothstep(0.35, 0.65, temp));
    color = mix(color, uColorPeak, smoothstep(0.75, 1.0, temp));

    // Fresnel rim — strong glow at edges
    float fresnel = pow(1.0 - abs(dot(vNormal2, vec3(0.0, 0.0, 1.0))), 3.5);
    color += uColorHot * fresnel * 0.5;

    // Moving specular highlight — liquid metal reflection
    vec3 lightA = normalize(vec3(sin(uTime * 0.25) * 0.6, cos(uTime * 0.18) * 0.4, 1.0));
    vec3 lightB = normalize(vec3(cos(uTime * 0.15) * 0.5, sin(uTime * 0.22) * 0.3, 0.8));
    float specA = pow(max(dot(vNormal2, lightA), 0.0), 48.0);
    float specB = pow(max(dot(vNormal2, lightB), 0.0), 24.0);
    color += uColorPeak * specA * 0.35;
    color += uColorHot * specB * 0.2;

    // Mouse spotlight
    color += uColorHot * vMouseProximity * 0.35;
    color += uColorPeak * vMouseProximity * vMouseProximity * 0.2;

    // Heat veins — slow-moving bright cracks
    float veins = snoise(vec3(vUv.x * 8.0, vUv.y * 8.0, uTime * 0.15));
    float veinMask = smoothstep(0.35, 0.65, veins) * smoothstep(0.65, 0.35, veins) * 4.0;
    color += uColorHot * veinMask * 0.12;

    float alpha = vignette * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

function FluidMesh() {
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
      uColorDeep: { value: new THREE.Color("#050505") },
      uColorMid: { value: new THREE.Color("#1a0505") },
      uColorHot: { value: new THREE.Color("#dc2626") },
      uColorPeak: { value: new THREE.Color("#ff8a65") },
      uOpacity: { value: 0.55 },
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
        uniforms.uColorDeep.value.set("#030202");
        uniforms.uColorMid.value.set("#180606");
        uniforms.uColorHot.value.set("#ef4444");
        uniforms.uColorPeak.value.set("#ffa070");
        uniforms.uOpacity.value = 0.6;
      } else {
        uniforms.uColorDeep.value.set("#ece8e4");
        uniforms.uColorMid.value.set("#f0dcd8");
        uniforms.uColorHot.value.set("#dc2626");
        uniforms.uColorPeak.value.set("#ff6b6b");
        uniforms.uOpacity.value = 0.18;
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
  const pw = 6 * Math.max(aspect, 1);
  const ph = 6 / Math.min(aspect, 1);

  return (
    <mesh ref={meshRef} rotation={[-0.35, 0, 0]} position={[0, 0.3, 0]}>
      <planeGeometry args={[pw, ph, 160, 160]} />
      <shaderMaterial
        vertexShader={fluidVertex}
        fragmentShader={fluidFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMBER PARTICLES — floating sparks
   ═══════════════════════════════════════════════════════════════ */
const particleVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aBrightness;

  uniform float uTime;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vBright;

  void main() {
    vec3 pos = position;

    // Gentle sway
    float t = uTime * 0.3 + aPhase;
    pos.x += sin(t * 1.3 + pos.y * 0.5) * 0.15;
    pos.z += cos(t * 0.9 + pos.x * 0.3) * 0.1;

    // Slow upward drift
    pos.y += mod(uTime * (0.05 + aBrightness * 0.08) + aPhase * 10.0, 8.0) - 4.0;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    // Size attenuation
    gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPos.z);

    // Fade based on Y position (fade out at top/bottom)
    float yNorm = (pos.y + 4.0) / 8.0;
    float edgeFade = smoothstep(0.0, 0.15, yNorm) * smoothstep(1.0, 0.8, yNorm);

    // Twinkle
    float twinkle = sin(uTime * 2.0 + aPhase * 20.0) * 0.3 + 0.7;

    vAlpha = edgeFade * twinkle * (0.3 + aBrightness * 0.7);
    vBright = aBrightness;
  }
`;

const particleFragment = /* glsl */ `
  uniform vec3 uEmberColor;
  uniform vec3 uEmberHot;

  varying float vAlpha;
  varying float vBright;

  void main() {
    // Soft circle
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    // Glow falloff — bright core, soft halo
    float core = smoothstep(0.5, 0.05, d);
    float halo = smoothstep(0.5, 0.2, d) * 0.4;
    float glow = core + halo;

    vec3 color = mix(uEmberColor, uEmberHot, vBright * core);

    gl_FragColor = vec4(color, glow * vAlpha);
  }
`;

const PARTICLE_COUNT = 600;

function Embers() {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    const brightness = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = Math.random() * 3 - 1;

      sizes[i] = Math.random() * 4 + 1;
      phases[i] = Math.random() * Math.PI * 2;
      brightness[i] = Math.random() ** 3; // most are dim, few are bright
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));

    const uni = {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
      uEmberColor: { value: new THREE.Color("#ff4422") },
      uEmberHot: { value: new THREE.Color("#ffcc88") },
    };

    return { geometry: geo, uniforms: uni };
  }, []);

  // Theme-aware ember colors
  useEffect(() => {
    const update = () => {
      const dark = document.documentElement.classList.contains("dark");
      if (dark) {
        uniforms.uEmberColor.value.set("#ee3311");
        uniforms.uEmberHot.value.set("#ffbb77");
      } else {
        uniforms.uEmberColor.value.set("#dc2626");
        uniforms.uEmberHot.value.set("#ff8888");
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
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCENE — Canvas wrapper
   ═══════════════════════════════════════════════════════════════ */
export default function FluidBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <FluidMesh />
        <Embers />
      </Canvas>
    </div>
  );
}
