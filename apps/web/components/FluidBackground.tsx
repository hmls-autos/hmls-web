"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* ─── GLSL Simplex 3D Noise ─── */
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

/* ─── Vertex Shader ─── */
const vertexShader = /* glsl */ `
  ${NOISE_GLSL}

  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uScrollY;

  varying vec2 vUv;
  varying float vElevation;
  varying float vNoise;
  varying vec3 vNormal;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Multi-octave noise for organic flow
    float n1 = snoise(vec3(pos.x * 0.8, pos.y * 0.8, uTime * 0.15)) * 0.35;
    float n2 = snoise(vec3(pos.x * 1.6, pos.y * 1.6, uTime * 0.25 + 100.0)) * 0.15;
    float n3 = snoise(vec3(pos.x * 3.2, pos.y * 3.2, uTime * 0.35 + 200.0)) * 0.05;

    float elevation = n1 + n2 + n3;

    // Mouse influence — subtle attraction
    float mouseDist = distance(pos.xy, uMouse * 2.0);
    float mouseInfluence = smoothstep(1.5, 0.0, mouseDist) * 0.15;
    elevation += mouseInfluence;

    // Scroll-linked wave offset
    elevation += sin(pos.x * 2.0 + uScrollY * 0.002) * 0.03;

    pos.z += elevation;
    vElevation = elevation;
    vNoise = n1;

    // Compute displaced normal for lighting
    float eps = 0.01;
    float nx = snoise(vec3((pos.x + eps) * 0.8, pos.y * 0.8, uTime * 0.15)) * 0.35
             + snoise(vec3((pos.x + eps) * 1.6, pos.y * 1.6, uTime * 0.25 + 100.0)) * 0.15;
    float ny = snoise(vec3(pos.x * 0.8, (pos.y + eps) * 0.8, uTime * 0.15)) * 0.35
             + snoise(vec3(pos.x * 1.6, (pos.y + eps) * 1.6, uTime * 0.25 + 100.0)) * 0.15;
    vec3 displacedNormal = normalize(vec3(-(nx - (n1 + n2)) / eps, -(ny - (n1 + n2)) / eps, 1.0));
    vNormal = displacedNormal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

/* ─── Fragment Shader ─── */
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorBase;
  uniform vec3 uColorAccent;
  uniform vec3 uColorHighlight;
  uniform float uOpacity;

  varying vec2 vUv;
  varying float vElevation;
  varying float vNoise;
  varying vec3 vNormal;

  void main() {
    // Base metallic gradient — dark at edges, slightly lighter center
    float centerGlow = 1.0 - length(vUv - 0.5) * 1.4;
    centerGlow = clamp(centerGlow, 0.0, 1.0);

    // Mix base color with accent based on elevation
    vec3 color = mix(uColorBase, uColorAccent, smoothstep(-0.1, 0.3, vElevation));

    // Add highlight on peaks
    color = mix(color, uColorHighlight, smoothstep(0.25, 0.45, vElevation) * 0.6);

    // Fake Fresnel / rim lighting
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
    color += uColorAccent * fresnel * 0.3;

    // Metallic sheen — shifts with viewing angle
    float sheen = pow(max(dot(vNormal, normalize(vec3(0.5, 0.5, 1.0))), 0.0), 16.0);
    color += uColorHighlight * sheen * 0.2;

    // Vignette fade at edges
    float vignette = smoothstep(0.0, 0.5, centerGlow);

    // Final opacity — subtle presence
    float alpha = vignette * uOpacity;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ─── Fluid Mesh Component ─── */
function FluidMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const targetMouseRef = useRef(new THREE.Vector2(0, 0));
  const scrollRef = useRef(0);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScrollY: { value: 0 },
      uColorBase: { value: new THREE.Color("#0a0a0a") },
      uColorAccent: { value: new THREE.Color("#3a0a0a") },
      uColorHighlight: { value: new THREE.Color("#dc2626") },
      uOpacity: { value: 0.45 },
    }),
    [],
  );

  // Track mouse
  const handleMouse = useCallback(
    (e: MouseEvent) => {
      targetMouseRef.current.set(
        (e.clientX / size.width) * 2 - 1,
        -(e.clientY / size.height) * 2 + 1,
      );
    },
    [size],
  );

  // Track scroll
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

  // Theme-aware colors
  useEffect(() => {
    const update = () => {
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark) {
        uniforms.uColorBase.value.set("#080605");
        uniforms.uColorAccent.value.set("#2a0808");
        uniforms.uColorHighlight.value.set("#ef4444");
        uniforms.uOpacity.value = 0.5;
      } else {
        uniforms.uColorBase.value.set("#e8e4e0");
        uniforms.uColorAccent.value.set("#f5e6e6");
        uniforms.uColorHighlight.value.set("#dc2626");
        uniforms.uOpacity.value = 0.2;
      }
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [uniforms]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value += delta;

    // Smooth mouse lerp
    mouseRef.current.lerp(targetMouseRef.current, 0.05);
    mat.uniforms.uMouse.value.copy(mouseRef.current);
    mat.uniforms.uScrollY.value = scrollRef.current;
  });

  // Responsive plane size
  const aspect = size.width / size.height;
  const planeW = 5 * Math.max(aspect, 1);
  const planeH = 5 / Math.min(aspect, 1);

  return (
    <mesh ref={meshRef} rotation={[-0.3, 0, 0]} position={[0, 0.2, 0]}>
      <planeGeometry args={[planeW, planeH, 128, 128]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ─── Canvas Wrapper ─── */
export default function FluidBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <FluidMesh />
      </Canvas>
    </div>
  );
}
