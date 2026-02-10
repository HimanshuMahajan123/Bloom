// locationStore.js


// cellKey -> Set<userId>
const spatialGrid = new Map();

// userId -> cellKey
const userCellIndex = new Map();

// userId -> { lat, lng, updatedAt }
const userLocation = new Map();

/* ---------- helpers ---------- */

const CELL_SIZE = 0.0005;

function getCellKey(lat, lng) {
  return `${Math.floor(lat / CELL_SIZE)}:${Math.floor(lng / CELL_SIZE)}`;
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

/* ---------- public API ---------- */

export function updateUserLocation(userId, lat, lng) {
  console.log(`Updating location for user ${userId}: (${lat}, ${lng})`);
  const prev = userLocation.get(userId);
if (prev && !movedSignificantly(prev, lat, lng)) {
  userLocation.set(userId, { ...prev, updatedAt: Date.now() });
  return;
}

  const newCell = getCellKey(lat, lng);
  const oldCell = userCellIndex.get(userId);

  // remove from old cell
  if (oldCell && spatialGrid.has(oldCell)) {
    spatialGrid.get(oldCell).delete(userId);
  }

  // add to new cell
  if (!spatialGrid.has(newCell)) {
    spatialGrid.set(newCell, new Set());
  }
  spatialGrid.get(newCell).add(userId);

  userCellIndex.set(userId, newCell);
  userLocation.set(userId, {
    lat,
    lng,
    updatedAt: Date.now(),
  });
}

export function getNearbyUsers(userId, radius = 50) {
  const loc = userLocation.get(userId);
  if (!loc) return [];
  console.log(
    `Finding nearby users for ${userId} at (${loc.lat}, ${loc.lng}) within ${radius}m`,
  );
  const cellKey = userCellIndex.get(userId);
  if (!cellKey) return [];
  console.log(`User ${userId} is in cell ${cellKey}`);
  const candidates = new Set();

  for (const neighbor of getNeighborCells(cellKey , radius)) {
    const users = spatialGrid.get(neighbor);
    if (!users) continue;
    for (const uid of users) {
      console.log(`Neighbor cell ${neighbor} has user ${uid}`);
      if (uid !== userId) candidates.add(uid);
    }
  }
  console.log("candidates are ", candidates);
  const nearby = [];
  for (const uid of candidates) {
    const other = userLocation.get(uid);
    console.log(`Checking candidate ${uid} with location:`, other);
    if (!other) continue;
    console.log(
      `Checking distance to user ${uid} at (${other.lat}, ${other.lng})`,
    );
    // stale location guard
if (Date.now() - other.updatedAt > 30_000) continue;
    console.log(
      `Distance to user ${uid} is ${distanceMeters(loc.lat, loc.lng, other.lat, other.lng)} meters`,
    );
    const d = distanceMeters(loc.lat, loc.lng, other.lat, other.lng);
    console.log(`Distance to user ${uid} is ${d} meters`);
    if (d <= radius) nearby.push(uid);
  }

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
    }
  }
}, 30_000);
