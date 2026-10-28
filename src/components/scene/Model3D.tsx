'use client';
// 3D model: a machine or structure assembled from simple solids, styled like a clean technical illustration
// (matte surfaces, crisp edges, soft contact shadow). Exploded view, spinning parts, labels on what matters.
import { ContactShadows, Edges, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { evaluate, type Env } from '@/lib/expr';
import type { Scene } from '@/lib/recipe';
import { TONES } from '@/lib/recipe';
import { buildPart, halfExtent, type Material } from './parts';
import { useSize } from './runtime';

type M = Extract<Scene, { type: 'model3d' }>;
type Part = M['parts'][number];

function useToneColors(): Record<string, string> {
  const [c, setC] = useState<Record<string, string>>({});
  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      const out: Record<string, string> = {};
      for (const t of TONES) out[t] = s.getPropertyValue(`--t-${t}`).trim() || '#888';
      out.ink = s.getPropertyValue('--ink').trim();
      out.line = s.getPropertyValue('--line-2').trim();
      setC(out);
    };
    read();
    const m = window.matchMedia('(prefers-color-scheme: dark)');
    m.addEventListener('change', read);
    return () => m.removeEventListener('change', read);
  }, []);
  return c;
}

const deg = (v: number) => (v * Math.PI) / 180;

/** Tappable parts breathe a soft outline (the same shape, slightly larger, inside out), so the learner can see what to tap. */
function TapHalo({ geo, color }: { geo: THREE.BufferGeometry; color: string }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => { if (mat.current) mat.current.opacity = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 3.4)); });
  return (
    <mesh geometry={geo} scale={1.07}>
      <meshBasicMaterial ref={mat} color={color} side={THREE.BackSide} transparent opacity={0.3} depthWrite={false} />
    </mesh>
  );
}

const MATERIALS: Record<Material, { color?: string; roughness: number; metalness: number }> = {
  main: { roughness: 0.62, metalness: 0.08 },
  dark: { color: '#2b2b30', roughness: 0.85, metalness: 0 },
  metal: { color: '#b9bdc6', roughness: 0.32, metalness: 0.65 },
  glass: { roughness: 0.08, metalness: 0 },
  south: { color: '#2f6fdf', roughness: 0.6, metalness: 0.08 },
  copper: { color: '#c7793a', roughness: 0.38, metalness: 0.55 },
  ceramic: { color: '#f3f0e8', roughness: 0.3, metalness: 0 },
};

function PartMesh({ p, env, t, explode, colors, dimmed, hot, onTap, register }: { p: Part; env: Env; t: number; explode: number; colors: Record<string, string>; dimmed: boolean; hot: boolean; onTap?: (id: string) => void; register: (id: string, o: THREE.Object3D | null) => void }) {
  // Geometry only rebuilds when a size expression's value changes.
  const sizeKey = p.size.map((v) => evaluate(v, env, 0.5).toFixed(3)).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pieces = useMemo(() => buildPart(p.shape, p.size.map((v) => Math.max(0.001, Math.abs(evaluate(v, env, 0.5))))), [p.shape, sizeKey]);
  useEffect(() => () => pieces.forEach((x) => x.geo.dispose()), [pieces]);
  const pos = (p.position ?? [0, 0, 0]).map((v) => evaluate(v, env, 0));
  const ex = (p.explode ?? [0, 0, 0]).map((v) => evaluate(v, env, 0) * explode);
  const rot = (p.rotation ?? [0, 0, 0]).map((v) => deg(evaluate(v, env, 0)));
  // Spin turns the part about its own axle (inside its rotation), so a wheel laid on its side still rolls.
  const spinRot: [number, number, number] = [0, 0, 0];
  if (p.spin) spinRot[{ x: 0, y: 1, z: 2 }[p.spin.axis]] = evaluate(p.spin.speed, env, 0) * t * Math.PI * 2;
  const color = colors[p.tone ?? 'neutral'] ?? '#999';
  const base = p.opacity ?? 1;
  const opacity = dimmed ? Math.min(base, 0.14) : base;
  return (
    <group position={[pos[0] + ex[0], pos[1] + ex[1], pos[2] + ex[2]]} ref={(o) => register(p.id, o)}>
      <group
        rotation={new THREE.Euler(rot[0], rot[1], rot[2], 'XYZ')}
      >
      <group
        rotation={spinRot}
        onClick={onTap ? (e) => { e.stopPropagation(); onTap(p.id); } : undefined}
        onPointerOver={onTap ? () => { document.body.style.cursor = 'pointer'; } : undefined}
        onPointerOut={onTap ? () => { document.body.style.cursor = ''; } : undefined}
      >
        {pieces.map((piece, k) => {
          const m = MATERIALS[piece.mat];
          const c = piece.mat === 'main' ? color : piece.mat === 'glass' ? colors.cool : m.color!;
          const o = piece.mat === 'glass' ? Math.min(opacity, 0.45) : opacity;
          return (
            <group key={k}>
            {onTap && piece.mat !== 'glass' && <TapHalo geo={piece.geo} color={colors.primary} />}
            <mesh geometry={piece.geo} castShadow>
              <meshPhysicalMaterial
                color={c} roughness={m.roughness} metalness={m.metalness} clearcoat={piece.mat === 'main' ? 0.4 : 0} clearcoatRoughness={0.35}
                transmission={piece.mat === 'glass' ? 0.6 : 0} thickness={piece.mat === 'glass' ? 0.4 : 0}
                transparent={o < 1} opacity={o} depthWrite={o >= 1} emissive={hot ? c : '#000'} emissiveIntensity={hot ? 0.16 : 0}
              />
              {piece.edges && <Edges threshold={24} color={hot ? colors.ink : colors.line} />}
            </mesh>
            </group>
          );
        })}
      </group>
      </group>
    </group>
  );
}

type Pin = { id: string; text: string; callout: boolean };

/** Projects each labelled part to the screen whenever the scene renders, so labels can be laid out in 2D. */
function Projector({ pins, objs, onMove }: { pins: Pin[]; objs: Map<string, THREE.Object3D>; onMove: (pos: Record<string, [number, number]>) => void }) {
  const { camera, size } = useThree();
  const last = useRef('');
  useFrame(() => {
    const out: Record<string, [number, number]> = {};
    const v = new THREE.Vector3();
    for (const p of pins) {
      const o = objs.get(p.id);
      if (!o) continue;
      o.getWorldPosition(v).project(camera);
      if (v.z > 1) continue;
      out[p.id] = [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
    }
    const key = Object.entries(out).map(([k, [x, y]]) => `${k}:${Math.round(x)},${Math.round(y)}`).join('|');
    if (key !== last.current) { last.current = key; onMove(out); }
  });
  return null;
}

/** Labels for 3D parts, placed in screen space so they never sit on each other: each tries above, below, right
 * and left of its part and takes the first free spot, with a thin leader line back to the part. */
function LabelOverlay({ pins, pos, w, h }: { pins: Pin[]; pos: Record<string, [number, number]>; w: number; h: number }) {
  const boxes: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const pts = pins.filter((p) => pos[p.id]).map((p) => pos[p.id]);
  const mx = pts.reduce((a, q) => a + q[0], 0) / Math.max(1, pts.length), my = pts.reduce((a, q) => a + q[1], 0) / Math.max(1, pts.length);
  const placed = pins.filter((p) => pos[p.id]).map((p) => {
    const [ax, ay] = pos[p.id];
    const tw = p.text.length * 8.4 + 28, th = 34;
    // Labels lean away from the model's middle, so they sit in the space around it rather than on it.
    const out = Math.abs(ax - mx) > Math.abs(ay - my) * 0.8
      ? (ax >= mx ? [[ax + 40, ay - th / 2], [ax + 30, ay - 60], [ax + 30, ay + 26]] : [[ax - tw - 40, ay - th / 2], [ax - tw - 30, ay - 60], [ax - tw - 30, ay + 26]])
      : (ay <= my ? [[ax - tw / 2, ay - 70], [ax + 20, ay - 70], [ax - tw - 20, ay - 70]] : [[ax - tw / 2, ay + 36], [ax + 20, ay + 36], [ax - tw - 20, ay + 36]]);
    const tries: [number, number][] = [...(out as [number, number][]), [ax - tw / 2, ay - 64], [ax - tw / 2, ay + 30], [ax + 28, ay - th / 2], [ax - tw - 28, ay - th / 2]];
    let spot: [number, number] = tries[0];
    for (const [x, y] of tries) {
      const cx = Math.max(6, Math.min(w - tw - 6, x)), cy = Math.max(6, Math.min(h - th - 6, y));
      spot = [cx, cy];
      if (!boxes.some((b) => cx < b.x1 && cx + tw > b.x0 && cy < b.y1 && cy + th > b.y0)) break;
    }
    boxes.push({ x0: spot[0], x1: spot[0] + tw, y0: spot[1], y1: spot[1] + th });
    return { ...p, ax, ay, x: spot[0], y: spot[1], tw, th };
  });
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <svg className="absolute inset-0" width={w} height={h}>
        {placed.map((p) => {
          const lx = Math.max(p.x + 12, Math.min(p.x + p.tw - 12, p.ax)), ly = p.y > p.ay ? p.y : p.y + p.th;
          return (
            <g key={p.id}>
              <line x1={p.ax} y1={p.ay} x2={lx} y2={ly} stroke="var(--ink)" strokeWidth={1.5} />
              <circle cx={p.ax} cy={p.ay} r={4} fill="var(--ink)" />
            </g>
          );
        })}
      </svg>
      {placed.map((p) => (
        <div
          key={p.id} className={`absolute whitespace-nowrap rounded-full border-[1.5px] bg-surface/95 px-3 text-[15px] font-semibold leading-[31px] text-ink shadow-sm ${p.callout ? 'border-ink' : 'border-line-2'}`}
          style={{ left: p.x, top: p.y, height: p.th, width: p.tw, textAlign: 'center' }}
        >
          {p.text}
        </div>
      ))}
    </div>
  );
}

/** Frame the model's box (at full explode) tightly from the given direction: binary-search the camera
 * distance until every corner projects inside 88% of the view. Tighter than a bounding sphere for flat machines. */
// three.js cameras are mutable objects; positioning one is the point of this component.
/* eslint-disable react-hooks/immutability */
function Fit({ box, dir }: { box: THREE.Box3; dir: [number, number, number] }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.aspect = size.width / Math.max(1, size.height);
    const v = new THREE.Vector3(...dir).normalize();
    const corners: THREE.Vector3[] = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
    const fits = (d: number) => {
      cam.position.copy(v.clone().multiplyScalar(d));
      cam.lookAt(0, 0, 0);
      cam.updateMatrixWorld();
      cam.updateProjectionMatrix();
      return corners.every((c) => { const p = c.clone().project(cam); return p.z < 1 && Math.abs(p.x) < 0.94 && Math.abs(p.y) < 0.9; });
    };
    const r = box.getSize(new THREE.Vector3()).length();
    let lo = r * 0.2, hi = r * 8;
    for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid; }
    cam.near = hi / 50; cam.far = hi * 20;
    fits(hi);
    invalidate();
  }, [camera, size.width, size.height, box, dir, invalidate]);
  return null;
}

/* eslint-enable react-hooks/immutability */

export default function Model3D({ scene, env, focus, t, playing, callouts = {}, onTap }: { scene: M; env: Env; focus: string[]; t: number; playing: boolean; callouts?: Record<string, string>; onTap?: (id: string) => void }) {
  const colors = useToneColors();
  const explode = scene.explodeParam ? Math.max(0, Math.min(1, evaluate(scene.explodeParam, env, 0))) : 0;
  // Centre the model and size the camera on its fully exploded extent, so exploding never leaves the frame.
  const { center, box, floor, radius } = useMemo(() => {
    const b = new THREE.Box3();
    for (const p of scene.parts) {
      const half = halfExtent(p.shape, p.size.map((v) => Math.abs(evaluate(v, env, 0.5))));
      // Frame what is on screen now: assembled it fills the view, and the camera eases back as it comes apart.
      for (const k of [0, explode]) {
        const pos = (p.position ?? [0, 0, 0]).map((v, i) => evaluate(v, env, 0) + k * evaluate((p.explode ?? [0, 0, 0])[i], env, 0));
        b.expandByPoint(new THREE.Vector3(pos[0] - half, pos[1] - half, pos[2] - half));
        b.expandByPoint(new THREE.Vector3(pos[0] + half, pos[1] + half, pos[2] + half));
      }
    }
    const c = b.getCenter(new THREE.Vector3());
    const centred = b.clone().translate(c.clone().negate());
    return { center: c, box: centred, floor: centred.min.y, radius: Math.max(0.5, b.getSize(new THREE.Vector3()).length() / 2) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, Math.round(explode * 20)]);
  const dir = (scene.camera ?? [1.4, 0.9, 2]) as [number, number, number];
  // The same callout text on several parts ("turns" three times) is shown once.
  const seenCallout = new Set<string>();
  const callout1: Record<string, string> = {};
  for (const [id, text] of Object.entries(callouts)) if (!seenCallout.has(text)) { seenCallout.add(text); callout1[id] = text; }
  // One label per name: twelve parts called "Cell" get one "Cell" tag, not twelve.
  const firstOfLabel = new Set<string>();
  const seen = new Set<string>();
  const order = [...scene.parts.filter((p) => focus.includes(p.id)), ...scene.parts];
  for (const p of order) if (p.label && !seen.has(p.label)) { seen.add(p.label); firstOfLabel.add(p.id); }
  const labelAll = !focus.length && seen.size <= 5;
  // At most three tags while a beat points at parts, so they never pile up.
  const focusedLabels = new Set([...firstOfLabel].filter((id) => focus.includes(id)).slice(0, 3));

  const objs = useRef(new Map<string, THREE.Object3D>()).current;
  const register = (id: string, o: THREE.Object3D | null) => { if (o) objs.set(id, o); else objs.delete(id); };
  const pins: Pin[] = Object.keys(callouts).length
    ? Object.entries(callout1).map(([id, text]) => ({ id, text, callout: true }))
    : scene.parts.filter((p) => p.label && firstOfLabel.has(p.id) && (focusedLabels.has(p.id) || labelAll)).map((p) => ({ id: p.id, text: p.label!, callout: false }));
  const [pinPos, setPinPos] = useState<Record<string, [number, number]>>({});
  const [box2, size2] = useSize<HTMLDivElement>();

  if (!colors.primary) return null;
  return (
    <div ref={box2} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <Canvas dpr={[1, 2]} frameloop={playing || onTap ? 'always' : 'demand'} camera={{ fov: 35 }} gl={{ antialias: true, alpha: true }} shadows>
        {/* A small studio built from light panels (no downloaded HDR): soft key, rim and fill, product-shot style. */}
        <Environment resolution={256}>
          <Lightformer intensity={2.2} position={[0, 5, -6]} scale={[10, 3, 1]} />
          <Lightformer intensity={1.2} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer intensity={1.2} position={[6, 2, 1]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer intensity={0.8} position={[0, -4, 4]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} color="#f2efe8" />
        </Environment>
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 7, 5]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        <group position={[-center.x, -center.y, -center.z]}>
          {scene.parts.map((p) => (
            <PartMesh
              key={p.id} p={p} env={env} t={t} explode={explode} colors={colors}
              dimmed={focus.length > 0 && !focus.includes(p.id)} hot={focus.includes(p.id)}
              onTap={onTap} register={register}
            />
          ))}
        </group>
        <ContactShadows position={[0, floor - 0.02, 0]} opacity={0.32} scale={radius * 4} blur={2.4} far={radius * 2} />
        <Fit box={box} dir={dir} />
        <OrbitControls enablePan={false} enableDamping makeDefault minDistance={radius * 0.8} maxDistance={radius * 6} />
        <Projector pins={pins} objs={objs} onMove={setPinPos} />
      </Canvas>
      {size2.w > 0 && <LabelOverlay pins={pins} pos={pinPos} w={size2.w} h={size2.h} />}
    </div>
  );
}
