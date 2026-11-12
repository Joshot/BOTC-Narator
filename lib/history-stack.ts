/**
 * Pure immutable Undo/Redo stack helpers keyed cleanly per game room.
 */
export interface HistoryStack<T> {
  undo: T[];
  redo: T[];
}

export function createEmptyHistory<T>(): HistoryStack<T> {
  return { undo: [], redo: [] };
}

/**
 * Push a snapshot onto the undo stack and clear any stale redo branch.
 */
export function pushHistorySnapshot<T>(
  stack: HistoryStack<T> | undefined,
  snapshot: T,
  maxDepth = 30
): HistoryStack<T> {
  const undo = [...(stack?.undo ?? []), snapshot].slice(-maxDepth);
  return { undo, redo: [] };
}

function stepHistoryDirection<T>(
  stack: HistoryStack<T> | undefined,
  currentSnapshot: T,
  direction: 'undo' | 'redo',
  maxDepth = 30
): { nextStack: HistoryStack<T>; restored: T | null } {
  const source = direction === 'undo' ? stack?.undo ?? [] : stack?.redo ?? [];
  const target = direction === 'undo' ? stack?.redo ?? [] : stack?.undo ?? [];
  if (source.length === 0) {
    return { nextStack: stack ?? createEmptyHistory<T>(), restored: null };
  }
  const restored = source[source.length - 1];
  const nextSource = source.slice(0, -1);
  const nextTarget = [...target, currentSnapshot].slice(-maxDepth);
  return {
    nextStack:
      direction === 'undo'
        ? { undo: nextSource, redo: nextTarget }
        : { undo: nextTarget, redo: nextSource },
    restored,
  };
}

export function stepHistoryUndo<T>(
  stack: HistoryStack<T> | undefined,
  currentSnapshot: T,
  maxDepth = 30
): { nextStack: HistoryStack<T>; restored: T | null } {
  return stepHistoryDirection(stack, currentSnapshot, 'undo', maxDepth);
}

export function stepHistoryRedo<T>(
  stack: HistoryStack<T> | undefined,
  currentSnapshot: T,
  maxDepth = 30
): { nextStack: HistoryStack<T>; restored: T | null } {
  return stepHistoryDirection(stack, currentSnapshot, 'redo', maxDepth);
}
