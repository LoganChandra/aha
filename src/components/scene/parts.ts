// The parts library: solids and ready-made machine parts, each designed once with real proportions.
// A part is one or more pieces; each piece names the material it wants, and the renderer colours it.
// Every part stands along y (like a cylinder): axles, spin axes and arrows all point up unless rotated.
import * as THREE from 'three';

export type Material = 'main' | 'dark' | 'metal' | 'glass' | 'south' | 'copper';
export type Piece = { geo: THREE.BufferGeometry; mat: Material; edges: boolean };

const one = (geo: THREE.BufferGeometry, mat: Material = 'main', edges = true): Piece[] => [{ geo, mat, edges }];

function ring(outer: number, inner: number, h: number, seg = 64): THREE.BufferGeometry {
  const prof = [new THREE.Vector2(inner, -h / 2), new THREE.Vector2(outer, -h / 2), new THREE.Vector2(outer, h / 2), new THREE.Vector2(inner, h / 2), new THREE.Vector2(inner, -h / 2)];
  return new THREE.LatheGeometry(prof, seg);
}

function helix(radius: number, length: number, turns: number, wire: number): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  const n = Math.max(40, Math.round(turns * 32));
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(radius * Math.cos(a), -length / 2 + (length * i) / n, radius * Math.sin(a)));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, wire, 10, false);
}

export function buildPart(shape: string, s: number[]): Piece[] {
  const a = s[0], b = s[1] ?? s[0], c = s[2] ?? s[0];
  switch (shape) {
    case 'box': return one(new THREE.BoxGeometry(a, b, c));
    case 'cylinder': return one(new THREE.CylinderGeometry(a, a, b, 48));
    case 'sphere': return one(new THREE.SphereGeometry(a, 40, 24));
    case 'cone': return one(new THREE.ConeGeometry(a, b, 48));
    case 'torus': return one(new THREE.TorusGeometry(a, s[1] ?? a * 0.25, 20, 64));
    case 'capsule': return one(new THREE.CapsuleGeometry(a, b, 8, 24));
    case 'tube': return one(ring(a, Math.min(a * 0.98, s[1] ?? a * 0.7), s[2] ?? a));

    case 'gear': {
      // [radius, thickness, teeth]. Trapezoid teeth, a bore, flat faces: reads as a gear from any angle.
      const r = a, th = b, teeth = Math.max(6, Math.min(60, Math.round(s[2] ?? Math.max(8, r * 24))));
      const root = r * 0.84, step = (Math.PI * 2) / teeth;
      const shape2 = new THREE.Shape();
      for (let i = 0; i < teeth; i++) {
        const t0 = i * step;
        const pts: [number, number][] = [[root, t0], [r, t0 + step * 0.2], [r, t0 + step * 0.48], [root, t0 + step * 0.68]];
        pts.forEach(([rad, ang], k) => { const x = rad * Math.cos(ang), y = rad * Math.sin(ang); if (i === 0 && k === 0) shape2.moveTo(x, y); else shape2.lineTo(x, y); });
      }
      shape2.closePath();
      const hole = new THREE.Path();
      hole.absarc(0, 0, r * 0.22, 0, Math.PI * 2, true);
      shape2.holes.push(hole);
      const g = new THREE.ExtrudeGeometry(shape2, { depth: th, bevelEnabled: false, curveSegments: 8 });
      g.translate(0, 0, -th / 2);
      g.rotateX(Math.PI / 2);
      return [{ geo: g, mat: 'main', edges: true }, { geo: new THREE.CylinderGeometry(r * 0.22, r * 0.22, th * 1.4, 24), mat: 'metal', edges: false }];
    }
    case 'wheel': {
      // [radius, width]: rubber tyre, coloured rim, metal hub. Axle along y.
      const r = a, w = b;
      return [
        { geo: ring(r, r * 0.68, w, 72), mat: 'dark', edges: false },
        { geo: new THREE.CylinderGeometry(r * 0.68, r * 0.68, w * 0.82, 48), mat: 'main', edges: true },
        { geo: new THREE.CylinderGeometry(r * 0.18, r * 0.18, w * 1.06, 24), mat: 'metal', edges: false },
      ];
    }
    case 'spring': return one(helix(a, b, Math.max(2, Math.min(40, s[2] ?? 8)), a * 0.09), 'metal', false);
    case 'coil': {
      // [radius, length, turns]: copper winding on a core.
      const turns = Math.max(4, Math.min(80, s[2] ?? 20));
      return [
        { geo: helix(a, b, turns, Math.min(a * 0.12, (b / turns) * 0.45)), mat: 'copper', edges: false },
        { geo: new THREE.CylinderGeometry(a * 0.82, a * 0.82, b * 1.12, 32), mat: 'main', edges: true },
      ];
    }
    case 'arrow': {
      // [length, thickness]: shaft plus head, from the part's position pointing up y.
      const len = a, th = s[1] ?? Math.max(0.03, len * 0.06), head = Math.min(len * 0.35, th * 4.5);
      const shaft = new THREE.CylinderGeometry(th, th, len - head, 16); shaft.translate(0, (len - head) / 2, 0);
      const tip = new THREE.ConeGeometry(th * 2.6, head, 24); tip.translate(0, len - head / 2, 0);
      return [{ geo: shaft, mat: 'main', edges: false }, { geo: tip, mat: 'main', edges: false }];
    }
    case 'fan': {
      // [radius, blades]: hub and twisted blades, spinning about y.
      const r = a, n = Math.max(2, Math.min(12, Math.round(s[1] ?? 5)));
      const pieces: Piece[] = [{ geo: new THREE.CylinderGeometry(r * 0.18, r * 0.2, r * 0.22, 32), mat: 'metal', edges: true }];
      for (let i = 0; i < n; i++) {
        const blade = new THREE.BoxGeometry(r * 0.78, r * 0.025, r * 0.26);
        blade.translate(r * 0.55, 0, 0);
        blade.rotateX(0.35);
        blade.rotateY((i / n) * Math.PI * 2);
        pieces.push({ geo: blade, mat: 'main', edges: true });
      }
      return pieces;
    }
    case 'magnet': {
      // [length, width]: a bar magnet along x, north half in the part's colour, south half blue.
      const half = new THREE.BoxGeometry(a / 2, b, b); half.translate(a / 4, 0, 0);
      const other = new THREE.BoxGeometry(a / 2, b, b); other.translate(-a / 4, 0, 0);
      return [{ geo: half, mat: 'main', edges: true }, { geo: other, mat: 'south', edges: true }];
    }
    case 'cell': {
      // [radius, height]: a cylindrical battery cell with a band and a positive terminal.
      const r = a, h = b;
      const term = new THREE.CylinderGeometry(r * 0.32, r * 0.32, h * 0.06, 24); term.translate(0, h / 2 + h * 0.03, 0);
      return [
        { geo: new THREE.CylinderGeometry(r, r, h, 40), mat: 'main', edges: true },
        { geo: ring(r * 1.01, r * 0.9, h * 0.08, 40), mat: 'dark', edges: false },
        { geo: term, mat: 'metal', edges: false },
      ];
    }
    case 'lens': {
      // [radius, thickness]: a convex glass lens, faces along y.
      const r = a, th = b, pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 24; i++) { const x = (r * i) / 24; pts.push(new THREE.Vector2(x, (th / 2) * Math.sqrt(Math.max(0, 1 - (x / r) ** 2)))); }
      for (let i = 24; i >= 0; i--) { const x = (r * i) / 24; pts.push(new THREE.Vector2(x, -(th / 2) * Math.sqrt(Math.max(0, 1 - (x / r) ** 2)))); }
      return one(new THREE.LatheGeometry(pts, 64), 'glass', false);
    }
    case 'chip': {
      // [width, depth]: a dark package with metal pins on two sides, lying flat.
      const w = a, d = b, h = Math.min(w, d) * 0.12;
      const pieces: Piece[] = [{ geo: new THREE.BoxGeometry(w, h, d), mat: 'dark', edges: true }];
      const pins = Math.max(3, Math.min(16, Math.round(w / 0.12)));
      for (let i = 0; i < pins; i++) for (const side of [-1, 1]) {
        const pin = new THREE.BoxGeometry((w / pins) * 0.35, h * 0.35, d * 0.14);
        pin.translate(-w / 2 + (w / pins) * (i + 0.5), -h * 0.2, side * (d / 2 + d * 0.06));
        pieces.push({ geo: pin, mat: 'metal', edges: false });
      }
      return pieces;
    }
  }
  return one(new THREE.BoxGeometry(a, b, c));
}

/** Half the part's largest extent, for framing the camera. Only the size numbers that are lengths count
 * (a gear's tooth count or a spring's turns are not). */
export function halfExtent(shape: string, s: number[]): number {
  const a = s[0], b = s[1] ?? s[0];
  switch (shape) {
    case 'box': return Math.max(a, b, s[2] ?? a) / 2;
    case 'chip': return Math.max(a, b) / 2;
    case 'tube': return Math.max(a, (s[2] ?? a) / 2);
    case 'sphere': case 'arrow': case 'fan': case 'lens': return a;
    case 'magnet': return Math.max(a / 2, b);
    case 'torus': return a + b;
    default: return Math.max(a, b / 2); // cylinder, cone, capsule, gear, wheel, spring, coil, cell
  }
}
