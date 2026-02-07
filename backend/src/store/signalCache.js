
const deliveredSignals = new Map();

export function hasSeenSignal(userId, otherUserId) {
  return deliveredSignals.get(userId)?.has(otherUserId);
}

export function markSignalSeen(userId, otherUserId) {
  if (!deliveredSignals.has(userId)) {
    deliveredSignals.set(userId, new Set());
  }
  deliveredSignals.get(userId).add(otherUserId);
}

// optional cleanup
setInterval(() => {
  deliveredSignals.clear();
}, 100 * 60_000); // reset every 100 min
