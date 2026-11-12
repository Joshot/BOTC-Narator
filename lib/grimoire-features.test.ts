import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_TB_ROLES,
  ROLES,
  TB_TRAVELLERS,
  calculateBalancedBag,
  getCustomNoteText,
  noteInitials,
} from './botc-data.ts';
import {
  addPlayerSeat,
  calculateNominationThresholds,
  canSeatNominate,
  getActiveReminderTokensForSeats,
  getPlayerAlignment,
  removePlayerSeat,
  rotatePlayerSeats,
} from './botc-engine.ts';
import type { DayNomination, PlayerSeat } from './botc-engine.ts';
import {
  fitRing,
  placeSeatMenu,
  reminderStack,
  voteArc,
} from './ring-geometry.ts';
import {
  createBagPile,
  createSpreadLayout,
  stirBagPile,
} from './bag-physics.ts';

function sampleSeats(count = 7): PlayerSeat[] {
  const rolePool = ['washerwoman', 'librarian', 'chef', 'empath', 'saint', 'poisoner', 'imp'];
  return Array.from({ length: count }, (_, idx) => ({
    id: `seat-${idx + 1}`,
    seatIndex: idx,
    name: `Pemain ${idx + 1}`,
    trueRoleId: rolePool[idx % rolePool.length],
    perceivedRoleId: rolePool[idx % rolePool.length],
    isAlive: true,
    hasGhostVote: true,
    reminders: [],
  }));
}

test('Trouble Brewing script contains all 22 core roles and 5 TB Travellers', () => {
  assert.equal(ROLES.length, 22);
  assert.equal(TB_TRAVELLERS.length, 5);
  assert.equal(ALL_TB_ROLES.length, 27);
  assert.equal(ROLES.filter((r) => r.team === 'demon').length, 1);
  assert.equal(ROLES.find((r) => r.id === 'demon_none'), undefined);
});

test('addPlayerSeat, removePlayerSeat, and rotatePlayerSeats keep sequential seatIndex', () => {
  const initial = sampleSeats(6);
  const added = addPlayerSeat(initial, 2, 'Bureaucrat Baru', 'bureaucrat');
  assert.equal(added.length, 7);
  assert.equal(added[2].name, 'Bureaucrat Baru');
  assert.equal(added[2].trueRoleId, 'bureaucrat');
  assert.deepEqual(
    added.map((s) => s.seatIndex),
    [0, 1, 2, 3, 4, 5, 6]
  );

  const rotatedCw = rotatePlayerSeats(added, 'cw');
  assert.equal(rotatedCw[0].id, added[added.length - 1].id);
  assert.equal(rotatedCw[0].seatIndex, 0);

  const removed = removePlayerSeat(rotatedCw, rotatedCw[0].id);
  assert.equal(removed.length, 6);
  assert.deepEqual(
    removed.map((s) => s.seatIndex),
    [0, 1, 2, 3, 4, 5]
  );
});

test('getPlayerAlignment respects manual override for Travellers/Spy/Recluse', () => {
  const seat = sampleSeats(5)[0];
  assert.equal(getPlayerAlignment(seat), 'good');
  const evilOverride: PlayerSeat = { ...seat, alignment: 'evil' };
  assert.equal(getPlayerAlignment(evilOverride), 'evil');

  const demonSeat = sampleSeats(7)[6];
  assert.equal(getPlayerAlignment(demonSeat), 'evil');
});

test('nominations enforce once-per-day rules and calculate tie / execution threshold', () => {
  const seats = sampleSeats(7);
  const noms: DayNomination[] = [
    {
      id: 'nom-1',
      dayNumber: 1,
      nominatorId: seats[0].id,
      nomineeId: seats[6].id,
      voterIds: [seats[0].id, seats[1].id, seats[2].id, seats[3].id],
      voteTotal: 4,
      markedForExecution: true,
    },
  ];

  // Seat 0 already nominated today, seat 6 already nominated today
  assert.equal(canSeatNominate(noms, seats[0].id, seats[5].id, seats), false);
  assert.equal(canSeatNominate(noms, seats[1].id, seats[6].id, seats), false);
  assert.equal(canSeatNominate(noms, seats[1].id, seats[5].id, seats), true);

  const threshold = calculateNominationThresholds(seats, noms);
  assert.equal(threshold.highestVotes, 4);
  assert.equal(threshold.execute, 5);
  assert.equal(threshold.tie, 4);
  assert.equal(threshold.onBlockSeatId, seats[6].id);
});

test('custom note initials and died_today Undertaker reminder helpers', () => {
  assert.equal(noteInitials('Cek Chef 1'), 'CC1');
  assert.equal(noteInitials('Klaim'), 'KLA');
  assert.equal(getCustomNoteText('note:Klaim Empath 0'), 'Klaim Empath 0');

  const seats = sampleSeats(7);
  seats[2] = { ...seats[2], trueRoleId: 'undertaker', perceivedRoleId: 'undertaker' };
  const activeTokens = getActiveReminderTokensForSeats(seats);
  assert.ok(activeTokens.some((t) => t.id === 'died_today'));
});

test('calculateBalancedBag builds exact Trouble Brewing player counts with balanced Townsfolk', () => {
  for (const count of [5, 7, 10, 13, 15]) {
    const res = calculateBalancedBag(count);
    assert.equal(res.selectedRoleIds.length, count);
    assert.ok(res.selectedRoleIds.includes('imp'));
    assert.ok(res.formulaDetails.length >= 4);
  }
});

test('ring-geometry fits non-overlapping seats, inward stacks, menu placement, and voting arc', () => {
  const ring = fitRing({ width: 760, height: 520 }, 12);
  assert.equal(ring.positions.length, 12);
  assert.ok(ring.size >= 42 && ring.size <= 112);

  const stack = reminderStack(ring.size, ring.positions[0].angle, 3, false);
  assert.equal(stack.points.length, 3);

  const menuPos = placeSeatMenu({
    at: ring.positions[0],
    size: ring.size,
    centre: { x: 380, y: 260 },
    room: { left: 8, top: 8, right: 752, bottom: 512 },
    others: ring.positions.slice(1),
    menu: { width: 260, height: 340 },
  });
  assert.ok(menuPos.left >= 8 && menuPos.top >= 8);

  const arc = voteArc(ring.band, ring.rx, ring.ry, ring.size, 12, ring.positions[0], ring.positions[5]);
  assert.ok(arc && arc.lit > 0.25 && arc.lit < 0.75);
});

test('bag-physics initializes pile within bounds, stirs smoothly, and creates spread layout', () => {
  const bounds = { cx: 280, cy: 190, rx: 220, ry: 150, tokenSize: 76 };
  const pile = createBagPile(10, bounds);
  assert.equal(pile.length, 10);

  const stirred = stirBagPile(pile, bounds, 280, 190, 24, -12, pile[0].id);
  assert.equal(stirred.length, 10);
  for (const body of stirred) {
    assert.ok(Number.isFinite(body.x) && Number.isFinite(body.y));
  }

  const spread = createSpreadLayout(10, 560, 380);
  assert.equal(spread.length, 10);
  assert.ok(spread[0].size >= 52);
});
