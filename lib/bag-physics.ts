/**
 * Velvet Bag pile physics & Spread layout ported faithfully from botcgrimoire-main.
 * Powers the interactive face-down Pick ("Ambil") mode where players stir and grab a token.
 */

export interface TokenBody {
  readonly id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly angle: number;
  removed?: boolean;
}

export interface BagBounds {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly tokenSize: number;
}

/** Generate an organic overlapping pile of face-down tokens inside an elliptical bag interior. */
export function createBagPile(
  count: number,
  bounds: BagBounds
): TokenBody[] {
  const { cx, cy, rx, ry, tokenSize } = bounds;
  const r = tokenSize * 0.5;
  const safeRx = Math.max(20, rx - r - 6);
  const safeRy = Math.max(20, ry - r - 6);

  const bodies: TokenBody[] = [];
  for (let i = 0; i < count; i++) {
    // Golden-angle spiral seed + jitter so tokens distribute richly without locking in a grid
    const t = (i + 0.5) / Math.max(1, count);
    const rad = Math.sqrt(t) * 0.85;
    const theta = i * 2.39996 + (Math.random() - 0.5) * 0.6;
    const x = cx + Math.cos(theta) * safeRx * rad;
    const y = cy + Math.sin(theta) * safeRy * rad;
    bodies.push({
      id: i,
      x,
      y,
      vx: 0,
      vy: 0,
      angle: (Math.random() - 0.5) * 32,
    });
  }

  // Run brief relaxation passes so tokens settle comfortably without stacking 100% identically
  relaxBagPile(bodies, bounds, 16);
  return bodies;
}

/** Relax collisions gently and keep all tokens within the drawstring bag boundary. */
export function relaxBagPile(
  bodies: TokenBody[],
  bounds: BagBounds,
  iterations = 6
): void {
  const { cx, cy, rx, ry, tokenSize } = bounds;
  const minDist = tokenSize * 0.72; // slight overlap like wooden/cardboard tokens in a velvet bag
  const maxRx = Math.max(24, rx - tokenSize * 0.45);
  const maxRy = Math.max(24, ry - tokenSize * 0.45);

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (a.removed) continue;
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (b.removed) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        if (dist < minDist) {
          const push = (minDist - dist) * 0.35;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }

      // Elliptical containment inside velvet cloth bag
      const normX = (a.x - cx) / maxRx;
      const normY = (a.y - cy) / maxRy;
      const eDist = Math.hypot(normX, normY);
      if (eDist > 1) {
        a.x = cx + (normX / eDist) * maxRx;
        a.y = cy + (normY / eDist) * maxRy;
      }
    }
  }
}

/** Apply a finger/pointer stir impulse inside the bag, pushing nearby tokens smoothly. */
export function stirBagPile(
  bodies: TokenBody[],
  bounds: BagBounds,
  px: number,
  py: number,
  dx: number,
  dy: number,
  draggingId?: number
): TokenBody[] {
  const next = bodies.map((b) => ({ ...b }));
  const reach = bounds.tokenSize * 1.15;

  for (const b of next) {
    if (b.removed) continue;
    if (b.id === draggingId) {
      b.x += dx;
      b.y += dy;
      continue;
    }
    const ox = b.x - px;
    const oy = b.y - py;
    const dist = Math.hypot(ox, oy);
    if (dist < reach && dist > 0.001) {
      const strength = 1 - dist / reach;
      b.x += dx * strength * 0.72 + (ox / dist) * strength * 5;
      b.y += dy * strength * 0.72 + (oy / dist) * strength * 5;
    }
  }

  relaxBagPile(next, bounds, 5);
  return next;
}

/** Fan/grid spread coordinates when user switches to neat face-down spread layout. */
export function createSpreadLayout(
  count: number,
  width: number,
  height: number
): { x: number; y: number; size: number }[] {
  if (count <= 0) return [];
  const pad = 16;
  const usableW = Math.max(200, width - pad * 2);
  const usableH = Math.max(180, height - pad * 2);
  const cols = Math.min(count, Math.max(3, Math.ceil(Math.sqrt((count * usableW) / usableH))));
  const rows = Math.ceil(count / cols);
  const cellW = usableW / cols;
  const cellH = usableH / rows;
  const size = Math.max(52, Math.min(92, Math.floor(Math.min(cellW, cellH) * 0.84)));

  return Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const itemsInRow = r === rows - 1 ? count - r * cols : cols;
    const rowWidth = itemsInRow * cellW;
    const startX = (width - rowWidth) / 2 + cellW / 2;
    const startY = (height - rows * cellH) / 2 + cellH / 2;
    return {
      x: startX + c * cellW,
      y: startY + r * cellH,
      size,
    };
  });
}
