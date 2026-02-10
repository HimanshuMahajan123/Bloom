// locationStore.js

// cellKey -> Set<userId>
const spatialGrid = new Map();

// userId -> cellKey
const userCellIndex = new Map();

// userId -> { lat, lng, updatedAt }
const userLocation = new Map();

/* ---------- helpers ---------- */

const CELL_SIZE = 0.0005; // ~55m per cell

function getCellKey(lat, lng) {
  return `${Math.floor(lat / CELL_SIZE)}:${Math.floor(lng / CELL_SIZE)}`;
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function movedSignificantly(oldLoc, newLat, newLng, threshold = 10) {
  if (!oldLoc) return true;
  const d = distanceMeters(oldLoc.lat, oldLoc.lng, newLat, newLng);
  return d >= threshold;
}

function getNeighborCells(cellKey, radiusMeters) {
  const [x, y] = cellKey.split(":").map(Number);
  const range = Math.ceil(radiusMeters / 55);

  const cells = [];
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      cells.push(`${x + dx}:${y + dy}`);
    }
  }
  return cells;
}

/* ---------- public API ---------- */

export function updateUserLocation(userId, lat, lng) {
  const tag = `[LOC:${userId.slice(0, 6)}]`;
  const now = Date.now();

  const prev = userLocation.get(userId);

  // Always refresh presence
  if (prev && !movedSignificantly(prev, lat, lng)) {
    userLocation.set(userId, {
      ...prev,
      updatedAt: now,
    });
    console.log(`${tag} presence refreshed (no movement)`);
    return;
  }

  const newCell = getCellKey(lat, lng);
  const oldCell = userCellIndex.get(userId);

  if (oldCell && spatialGrid.has(oldCell)) {
    spatialGrid.get(oldCell).delete(userId);
  }

  if (!spatialGrid.has(newCell)) {
    spatialGrid.set(newCell, new Set());
  }
  spatialGrid.get(newCell).add(userId);

  userCellIndex.set(userId, newCell);
  userLocation.set(userId, {
    lat,
    lng,
    updatedAt: now,
  });

  console.log(
    `${tag} moved → cell=${newCell} lat=${lat.toFixed(6)} lng=${lng.toFixed(6)}`
  );
}


export function getNearbyUsers(userId, radius = 50) {
  const tag = `[PROX:${userId.slice(0, 6)}]`;

  const loc = userLocation.get(userId);
  if (!loc) {
    console.log(`${tag} no location found`);
    return [];
  }

  const cellKey = userCellIndex.get(userId);
  if (!cellKey) {
    console.log(`${tag} no cell index`);
    return [];
  }

  console.log(
    `${tag} scan start → cell=${cellKey} radius=${radius}m`,
  );

  const candidates = new Set();

  for (const neighbor of getNeighborCells(cellKey, radius)) {
    const users = spatialGrid.get(neighbor);
    if (!users) continue;

    for (const uid of users) {
      if (uid !== userId) {
        candidates.add(uid);
        console.log(`${tag} raw candidate → ${uid.slice(0, 6)} from ${neighbor}`);
      }
    }
  }

  if (!candidates.size) {
    console.log(`${tag} no nearby candidates`);
    return [];
  }

  const nearby = [];

  for (const uid of candidates) {
    const other = userLocation.get(uid);
    if (!other) {
      console.log(`${tag} drop ${uid.slice(0, 6)} → no location`);
      continue;
    }

    if (Date.now() - other.updatedAt > 180_000) { // 5 mins 
      console.log(`${tag} drop ${uid.slice(0, 6)} → stale location`);
      continue;
    }

    const d = distanceMeters(loc.lat, loc.lng, other.lat, other.lng);

    if (d <= radius) {
      nearby.push(uid);
      console.log(
        `${tag} accept ${uid.slice(0, 6)} → ${d.toFixed(1)}m`,
      );
    } else {
      console.log(
        `${tag} reject ${uid.slice(0, 6)} → ${d.toFixed(1)}m (too far)`,
      );
    }
  }

  console.log(
    `${tag} scan end → ${nearby.length} users`,
    nearby.map((u) => u.slice(0, 6)),
  );

  return nearby;
}

/* ---------- cleanup ---------- */

// runs every 30s
setInterval(() => {
  const now = Date.now();
  for (const [uid, loc] of userLocation.entries()) {
    if (now - loc.updatedAt > 60_000) {
      const cell = userCellIndex.get(uid);
      spatialGrid.get(cell)?.delete(uid);
      userLocation.delete(uid);
      userCellIndex.delete(uid);

      console.log(`[CLEAN] removed ${uid.slice(0, 6)} → stale`);
    }
  }
}, 30_000);
