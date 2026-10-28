'use client';
// 3D model: a machine or structure assembled from simple solids, styled like a clean technical illustration
// (matte surfaces, crisp edges, soft contact shadow). Exploded view, spinning parts, labels on what matters.
import { ContactShadows, Edges, Html, OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { evaluate, type Env } from '@/lib/expr';
import type { Scene } from '@/lib/recipe';
import { TONES } from '@/lib/recipe';
import { buildPart, halfExtent, type Material } from './parts';

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

const MATERIALS: Record<Material, { color?: string; roughness: number; metalness: number }> = {
  main: { roughness: 0.62, metalness: 0.08 },
  dark: { color: '#2b2b30', roughness: 0.85, metalness: 0 },
  metal: { color: '#b9bdc6', roughness: 0.32, metalness: 0.65 },
  glass: { roughness: 0.08, metalness: 0 },
  south: { color: '#2f6fdf', roughness: 0.6, metalness: 0.08 },
  copper: { color: '#c7793a', roughness: 0.38, metalness: 0.55 },
};

function PartMesh({ p, env, t, explode, colors, dimmed, hot, showLabel, callout, onTap }: { p: Part; env: Env; t: number; explode: number; colors: Record<string, string>; dimmed: boolean; hot: boolean; showLabel: boolean; callout?: string; onTap?: (id: string) => void }) {
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
    <group position={[pos[0] + ex[0], pos[1] + ex[1], pos[2] + ex[2]]}>
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
            <mesh key={k} geometry={piece.geo} castShadow>
              <meshStandardMaterial color={c} roughness={m.roughness} metalness={m.metalness} transparent={o < 1} opacity={o} depthWrite={o >= 1} emissive={hot ? c : '#000'} emissiveIntensity={hot ? 0.18 : 0} />
              {piece.edges && <Edges threshold={24} color={hot ? colors.ink : colors.line} />}
            </mesh>
          );
        })}
      </group>
      </group>
      {/* Labels stay mounted and fade in and out: mounting and unmounting drei's Html portals mid-render breaks React 19. */}
      {(p.label || callout) && (
        <Html center position={[0, 0, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className={`whitespace-nowrap rounded-full border bg-surface/95 px-2.5 py-1 text-[12px] font-semibold text-ink shadow-sm ${callout ? 'border-ink-2' : 'border-line'}`}
            style={{ transform: 'translateY(-26px)', opacity: showLabel || callout ? 1 : 0, transition: 'opacity 200ms' }}
            aria-hidden={!(showLabel || callout)}
          >
            {callout ?? p.label}
          </div>
        </Html>
      )}
    </group>
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

  if (!colors.primary) return null;
  return (
    <div className="absolute inset-0" style={{ touchAction: 'none' }}>
      <Canvas dpr={[1, 2]} frameloop={playing ? 'always' : 'demand'} camera={{ fov: 35 }} gl={{ antialias: true, alpha: true }} shadows>
        <ambientLight intensity={0.75} />
        <hemisphereLight args={['#ffffff', '#bdb8ad', 0.5]} />
        <directionalLight position={[4, 7, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-5, 2, -3]} intensity={0.45} />
        <group position={[-center.x, -center.y, -center.z]}>
          {scene.parts.map((p) => (
            <PartMesh
              key={p.id} p={p} env={env} t={t} explode={explode} colors={colors}
              dimmed={focus.length > 0 && !focus.includes(p.id)} hot={focus.includes(p.id)}
              showLabel={!Object.keys(callouts).length && firstOfLabel.has(p.id) && (focusedLabels.has(p.id) || labelAll)}
              callout={callout1[p.id]} onTap={onTap}
            />
          ))}
        </group>
        <ContactShadows position={[0, floor - 0.02, 0]} opacity={0.32} scale={radius * 4} blur={2.4} far={radius * 2} />
        <Fit box={box} dir={dir} />
        <OrbitControls enablePan={false} enableDamping makeDefault minDistance={radius * 0.8} maxDistance={radius * 6} />
      </Canvas>
    </div>
  );
}
