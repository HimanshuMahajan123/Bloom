// locationStore.js

const CELL_SIZE = 0.0005; // ~50 meters

// cellKey -> Set<userId>
const spatialGrid = new Map();

// userId -> cellKey
const userCellIndex = new Map();

// userId -> { lat, lng, updatedAt }
const userLocation = new Map();

/* ---------- helpers ---------- */

function getCellKey(lat, lng) {
  const x = Math.floor(lat / CELL_SIZE);
  const y = Math.floor(lng / CELL_SIZE);
  return `${x}:${y}`;
}

function getNeighborCells(cellKey) {
  const [x, y] = cellKey.split(":").map(Number);
  const cells = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
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

  for (const neighbor of getNeighborCells(cellKey)) {
    const users = spatialGrid.get(neighbor);
    if (!users) continue;
    for (const uid of users) {
      console.log(`Neighbor cell ${neighbor} has user ${uid}`);
      if (uid !== userId) candidates.add(uid);
    }
  }

  const nearby = [];
  for (const uid of candidates) {
    const other = userLocation.get(uid);
    if (!other) continue;
    console.log(
      `Checking distance to user ${uid} at (${other.lat}, ${other.lng})`,
    );
    // stale location guard
    if (new Date(Date.now()) - other.updatedAt > 30_000) continue;
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
