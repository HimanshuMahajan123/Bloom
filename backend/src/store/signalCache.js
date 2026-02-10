const deliveredSignals = new Map();
// userId -> Map<otherUserId, timestamp>

const TTL = 30 * 60_000; // 30 min

export function hasSeenSignal(userId, otherUserId) {
  const map = deliveredSignals.get(userId);
  if (!map) return false;

  const ts = map.get(otherUserId);
  if (!ts) return false;

  if (Date.now() - ts > TTL) {
    map.delete(otherUserId);
    return false;
  }

  return true;
}

export function markSignalSeen(userId, otherUserId) {
  if (!deliveredSignals.has(userId)) {
    deliveredSignals.set(userId, new Map());
  }

  deliveredSignals.get(userId).set(otherUserId, Date.now());
}

// periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [uid, map] of deliveredSignals.entries()) {
    for (const [other, ts] of map.entries()) {
      if (now - ts > TTL) map.delete(other);
    }
    if (map.size === 0) deliveredSignals.delete(uid);
  }
}, 5 * 60_000);
