/**
 * Elliptical ring geometry, inward reminder stack vectors, clockwork voting arc,
 * and smart floating seat context menu placement ported cleanly from botcgrimoire-main.
 */

import { SEAT_METRICS } from './grimoire-theme.ts';

export interface Size2D {
  readonly width: number;
  readonly height: number;
}

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface Rect2D {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface SeatPosition extends Point2D {
  readonly angle: number; // degrees, -90 = top (12 o'clock), clockwise positive
}

export interface RingGeometry {
  readonly size: number; // token diameter
  readonly margin: number;
  readonly band: Size2D;
  readonly rx: number;
  readonly ry: number;
  readonly aspect: number;
  readonly positions: readonly SeatPosition[];
}

const MIN_TOKEN_SIZE = 42;
const MAX_TOKEN_SIZE = 112;
const NAME_MARGIN = 6;
const REDUCE_STEP = 2;

export function reminderSize(tokenDiameter: number): number {
  return SEAT_METRICS.reminderSize(tokenDiameter);
}

export function reminderStack(size: number, angleDeg: number, count: number, expanded: boolean) {
  const chipSize = reminderSize(size);
  const radians = (angleDeg * Math.PI) / 180;
  const inward = { x: -Math.cos(radians), y: -Math.sin(radians) };
  const nameFontHeight = SEAT_METRICS.seatNameSize(size) + 4;
  const nameClearance =
    Math.max(0, inward.y - Math.abs(inward.x)) * (nameFontHeight + SEAT_METRICS.nameGap);
  const distance = size / 2 + chipSize / 2 + 4 + nameClearance;
  const step = expanded ? chipSize + 4 : chipSize * 0.52;
  const points: Point2D[] = Array.from({ length: count }, (_, i) => ({
    x: inward.x * (distance + i * step),
    y: inward.y * (distance + i * step),
  }));
  return { chipSize, inward, points };
}

/** Distribute seats around an ellipse with uniform arc-length spacing starting at top (12 o'clock). */
export function seatPositions(
  band: Size2D,
  rx: number,
  ry: number,
  count: number
): SeatPosition[] {
  if (count <= 0) return [];
  const cx = band.width / 2;
  const cy = band.height / 2;
  if (count === 1) {
    return [{ x: cx, y: cy - ry, angle: -90 }];
  }

  // Approximate equal arc-length parameterization around ellipse
  const samples = Math.max(360, count * 36);
  const lengths = new Float64Array(samples + 1);
  let prevX = rx * Math.cos(-Math.PI / 2);
  let prevY = ry * Math.sin(-Math.PI / 2);
  lengths[0] = 0;

  for (let i = 1; i <= samples; i++) {
    const theta = -Math.PI / 2 + (i / samples) * Math.PI * 2;
    const x = rx * Math.cos(theta);
    const y = ry * Math.sin(theta);
    lengths[i] = lengths[i - 1] + Math.hypot(x - prevX, y - prevY);
    prevX = x;
    prevY = y;
  }

  const totalLen = lengths[samples];
  const result: SeatPosition[] = [];

  for (let k = 0; k < count; k++) {
    const targetLen = (k / count) * totalLen;
    let lo = 0;
    let hi = samples;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (lengths[mid] < targetLen) lo = mid + 1;
      else hi = mid;
    }
    const prevIdx = Math.max(0, lo - 1);
    const segLen = Math.max(1e-6, lengths[lo] - lengths[prevIdx]);
    const frac = (targetLen - lengths[prevIdx]) / segLen;
    const theta = -Math.PI / 2 + ((prevIdx + frac) / samples) * Math.PI * 2;
    const x = cx + rx * Math.cos(theta);
    const y = cy + ry * Math.sin(theta);
    const deg = (theta * 180) / Math.PI;
    result.push({ x, y, angle: deg });
  }

  return result;
}

/** Outward/inward direction for reminder stack leaning cleanly toward table center. */
export function stackAngle(
  at: SeatPosition,
  centre: Point2D,
  rx: number,
  ry: number,
  dimensions?: { size: number; chip: number }
): number {
  const dx = at.x - centre.x;
  const dy = at.y - centre.y;
  const weightX = rx > 0 ? dx / (rx * rx) : dx;
  const weightY = ry > 0 ? dy / (ry * ry) : dy;
  let angle = (Math.atan2(weightY, weightX) * 180) / Math.PI;
  if (dimensions && ry < rx * 0.72) {
    // Slightly soften vertical inward push on very wide ellipses so top/bottom stacks don't collide
    const vertFactor = Math.abs(Math.sin((angle * Math.PI) / 180));
    if (vertFactor > 0.75) {
      angle = (Math.atan2(dy, dx * 0.85) * 180) / Math.PI;
    }
  }
  return angle;
}

export function fitRing(band: Size2D, seats: number, startSize = MAX_TOKEN_SIZE): RingGeometry {
  const n = Math.max(1, seats);
  const padX = Math.max(14, Math.min(28, band.width * 0.03));
  const padTop = 14;
  const padBottom = 28; // space for seat name under bottom token

  for (let size = Math.min(MAX_TOKEN_SIZE, startSize); size >= MIN_TOKEN_SIZE; size -= REDUCE_STEP) {
    const nameH = SEAT_METRICS.seatNameSize(size) + SEAT_METRICS.nameGap + 6;
    const marginX = size / 2 + padX + NAME_MARGIN;
    const marginTop = size / 2 + padTop;
    const marginBottom = size / 2 + nameH + padBottom * 0.4;
    const rx = Math.max(60, band.width / 2 - marginX);
    const ry = Math.max(60, band.height / 2 - Math.max(marginTop, marginBottom));

    const positions = seatPositions(band, rx, ry, n);
    let minGap = Infinity;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = Math.hypot(positions[i].x - positions[j].x, positions[i].y - positions[j].y);
        if (dist < minGap) minGap = dist;
      }
    }

    const requiredDist = size + (n <= 10 ? 18 : 10);
    if (positions.length <= 1 || minGap >= requiredDist) {
      return {
        size,
        margin: marginX,
        band,
        rx,
        ry,
        aspect: rx / Math.max(1, ry),
        positions,
      };
    }
  }

  // Fallback minimum size
  const size = MIN_TOKEN_SIZE;
  const rx = Math.max(54, band.width / 2 - size / 2 - padX);
  const ry = Math.max(54, band.height / 2 - size / 2 - 26);
  return {
    size,
    margin: size / 2 + padX,
    band,
    rx,
    ry,
    aspect: rx / Math.max(1, ry),
    positions: seatPositions(band, rx, ry, n),
  };
}

/** Smart context menu anchor avoiding covering the selected token or neighboring seat centers. */
export function placeSeatMenu({
  at,
  size,
  centre,
  room,
  others,
  menu,
}: {
  at: Point2D;
  size: number;
  centre: Point2D;
  room: { left: number; top: number; right: number; bottom: number };
  others: readonly Point2D[];
  menu: Size2D;
}): { left: number; top: number } {
  const gap = 10;
  const clampX = (left: number) =>
    Math.max(room.left + gap, Math.min(room.right - menu.width - gap, left));
  const clampY = (top: number) =>
    Math.max(room.top + gap, Math.min(room.bottom - menu.height - gap, top));

  const besideTop = clampY(at.y - menu.height / 2);
  const belowTop = clampY(at.y + size / 2 + SEAT_METRICS.seatNameSize(size) + 18);
  const aboveTop = clampY(at.y - size / 2 - gap - menu.height);
  const inward = at.y <= centre.y ? [belowTop, aboveTop] : [aboveTop, belowTop];

  const candidates = [
    { left: clampX(at.x + size / 2 + gap), top: besideTop },
    { left: clampX(at.x - size / 2 - gap - menu.width), top: besideTop },
    ...inward.flatMap((top) =>
      [at.x - menu.width / 2, at.x < centre.x ? at.x : at.x - menu.width, centre.x - menu.width / 2].map(
        (left) => ({ left: clampX(left), top })
      )
    ),
  ];

  const overlapArea = (place: { left: number; top: number }, pt: Point2D, half: number) =>
    Math.max(0, Math.min(place.left + menu.width, pt.x + half) - Math.max(place.left, pt.x - half)) *
    Math.max(0, Math.min(place.top + menu.height, pt.y + half) - Math.max(place.top, pt.y - half));

  return candidates.reduce((best, place) => {
    const ownCover = overlapArea(place, at, size / 2 + 4) - overlapArea(best, at, size / 2 + 4);
    const otherHits = others.filter((pt) => overlapArea(place, pt, 8) > 0).length;
    const bestHits = others.filter((pt) => overlapArea(best, pt, 8) > 0).length;
    return ownCover < 0 || (ownCover === 0 && otherHits < bestHits) ? place : best;
  });
}

/** Clockwise brass voting arc path around the ellipse from nominee to furthest recorded hand. */
export function voteArc(
  band: Size2D,
  rx: number,
  ry: number,
  tokenSize: number,
  seatCount: number,
  nominee: SeatPosition,
  reached?: SeatPosition
): {
  path: string;
  lit: number;
  arrow: { x: number; y: number; angle: number };
} | null {
  if (seatCount < 2) return null;
  const cx = band.width / 2;
  const cy = band.height / 2;
  const inset = Math.max(12, Math.min(rx, ry) - tokenSize * 0.56);
  const ratio = Math.min(rx, ry) > 0 ? inset / Math.min(rx, ry) : 0.72;
  const arx = Math.max(36, rx * ratio);
  const ary = Math.max(36, ry * ratio);

  const startRad = (nominee.angle * Math.PI) / 180;
  // Build full clockwise circle starting just after nominee
  const steps = 64;
  const pts: Point2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = startRad + (i / steps) * Math.PI * 2;
    pts.push({ x: cx + arx * Math.cos(t), y: cy + ary * Math.sin(t) });
  }
  const path =
    `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} ` +
    pts
      .slice(1)
      .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

  let lit = 0.06;
  let endRad = startRad + lit * Math.PI * 2;
  if (reached) {
    let diff = ((reached.angle - nominee.angle) % 360 + 360) % 360;
    if (diff < 8) diff = 360; // reached back to nominee himself closes circle!
    lit = Math.max(0.08, Math.min(1, diff / 360));
    endRad = startRad + lit * Math.PI * 2;
  }

  const ax = cx + arx * Math.cos(endRad);
  const ay = cy + ary * Math.sin(endRad);
  // Tangent vector clockwise: (-arx*sin(t), ary*cos(t))
  const tx = -arx * Math.sin(endRad);
  const ty = ary * Math.cos(endRad);
  const arrowAngle = (Math.atan2(ty, tx) * 180) / Math.PI;

  return {
    path,
    lit,
    arrow: { x: ax, y: ay, angle: arrowAngle },
  };
}
