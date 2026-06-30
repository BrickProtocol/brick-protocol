const STORAGE_KEY = "brick-portal-state-v1";
const APP_SCHEMA_VERSION = 2;

const BRICK_TYPES = [
  {
    id: "ruby-red",
    label: "Ruby Red",
    short: "RR",
    color: "#e11d2e",
    share: 2.0,
    tier: "Mythic",
    note: "Mythic · 2.0%",
  },
  {
    id: "emerald",
    label: "Emerald",
    short: "EM",
    color: "#1bb56b",
    share: 2.5,
    tier: "Mythic",
    note: "Mythic · 2.5%",
  },
  {
    id: "sapphire",
    label: "Sapphire",
    short: "SP",
    color: "#2668ff",
    share: 3.0,
    tier: "Legendary",
    note: "Legendary · 3.0%",
  },
  {
    id: "violet",
    label: "Violet",
    short: "VI",
    color: "#7a2cf0",
    share: 3.5,
    tier: "Legendary",
    note: "Legendary · 3.5%",
  },
  {
    id: "rose",
    label: "Rose",
    short: "RO",
    color: "#ea5ba7",
    share: 4.0,
    tier: "Epic",
    note: "Epic · 4.0%",
  },
  {
    id: "amber",
    label: "Amber",
    short: "AM",
    color: "#f58a17",
    share: 4.5,
    tier: "Epic",
    note: "Epic · 4.5%",
  },
  {
    id: "cyan",
    label: "Cyan",
    short: "CY",
    color: "#21c6d8",
    share: 5.0,
    tier: "Epic",
    note: "Epic · 5.0%",
  },
  {
    id: "citrine",
    label: "Citrine",
    short: "CI",
    color: "#f1cf28",
    share: 5.5,
    tier: "Rare",
    note: "Rare · 5.5%",
  },
  {
    id: "teal",
    label: "Teal",
    short: "TE",
    color: "#2fb6a8",
    share: 6.5,
    tier: "Rare",
    note: "Rare · 6.5%",
  },
  {
    id: "magenta",
    label: "Magenta",
    short: "MG",
    color: "#d34ee2",
    share: 7.0,
    tier: "Rare",
    note: "Rare · 7.0%",
  },
  {
    id: "lime",
    label: "Lime",
    short: "LM",
    color: "#9ad318",
    share: 7.5,
    tier: "Uncommon",
    note: "Uncommon · 7.5%",
  },
  {
    id: "indigo",
    label: "Indigo",
    short: "IN",
    color: "#4753e8",
    share: 8.0,
    tier: "Uncommon",
    note: "Uncommon · 8.0%",
  },
  {
    id: "slate",
    label: "Slate",
    short: "SL",
    color: "#8b98a8",
    share: 9.0,
    tier: "Common",
    note: "Common · 9.0%",
  },
  {
    id: "bronze",
    label: "Bronze",
    short: "BR",
    color: "#a66a2d",
    share: 9.5,
    tier: "Common",
    note: "Common · 9.5%",
  },
  {
    id: "ash",
    label: "Ash",
    short: "AS",
    color: "#c1c7d0",
    share: 10.0,
    tier: "Common",
    note: "Common · 10.0%",
  },
  {
    id: "clear",
    label: "Clear",
    short: "CL",
    color: "#ece9de",
    share: 12.5,
    tier: "Common",
    note: "Common · 12.5%",
  },
];

const BRICK_TYPE_MAP = Object.fromEntries(BRICK_TYPES.map((type) => [type.id, type]));

const BRICK_POOL_TOTAL = 1_000_000;
const BRICK_POOL_STACK_COUNT = 500;
const BRICKS_PER_HACD_STACK = BRICK_POOL_TOTAL / BRICK_POOL_STACK_COUNT;
const DAILY_BRICK_REWARD_HOUR = 1;
const DAILY_BRICK_REWARD_PER_HACD = 3;
const DAILY_BRICK_REWARD_PER_WORKER = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const LEGACY_BRICK_TYPE_MAP = {
  ember: "ruby-red",
  clay: "bronze",
  sand: "citrine",
  coal: "slate",
  coral: "rose",
  amber: "amber",
  moss: "emerald",
  olive: "lime",
  slate: "slate",
  steel: "ash",
  cocoa: "bronze",
  plum: "violet",
  mint: "cyan",
  ivory: "clear",
  burgundy: "magenta",
  navy: "indigo",
};

function normalizeBrickTypeId(value, fallbackIndex = 0) {
  const key = String(value || "").trim().toLowerCase();
  if (BRICK_TYPE_MAP[key]) {
    return key;
  }

  if (LEGACY_BRICK_TYPE_MAP[key]) {
    return LEGACY_BRICK_TYPE_MAP[key];
  }

  return BRICK_TYPES[fallbackIndex % BRICK_TYPES.length].id;
}

function buildBrickPool(total = BRICK_POOL_TOTAL) {
  return allocateBrickCounts(total);
}

const BRICK_POOL_COUNTS = buildBrickPool();

function allocateBrickCounts(totalBricks) {
  const requestedTotal = Math.max(0, Math.round(Number(totalBricks) || 0));
  const allocation = Object.fromEntries(BRICK_TYPES.map((type) => [type.id, 0]));
  const exactShares = BRICK_TYPES.map((type) => {
    const exact = (requestedTotal * type.share) / 100;
    const floor = Math.floor(exact);
    allocation[type.id] = floor;
    return {
      id: type.id,
      fraction: exact - floor,
    };
  });

  let remainder = requestedTotal - Object.values(allocation).reduce((sum, value) => sum + value, 0);
  if (remainder > 0) {
    exactShares.sort((a, b) => b.fraction - a.fraction);
    for (let index = 0; index < remainder; index += 1) {
      const item = exactShares[index % exactShares.length];
      allocation[item.id] += 1;
    }
  }

  return allocation;
}

function cloneBrickCounts(source = {}) {
  return Object.fromEntries(
    BRICK_TYPES.map((type) => {
      const amount = Number(source?.[type.id]);
      return [type.id, Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0];
    }),
  );
}

function normalizeBrickPoolCounts(rawPool) {
  if (!rawPool || typeof rawPool !== "object") {
    return cloneBrickCounts(BRICK_POOL_COUNTS);
  }

  return cloneBrickCounts(rawPool);
}

function formatLocalDateKey(date) {
  const safeDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(safeDate.getTime())) {
    return "";
  }

  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftLocalDateKey(dateKey, offsetDays) {
  const [year, month, day] = String(dateKey || "").split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return "";
  }

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + Number(offsetDays || 0));
  return formatLocalDateKey(date);
}

function getCurrentRewardCycleKey(now = new Date()) {
  const date = now instanceof Date ? new Date(now) : new Date(now);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (date.getHours() < DAILY_BRICK_REWARD_HOUR) {
    date.setDate(date.getDate() - 1);
  }

  return formatLocalDateKey(date);
}

function getBootstrapRewardLedgerCycleKey(now = new Date()) {
  const currentCycleKey = getCurrentRewardCycleKey(now);
  if (!currentCycleKey) {
    return "";
  }

  const date = now instanceof Date ? new Date(now) : new Date(now);
  if (Number.isNaN(date.getTime())) {
    return currentCycleKey;
  }

  if (date.getHours() < DAILY_BRICK_REWARD_HOUR) {
    return currentCycleKey;
  }

  return shiftLocalDateKey(currentCycleKey, -1);
}

function getRewardLedgerKey(address) {
  const safeAddress = String(address || "").trim();
  return safeAddress || "__anonymous__";
}

function getPoolRemainingTotal(pool = state.brickPoolRemaining) {
  return BRICK_TYPES.reduce((sum, type) => sum + Number(pool?.[type.id] || 0), 0);
}

function drawRandomBrickTypeFromPool() {
  const pool = state.brickPoolRemaining;
  const total = getPoolRemainingTotal(pool);
  if (total <= 0) {
    return null;
  }

  let cursor = Math.floor(Math.random() * total);
  for (const type of BRICK_TYPES) {
    const available = Number(pool[type.id] || 0);
    if (available <= 0) {
      continue;
    }

    if (cursor < available) {
      pool[type.id] = available - 1;
      return type.id;
    }

    cursor -= available;
  }

  return null;
}

const ASSET_SHAPE_GRID_SIZE = 28;

const SHAPES = [
  {
    id: "heart",
    label: "Heart",
    subtitle: "Emotional shape",
    accent: "#f06e3c",
    path: "M50 85 L16 51 L16 30 L28 16 L40 16 L50 27 L60 16 L72 16 L84 30 L84 51 Z",
  },
  {
    id: "emerald",
    label: "Emerald",
    subtitle: "Rectangular shape",
    accent: "#d39a69",
    path: "M26 12 L74 12 L88 26 L88 74 L74 88 L26 88 L12 74 L12 26 Z",
  },
  {
    id: "circle",
    label: "Halo",
    subtitle: "Circular shape",
    accent: "#e4c391",
    path: "M50 10 A40 40 0 1 1 49.999 10 Z",
  },
  {
    id: "pear",
    label: "Pear",
    subtitle: "Soft shape",
    accent: "#8d3a52",
    path: "M50 12 C68 21 82 39 82 58 C82 78 68 90 50 90 C32 90 18 78 18 58 C18 39 32 21 50 12 Z",
  },
  {
    id: "diamond",
    label: "Diamond",
    subtitle: "Angular shape",
    accent: "#8ea0ad",
    path: "M50 12 L82 28 L92 44 L50 90 L8 44 L18 28 Z",
  },
  {
    id: "oval",
    label: "Oval",
    subtitle: "Long shape",
    accent: "#7d5b8b",
    path: "M50 8 C67 8 80 25 80 50 C80 75 67 92 50 92 C33 92 20 75 20 50 C20 25 33 8 50 8 Z",
  },
  {
    id: "triangle",
    label: "Triangle",
    subtitle: "Peak shape",
    accent: "#718b4e",
    path: "M50 10 L92 88 L8 88 Z",
  },
  {
    id: "thin-diamond",
    label: "Slim Diamond",
    subtitle: "Narrow shape",
    accent: "#6cb6a8",
    path: "M50 8 L74 28 L86 50 L74 72 L50 92 L26 72 L14 50 L26 28 Z",
  },
  {
    id: "hexagon",
    label: "Hexagon",
    subtitle: "Polygon shape",
    accent: "#3f5572",
    path: "M50 7 L80 25 L80 75 L50 93 L20 75 L20 25 Z",
  },
];

const SHAPE_MAP = Object.fromEntries(SHAPES.map((shape) => [shape.id, shape]));

function buildShapeRowsFromPath(pathData, gridSize = ASSET_SHAPE_GRID_SIZE) {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");

  if (!ctx || typeof Path2D === "undefined") {
    return Array.from({ length: gridSize }, () => "1".repeat(gridSize));
  }

  const path = new Path2D(pathData);

  return Array.from({ length: gridSize }, (_, rowIndex) => {
    let row = "";

    for (let colIndex = 0; colIndex < gridSize; colIndex += 1) {
      const x = ((colIndex + 0.5) / gridSize) * 100;
      const y = ((rowIndex + 0.5) / gridSize) * 100;
      row += ctx.isPointInPath(path, x, y) ? "1" : "0";
    }

    return row;
  });
}

function prepareAssetShapes() {
  SHAPES.forEach((shape) => {
    shape.rows = buildShapeRowsFromPath(shape.path);
    shape.size = shape.rows[0]?.length || ASSET_SHAPE_GRID_SIZE;
    shape.totalCells = countShapeCells(shape.rows);
  });
}

const DEMO_WALLET_RAW = {
  address: "0xB74C8A93A19F",
  network: "HACD Mainline",
  source: "Demo Gateway",
  isDemo: true,
  assets: [
    {
      id: "stack-ember",
      name: "HACD Stack 01",
      symbol: "HACD",
      amount: 2000,
      brickCount: 2000,
      brick: true,
      brickType: "ember",
      source: "Vault A",
      lock: "14 days",
      status: "stacked",
    },
    {
      id: "stack-clay",
      name: "HACD Stack 02",
      symbol: "HACD",
      amount: 2000,
      brickCount: 2000,
      brick: true,
      brickType: "clay",
      source: "Vault B",
      lock: "28 days",
      status: "stacked",
    },
    {
      id: "stack-coal",
      name: "HACD Stack 03",
      symbol: "HACD",
      amount: 2000,
      brickCount: 2000,
      brick: true,
      brickType: "coal",
      source: "Vault C",
      lock: "7 days",
      status: "stacked",
    },
  ],
};

const state = {
  schemaVersion: 0,
  connected: false,
  demoMode: false,
  wallet: null,
  dashboardVisible: true,
  activeDashboardView: "stack",
  selectedShapeId: "heart",
  selectedWorkerId: null,
  assetDetailId: null,
  drafts: {},
  inventory: {},
  brickPoolRemaining: cloneBrickCounts(BRICK_POOL_COUNTS),
  dailyRewardLedger: {},
  lastWalletAddress: "",
  completedAssets: [],
  workers: [],
  saleDraftId: null,
};

let dailyRewardTimerId = null;
let rewardCountdownTickerId = null;

const $ = (id) => document.getElementById(id);

const els = {
  appShell: $("appShell"),
  dashboardSection: $("dashboardSection"),
  rewardCountdown: $("rewardCountdown"),
  walletStatus: $("walletStatus"),
  walletAddress: $("walletAddress"),
  connectButton: $("connectButton"),
  clearDraftButton: $("clearDraftButton"),
  dashboardNav: $("dashboardNav"),
  stackGrid: $("stackGrid"),
  stackTabCount: $("stackTabCount"),
  workerTabCount: $("workerTabCount"),
  stackBrickSection: $("stackBrickSection"),
  workersSection: $("workersSection"),
  createWorkerButton: $("createWorkerButton"),
  workerQuotaText: $("workerQuotaText"),
  workerGrid: $("workerGrid"),
  workerEmpty: $("workerEmpty"),
  constructionSection: $("constructionSection"),
  constructionWorkerGrid: $("constructionWorkerGrid"),
  constructionWorkerEmpty: $("constructionWorkerEmpty"),
  constructionComplete: $("constructionComplete"),
  sendAssetButton: $("sendAssetButton"),
  assetsSection: $("assetsSection"),
  shapeTabs: $("shapeTabs"),
  shapeTitle: $("shapeTitle"),
  builderProgress: $("builderProgress"),
  boardGrid: $("boardGrid"),
  brickPalette: $("brickPalette"),
  assetGrid: $("assetGrid"),
  assetEmpty: $("assetEmpty"),
  assetModal: $("assetModal"),
  assetModalTitle: $("assetModalTitle"),
  assetModalMeta: $("assetModalMeta"),
  assetModalPreview: $("assetModalPreview"),
  assetModalColors: $("assetModalColors"),
  saleModal: $("saleModal"),
  saleModalTitle: $("saleModalTitle"),
  saleForm: $("saleForm"),
  saleHacInput: $("saleHacInput"),
  saleHacdInput: $("saleHacdInput"),
  saleError: $("saleError"),
  workerModal: $("workerModal"),
  workerModalTitle: $("workerModalTitle"),
  workerForm: $("workerForm"),
  workerNameInput: $("workerNameInput"),
  workerError: $("workerError"),
  toast: $("toast"),
};

const formatNumber = (value, digits = 2) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

const formatInteger = (value) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(
    Number.isFinite(Number(value)) ? Number(value) : 0,
  );

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const shortAddress = (address) => {
  if (!address) {
    return "-";
  }

  const text = String(address);
  if (text.length <= 10) {
    return text;
  }

  return `${text.slice(0, 6)}…${text.slice(-4)}`;
};

const countShapeCells = (rows) =>
  rows.reduce((total, row) => total + row.split("").filter((cell) => cell === "1").length, 0);

function normalizePlacements(rawPlacements) {
  const placements = {};

  if (!rawPlacements || typeof rawPlacements !== "object") {
    return placements;
  }

  Object.entries(rawPlacements).forEach(([cellKey, placement]) => {
    if (!placement || typeof placement !== "object") {
      return;
    }

    const brickType = normalizeBrickTypeId(placement.brickType, 0);
    placements[cellKey] = {
      id: placement.id || makeId("brick"),
      brickType,
      color: BRICK_TYPE_MAP[brickType].color,
      placedAt: placement.placedAt || new Date().toISOString(),
    };
  });

  return placements;
}

prepareAssetShapes();

function makeId(prefix = "id") {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isBrickAsset(asset) {
  if (!asset || typeof asset !== "object") {
    return false;
  }

  if (asset.brick === true || asset.isBrick === true || asset.bricked === true) {
    return true;
  }

  const category = String(asset.category || asset.type || asset.kind || "").toLowerCase();
  if (
    category === "brick" ||
    category === "brick-stack" ||
    category === "brick-hacd" ||
    category === "brick_hacd" ||
    category === "stack"
  ) {
    return true;
  }

  const tags = [
    ...(Array.isArray(asset.tags) ? asset.tags : []),
    ...(Array.isArray(asset.meta?.tags) ? asset.meta.tags : []),
  ];
  if (tags.some((tag) => String(tag).toLowerCase().includes("brick"))) {
    return true;
  }

  const symbol = String(asset.symbol || "").toUpperCase();
  if (symbol === "HACD" && (asset.stackType === "brick" || asset.stack === "brick")) {
    return true;
  }

  return false;
}

function normalizeBrickStacks(rawAssets) {
  const assets = Array.isArray(rawAssets) ? rawAssets.filter(isBrickAsset) : [];

  return assets.map((asset, index) => {
    const brickType = normalizeBrickTypeId(asset.brickType, index);
    const amount = Number(asset.amount ?? asset.balance ?? asset.value ?? asset.hacd ?? 0);
    const rawBrickCount = Number(asset.brickCount ?? amount);
    const brickCount = Number.isFinite(rawBrickCount) ? Math.max(0, Math.round(rawBrickCount)) : 0;

    return {
      id: asset.id || makeId("stack"),
      name: asset.name || asset.label || `Brick Stack ${index + 1}`,
      symbol: asset.symbol || "HACD",
      amount,
      brickType,
      brickCount,
      color: BRICK_TYPE_MAP[brickType].color,
      source: asset.source || asset.vault || asset.origin || `Vault ${String.fromCharCode(65 + index)}`,
      lock: asset.lock || asset.lockedUntil || asset.lockLabel || "Open",
      status: asset.status || "stacked",
    };
  });
}

function normalizeWallet(rawWallet) {
  if (!rawWallet || typeof rawWallet !== "object") {
    return null;
  }

  const sourceWallet =
    rawWallet.result && typeof rawWallet.result === "object"
      ? rawWallet.result
      : rawWallet.data && typeof rawWallet.data === "object"
        ? rawWallet.data
        : rawWallet.payload && typeof rawWallet.payload === "object"
          ? rawWallet.payload
          : rawWallet;

  const brickStacks = normalizeBrickStacks(
    sourceWallet.assets || sourceWallet.brickStacks || sourceWallet.hacdAssets || sourceWallet.tokens || [],
  );

  const accountCandidate = Array.isArray(sourceWallet.accounts)
    ? sourceWallet.accounts.find((item) => typeof item === "string" && item.trim()) || sourceWallet.accounts[0]
    : sourceWallet.accounts;
  const accountAddress =
    typeof accountCandidate === "string"
      ? accountCandidate
      : accountCandidate?.address ||
        accountCandidate?.walletAddress ||
        accountCandidate?.selectedAddress ||
        accountCandidate?.account ||
        "";
  const address =
    sourceWallet.address ||
    sourceWallet.walletAddress ||
    sourceWallet.selectedAddress ||
    sourceWallet.account ||
    accountAddress ||
    "";

  if (!address && !brickStacks.length && !sourceWallet.isDemo && !sourceWallet.source) {
    return null;
  }

  return {
    address,
    network: sourceWallet.network || sourceWallet.chain || sourceWallet.chainName || "HACD Mainline",
    source: sourceWallet.source || (sourceWallet.isDemo ? "Demo Gateway" : "H-Cash Wallet"),
    isDemo: Boolean(sourceWallet.isDemo),
    brickStacks,
    balance: sourceWallet.balance || null,
    stackCount:
      Number.isFinite(Number(sourceWallet.stackCount))
        ? Math.max(0, Math.round(Number(sourceWallet.stackCount)))
        : brickStacks.length,
  };
}

function normalizeHcashBalance(rawBalance) {
  if (!rawBalance || typeof rawBalance !== "object") {
    return null;
  }

  const sourceBalance =
    rawBalance.balance && typeof rawBalance.balance === "object" ? rawBalance.balance : rawBalance;
  const diamondNamesRaw = sourceBalance.diamondNames ?? sourceBalance.diamonds ?? [];
  const diamondNames = [];

  if (Array.isArray(diamondNamesRaw)) {
    for (const entry of diamondNamesRaw) {
      const name = String(entry || "").trim().toUpperCase();
      if (name) {
        diamondNames.push(name);
      }
    }
  } else {
    const diamondNamesText = String(diamondNamesRaw || "").trim().toUpperCase();
    if (diamondNamesText) {
      if (/^[A-Z]+$/.test(diamondNamesText) && diamondNamesText.length % 6 === 0) {
        for (let index = 0; index < diamondNamesText.length; index += 6) {
          const name = diamondNamesText.slice(index, index + 6).trim();
          if (name) {
            diamondNames.push(name);
          }
        }
      } else {
        diamondNames.push(
          ...diamondNamesText
            .split(/[,\s]+/)
            .map((item) => item.trim())
            .filter(Boolean),
        );
      }
    }
  }

  const stackedDiamondCount = Number(sourceBalance.stackedDiamondCount ?? rawBalance.stackedDiamondCount ?? diamondNames.length ?? 0);

  return {
    balance: String(sourceBalance.balance ?? sourceBalance.hacash ?? sourceBalance.hac ?? "0"),
    diamond: Number(sourceBalance.diamond ?? 0),
    diamondNames,
    carat: String(sourceBalance.carat ?? rawBalance.carat ?? "0"),
    stackedDiamondCount: Number.isFinite(stackedDiamondCount)
      ? Math.max(0, Math.round(stackedDiamondCount))
      : diamondNames.length,
  };
}

function buildBrickStacksFromBalance(balance, address) {
  const diamondNames = Array.isArray(balance?.diamondNames) ? balance.diamondNames : [];
  const stackCount = Number.isFinite(Number(balance?.stackedDiamondCount))
    ? Math.max(0, Math.round(Number(balance.stackedDiamondCount)))
    : 0;

  if (!stackCount) {
    return [];
  }

  return Array.from({ length: stackCount }, (_, index) => {
    const stackName = diamondNames[index] || `HACD Stack ${String(index + 1).padStart(2, "0")}`;
    const brickType = BRICK_TYPES[index % BRICK_TYPES.length].id;

    return {
      id: `${String(address || "wallet").trim()}-${index}-${stackName}`,
      name: stackName,
      symbol: "HACD",
      amount: BRICKS_PER_HACD_STACK,
      brickCount: BRICKS_PER_HACD_STACK,
      brick: true,
      isBrick: true,
      brickType,
      color: BRICK_TYPE_MAP[brickType].color,
      source: "H-Cash Wallet",
      lock: "Open",
      status: "stacked",
    };
  });
}

function convertHacashAmountToDecimalString(value) {
  const normalized = String(value ?? "").trim();
  const match = normalized.match(/^(\d+):(\d+)$/);

  if (!match) {
    return normalized || "0";
  }

  const digits = match[1].replace(/^0+(?=\d)/, "");
  const exponent = Number.parseInt(match[2], 10);
  const baseExponent = 248;
  const shift = exponent - baseExponent;

  if (shift >= 0) {
    return `${digits}${"0".repeat(shift)}`;
  }

  const decimalPlaces = -shift;
  const padded = digits.padStart(decimalPlaces + 1, "0");
  const integerPart = padded.slice(0, padded.length - decimalPlaces) || "0";
  const fractionalPart = padded.slice(padded.length - decimalPlaces).replace(/0+$/, "");

  return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
}

function normalizeHcashBalancePayload(payload) {
  const row = Array.isArray(payload?.list) ? payload.list[0] : payload;
  const diamondsRaw = row?.diamonds ?? row?.diamondNames ?? "";
  const diamondNames = [];

  if (Array.isArray(diamondsRaw)) {
    for (const entry of diamondsRaw) {
      const name = String(entry || "").trim().toUpperCase();
      if (name) {
        diamondNames.push(name);
      }
    }
  } else {
    const diamondNamesRaw = String(diamondsRaw || "").trim().toUpperCase();
    if (diamondNamesRaw.length >= 6) {
      if (/^[A-Z]+$/.test(diamondNamesRaw) && diamondNamesRaw.length % 6 === 0) {
        for (let index = 0; index < diamondNamesRaw.length; index += 6) {
          const name = diamondNamesRaw.slice(index, index + 6).trim();
          if (name) {
            diamondNames.push(name);
          }
        }
      } else {
        diamondNames.push(
          ...diamondNamesRaw
            .split(/[,\s]+/)
            .map((item) => item.trim())
            .filter(Boolean),
        );
      }
    }
  }

  return {
    balance: convertHacashAmountToDecimalString(row?.hacash ?? row?.balance ?? "0"),
    diamond: Number(row?.diamond ?? 0),
    diamondNames,
    carat: convertHacashAmountToDecimalString(row?.carat ?? payload?.carat ?? "0"),
    stackedDiamondCount: Number(row?.stackedDiamondCount ?? payload?.stackedDiamondCount ?? 0),
  };
}

async function fetchHcashBalance(address) {
  const safeAddress = String(address || "").trim();
  if (!safeAddress) {
    return null;
  }

  const primaryUrl = new URL("http://nodeapi.hacash.org/query/balance");
  primaryUrl.searchParams.set("address", safeAddress);
  primaryUrl.searchParams.set("unit", "mei");
  primaryUrl.searchParams.set("diamonds", "true");

  try {
    const response = await fetch(primaryUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error("Balance lookup failed.");
    }

    const json = await response.json();
    return normalizeHcashBalancePayload(json);
  } catch (error) {
    console.warn("H-Cash balance lookup failed.", error);
    return null;
  }
}

function buildDemoWallet() {
  return normalizeWallet(DEMO_WALLET_RAW);
}

function getInjectedHcashProvider() {
  const candidates = [
    window.HacpoolWallet,
    window.hcashWallet,
    window.HcashWallet,
    window.hcash,
    window.hCashWallet,
    window.ethereum?.isHcashWallet || window.ethereum?.isHcash || window.ethereum?.isHCash
      ? window.ethereum
      : null,
    window.web3?.currentProvider?.isHcashWallet || window.web3?.currentProvider?.isHcash
      ? window.web3.currentProvider
      : null,
  ];

  return candidates.find(Boolean) || null;
}

async function requestHcashProvider(api, method, params) {
  if (!api) {
    return null;
  }

  try {
    if (typeof api.request === "function") {
      const payload = params === undefined ? { method } : { method, params };
      return await api.request(payload);
    }

    if (method === "connect" && typeof api.connect === "function") {
      return await api.connect(params);
    }

    if (method === "enable" && typeof api.enable === "function") {
      return await api.enable(params);
    }

    if (typeof api[method] === "function") {
      const args = params === undefined ? [] : Array.isArray(params) ? params : [params];
      return await api[method](...args);
    }
  } catch (error) {
    console.warn(`H-Cash Wallet method failed: ${method}`, error);
  }

  return null;
}

function createWalletPayloadCandidates(response) {
  const payload = {};

  if (!response || typeof response !== "object") {
    return payload;
  }

  if (Array.isArray(response)) {
    payload.accounts = response;
    return payload;
  }

  if (response.accounts && !payload.accounts) {
    payload.accounts = response.accounts;
  }

  if (response.address && !payload.address) {
    payload.address = response.address;
  }

  if (response.walletAddress && !payload.walletAddress) {
    payload.walletAddress = response.walletAddress;
  }

  if (response.selectedAddress && !payload.selectedAddress) {
    payload.selectedAddress = response.selectedAddress;
  }

  if (response.assets && !payload.assets) {
    payload.assets = response.assets;
  }

  if (response.brickStacks && !payload.brickStacks) {
    payload.brickStacks = response.brickStacks;
  }

  if (response.hacdAssets && !payload.hacdAssets) {
    payload.hacdAssets = response.hacdAssets;
  }

  if (response.tokens && !payload.tokens) {
    payload.tokens = response.tokens;
  }

  if (response.result && typeof response.result === "object") {
    Object.assign(payload, createWalletPayloadCandidates(response.result));
  }

  if (response.data && typeof response.data === "object") {
    Object.assign(payload, createWalletPayloadCandidates(response.data));
  }

  if (response.payload && typeof response.payload === "object") {
    Object.assign(payload, createWalletPayloadCandidates(response.payload));
  }

  return payload;
}

function mergeWalletPayload(target, response, arrayKey) {
  if (!response) {
    return target;
  }

  if (Array.isArray(response)) {
    target[arrayKey] = response;
    return target;
  }

  if (typeof response !== "object") {
    return target;
  }

  Object.assign(target, createWalletPayloadCandidates(response));

  if (Array.isArray(response[arrayKey])) {
    target[arrayKey] = response[arrayKey];
  }

  return target;
}

function buildInventoryFromStacks(brickStacks) {
  const inventory = Object.fromEntries(BRICK_TYPES.map((type) => [type.id, 0]));

  brickStacks.forEach((stack) => {
    const stackBrickCount = Number.isFinite(Number(stack.brickCount))
      ? Math.max(0, Math.round(Number(stack.brickCount)))
      : BRICKS_PER_HACD_STACK;
    const allocation = allocateBrickCounts(stackBrickCount);

    Object.entries(allocation).forEach(([typeId, count]) => {
      inventory[typeId] += count;
    });
  });

  return inventory;
}

function totalInventory(inventory) {
  return BRICK_TYPES.reduce((sum, type) => sum + Number(inventory?.[type.id] || 0), 0);
}

function normalizeInventory(rawInventory) {
  if (!rawInventory || typeof rawInventory !== "object") {
    return {};
  }

  const inventory = Object.fromEntries(BRICK_TYPES.map((type) => [type.id, 0]));

  Object.entries(rawInventory).forEach(([key, value]) => {
    const normalizedKey = BRICK_TYPE_MAP[key]?.id || LEGACY_BRICK_TYPE_MAP[key];
    if (!normalizedKey || !BRICK_TYPE_MAP[normalizedKey]) {
      return;
    }

    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    inventory[normalizedKey] += Math.floor(amount);
  });

  return inventory;
}

function normalizeWorker(rawWorker, index = 0) {
  if (!rawWorker || typeof rawWorker !== "object") {
    return null;
  }

  const name = String(rawWorker.name || rawWorker.label || rawWorker.title || "").trim();

  return {
    id: rawWorker.id || makeId("worker"),
    name: name || `Worker ${index + 1}`,
    createdAt: rawWorker.createdAt || new Date().toISOString(),
  };
}

function getStackLimit() {
  const stackCount = Number(state.wallet?.stackCount ?? state.wallet?.balance?.stackedDiamondCount ?? 0);
  if (Number.isFinite(stackCount) && stackCount > 0) {
    return Math.round(stackCount);
  }

  return state.wallet?.brickStacks?.length || 0;
}

function getNextDailyRewardAt(now = new Date()) {
  const next = now instanceof Date ? new Date(now) : new Date(now);
  if (Number.isNaN(next.getTime())) {
    return null;
  }

  next.setHours(DAILY_BRICK_REWARD_HOUR, 0, 0, 0);
  if (now >= next) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function formatCountdownDuration(milliseconds) {
  const safeMs = Math.max(0, Math.floor(Number(milliseconds) || 0));
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function renderRewardCountdown(now = new Date()) {
  if (!els.rewardCountdown) {
    return;
  }

  const nextRewardAt = getNextDailyRewardAt(now);
  if (!nextRewardAt) {
    els.rewardCountdown.textContent = "00:00:00";
    return;
  }

  els.rewardCountdown.textContent = formatCountdownDuration(nextRewardAt.getTime() - now.getTime());
}

function clearRewardCountdownTicker() {
  if (rewardCountdownTickerId !== null) {
    window.clearInterval(rewardCountdownTickerId);
    rewardCountdownTickerId = null;
  }
}

function startRewardCountdownTicker() {
  clearRewardCountdownTicker();
  renderRewardCountdown();
  rewardCountdownTickerId = window.setInterval(() => {
    renderRewardCountdown();
  }, 1000);
}

function ensureDailyRewardLedger(address = state.wallet?.address) {
  const ledgerKey = getRewardLedgerKey(address);
  const existing = state.dailyRewardLedger[ledgerKey];
  if (existing && typeof existing === "object") {
    if (!existing.lastProcessedCycleKey) {
      existing.lastProcessedCycleKey = getBootstrapRewardLedgerCycleKey();
    }
    if (!existing.lastProcessedAt) {
      existing.lastProcessedAt = new Date().toISOString();
    }
    return existing;
  }

  const entry = {
    lastProcessedCycleKey: getBootstrapRewardLedgerCycleKey(),
    lastProcessedAt: new Date().toISOString(),
  };
  state.dailyRewardLedger[ledgerKey] = entry;
  return entry;
}

function getDueRewardCycleKeys(lastProcessedCycleKey, now = new Date()) {
  const currentCycleKey = getCurrentRewardCycleKey(now);
  if (!currentCycleKey) {
    return [];
  }

  let cursor = String(lastProcessedCycleKey || "").trim();
  if (!cursor) {
    cursor = getBootstrapRewardLedgerCycleKey(now);
  }

  if (!cursor) {
    return [];
  }

  const dueKeys = [];
  let nextKey = shiftLocalDateKey(cursor, 1);

  while (nextKey && nextKey <= currentCycleKey) {
    dueKeys.push(nextKey);
    nextKey = shiftLocalDateKey(nextKey, 1);
  }

  return dueKeys;
}

function getRewardCycleTimestamp(cycleKey) {
  const [year, month, day] = String(cycleKey || "").split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return null;
  }

  const timestamp = new Date(year, month - 1, day, DAILY_BRICK_REWARD_HOUR, 0, 0, 0);
  if (Number.isNaN(timestamp.getTime())) {
    return null;
  }

  return timestamp;
}

function getEligibleWorkerCountForCycle(cycleKey) {
  const cycleTimestamp = getRewardCycleTimestamp(cycleKey);
  if (!cycleTimestamp) {
    return state.workers.length;
  }

  return state.workers.reduce((count, worker) => {
    const createdAt = new Date(worker?.createdAt || "");
    if (!Number.isNaN(createdAt.getTime()) && createdAt <= cycleTimestamp) {
      return count + 1;
    }

    return count;
  }, 0);
}

function applyDailyRewardCycle(recipientCount) {
  const totalRecipients = Math.max(0, Math.floor(Number(recipientCount) || 0));
  const totalRequested = totalRecipients * DAILY_BRICK_REWARD_PER_HACD;
  const allocation = Object.fromEntries(BRICK_TYPES.map((type) => [type.id, 0]));
  let granted = 0;

  for (let index = 0; index < totalRequested; index += 1) {
    const brickType = drawRandomBrickTypeFromPool();
    if (!brickType) {
      break;
    }

    allocation[brickType] += 1;
    state.inventory[brickType] = Number(state.inventory[brickType] || 0) + 1;
    granted += 1;
  }

  return {
    allocation,
    granted,
    totalRequested,
    exhausted: granted < totalRequested,
  };
}

function processDailyBrickRewards({ now = new Date(), reason = "scheduler" } = {}) {
  if (!state.connected || !state.wallet?.address) {
    return {
      appliedCycles: 0,
      granted: 0,
      requested: 0,
      reason,
    };
  }

  const ledger = ensureDailyRewardLedger(state.wallet.address);
  const dueKeys = getDueRewardCycleKeys(ledger.lastProcessedCycleKey, now);
  if (!dueKeys.length) {
    return {
      appliedCycles: 0,
      granted: 0,
      requested: 0,
      reason,
    };
  }

  let granted = 0;
  let requested = 0;
  let exhausted = false;

  for (const cycleKey of dueKeys) {
    const cycleRecipientCount = getStackLimit() + getEligibleWorkerCountForCycle(cycleKey);
    const result = applyDailyRewardCycle(cycleRecipientCount);
    granted += result.granted;
    requested += result.totalRequested;
    exhausted = exhausted || result.exhausted;
    ledger.lastProcessedCycleKey = cycleKey;
    ledger.lastProcessedAt = new Date().toISOString();
  }

  saveState();
  renderAll();

  if (requested > 0) {
    if (granted > 0 && granted < requested) {
      showToast(
        `Daily distribution partially completed: ${formatInteger(granted)}/${formatInteger(requested)} bricks added.`,
      );
    } else if (granted > 0) {
      showToast(`Daily distribution completed: ${formatInteger(granted)} bricks added.`);
    } else if (exhausted) {
      showToast("The brick pool is depleted, so the daily distribution could not be completed.");
    }
  }

  return {
    appliedCycles: dueKeys.length,
    granted,
    requested,
    reason,
  };
}

function clearDailyRewardTimer() {
  if (dailyRewardTimerId !== null) {
    window.clearTimeout(dailyRewardTimerId);
    dailyRewardTimerId = null;
  }
}

function scheduleDailyRewardTimer() {
  clearDailyRewardTimer();

  if (!state.connected || !state.wallet?.address) {
    return;
  }

  const nextRewardAt = getNextDailyRewardAt(new Date());
  if (!nextRewardAt) {
    return;
  }

  const delayMs = Math.max(1_000, nextRewardAt.getTime() - Date.now());
  dailyRewardTimerId = window.setTimeout(() => {
    dailyRewardTimerId = null;
    processDailyBrickRewards({ reason: "timer" });
    scheduleDailyRewardTimer();
  }, delayMs);
}

function normalizeDrafts(rawDrafts) {
  const drafts = {};

  SHAPES.forEach((shape) => {
    const source = rawDrafts && typeof rawDrafts === "object" ? rawDrafts[shape.id] : null;
    const placements =
      source && typeof source === "object" && source.placements && typeof source.placements === "object"
        ? normalizePlacements(source.placements)
        : {};

    drafts[shape.id] = { placements };
  });

  return drafts;
}

function normalizeAsset(rawAsset) {
  if (!rawAsset || typeof rawAsset !== "object") {
    return null;
  }

  const shape = SHAPE_MAP[rawAsset.shapeId] || SHAPES[0];

  return {
    id: rawAsset.id || makeId("asset"),
    shapeId: shape.id,
    shapeLabel: rawAsset.shapeLabel || shape.label,
    builtAt: rawAsset.builtAt || new Date().toISOString(),
    placements: normalizePlacements(rawAsset.placements),
    brickCount: Math.max(0, Math.round(Number(rawAsset.brickCount ?? rawAsset.cellCount ?? 0))),
    cellCount: Math.max(0, Math.round(Number(rawAsset.cellCount ?? shape.totalCells ?? 0))),
    listed: Boolean(rawAsset.listed),
    priceHAC:
      rawAsset.priceHAC === undefined || rawAsset.priceHAC === null ? null : Number(rawAsset.priceHAC),
    priceHACD:
      rawAsset.priceHACD === undefined || rawAsset.priceHACD === null ? null : Number(rawAsset.priceHACD),
    listedAt: rawAsset.listedAt || null,
  };
}

function loadStoredState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.warn("Saved brick state could not be loaded.", error);
    return null;
  }
}

function saveState() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: APP_SCHEMA_VERSION,
        connected: state.connected,
        demoMode: state.demoMode,
        wallet: state.wallet,
        lastWalletAddress: state.lastWalletAddress,
        activeDashboardView: state.activeDashboardView,
        selectedShapeId: state.selectedShapeId,
        selectedWorkerId: state.selectedWorkerId,
        drafts: state.drafts,
        inventory: state.inventory,
        brickPoolRemaining: state.brickPoolRemaining,
        dailyRewardLedger: state.dailyRewardLedger,
        completedAssets: state.completedAssets,
        workers: state.workers,
      }),
    );
  } catch (error) {
    console.warn("Brick state could not be saved.", error);
  }
}

function hydrateState(savedState) {
  if (!savedState || typeof savedState !== "object") {
    return;
  }

  state.schemaVersion = Number(savedState.schemaVersion || 0);
  state.connected = Boolean(savedState.connected);
  state.demoMode = savedState.demoMode !== undefined ? Boolean(savedState.demoMode) : false;
  state.wallet = normalizeWallet(savedState.wallet);
  state.lastWalletAddress = String(
    savedState.lastWalletAddress || state.wallet?.address || "",
  ).trim();
  state.activeDashboardView = ["stack", "workers", "construction", "assets"].includes(
    savedState.activeDashboardView,
  )
    ? savedState.activeDashboardView
    : null;
  state.selectedShapeId = SHAPE_MAP[savedState.selectedShapeId] ? savedState.selectedShapeId : "heart";
  state.drafts = normalizeDrafts(savedState.drafts);
  state.inventory = normalizeInventory(savedState.inventory);
  state.brickPoolRemaining = normalizeBrickPoolCounts(savedState.brickPoolRemaining);
  state.dailyRewardLedger =
    savedState.dailyRewardLedger && typeof savedState.dailyRewardLedger === "object"
      ? Object.fromEntries(
          Object.entries(savedState.dailyRewardLedger).map(([address, entry]) => [
            getRewardLedgerKey(address),
            {
              lastProcessedCycleKey: String(entry?.lastProcessedCycleKey || "").trim(),
              lastProcessedAt: String(entry?.lastProcessedAt || "").trim(),
            },
          ]),
        )
      : {};
  state.completedAssets = Array.isArray(savedState.completedAssets)
    ? savedState.completedAssets.map(normalizeAsset).filter(Boolean)
    : [];
  state.workers = Array.isArray(savedState.workers)
    ? savedState.workers.map(normalizeWorker).filter(Boolean)
    : [];
  state.selectedWorkerId = state.workers.some((worker) => worker.id === savedState.selectedWorkerId)
    ? savedState.selectedWorkerId
    : null;

  if (state.wallet?.isDemo) {
    state.connected = false;
    state.wallet = null;
  }
}

function resetTestDataState() {
  const now = new Date();
  const walletAddress = String(state.wallet?.address || state.lastWalletAddress || "").trim();
  const currentCycleKey = getCurrentRewardCycleKey(now);

  state.inventory = cloneBrickCounts();
  state.completedAssets = [];
  state.workers = [];
  state.drafts = normalizeDrafts({});
  state.selectedWorkerId = null;
  state.selectedShapeId = SHAPE_MAP[state.selectedShapeId] ? state.selectedShapeId : "heart";
  state.assetDetailId = null;
  state.saleDraftId = null;
  state.brickPoolRemaining = cloneBrickCounts(BRICK_POOL_COUNTS);

  if (walletAddress && currentCycleKey) {
    state.dailyRewardLedger = {
      [getRewardLedgerKey(walletAddress)]: {
        lastProcessedCycleKey: currentCycleKey,
        lastProcessedAt: now.toISOString(),
      },
    };
  }
}

function ensureDraft(shapeId) {
  if (!state.drafts[shapeId]) {
    state.drafts[shapeId] = { placements: {} };
  }

  if (!state.drafts[shapeId].placements) {
    state.drafts[shapeId].placements = {};
  }

  return state.drafts[shapeId];
}

function getCurrentShape() {
  return SHAPE_MAP[state.selectedShapeId] || SHAPES[0];
}

function getSelectedWorker() {
  return state.workers.find((worker) => worker.id === state.selectedWorkerId) || null;
}

function isCurrentShapeComplete(shapeId = state.selectedShapeId) {
  const shape = SHAPE_MAP[shapeId];
  if (!shape) {
    return false;
  }

  return getFilledCount(shapeId) === shape.totalCells && shape.totalCells > 0;
}

function getFilledCount(shapeId = state.selectedShapeId) {
  return Object.keys(ensureDraft(shapeId).placements).length;
}

function getAssetPlacements(asset) {
  return Object.values(asset?.placements || {});
}

function getAssetUsedBrickTypes(asset) {
  return [...new Set(getAssetPlacements(asset).map((placement) => placement.brickType))];
}

function getAssetUsedColors(asset) {
  return [...new Set(getAssetPlacements(asset).map((placement) => placement.color))];
}

function renderAssetPreview(shape, placements, variant = "card") {
  const safePlacements = placements && typeof placements === "object" ? placements : {};

  const cells = shape.rows
    .map((row, rowIndex) =>
      row
        .split("")
        .map((cell, colIndex) => {
          const key = `${rowIndex}-${colIndex}`;

          if (cell !== "1") {
            return `<div class="asset-preview-cell is-empty" aria-hidden="true"></div>`;
          }

          const placement = safePlacements[key];
          if (placement) {
            return `
              <div
                class="asset-preview-cell is-filled"
                aria-hidden="true"
                style="--brick-color: ${placement.color};"
              ></div>
            `;
          }

          return `<div class="asset-preview-cell is-empty" aria-hidden="true"></div>`;
        })
        .join(""),
    )
    .join("");

  return `
    <div class="asset-preview-shell asset-preview-shell--${variant}" aria-hidden="true">
      <div
        class="asset-preview-grid asset-preview-grid--${variant}"
        style="grid-template-columns: repeat(${shape.size}, minmax(0, 1fr));"
      >
        ${cells}
      </div>
    </div>
  `;
}

function getAvailableCells(shape, draft) {
  const cells = [];

  shape.rows.forEach((row, rowIndex) => {
    row.split("").forEach((cell, colIndex) => {
      if (cell !== "1") {
        return;
      }

      const key = `${rowIndex}-${colIndex}`;
      if (!draft.placements[key]) {
        cells.push(key);
      }
    });
  });

  return cells;
}

function showToast(message) {
  if (!els.toast) {
    return;
  }

  els.toast.textContent = message;
  els.toast.classList.add("is-visible");

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2600);
}

function setModalVisible(visible) {
  if (!els.saleModal) {
    return;
  }

  els.saleModal.hidden = !visible;
  if (!visible) {
    state.saleDraftId = null;
    els.saleError.hidden = true;
    els.saleError.textContent = "";
  }
}

function setWorkerModalVisible(visible) {
  if (!els.workerModal) {
    return;
  }

  els.workerModal.hidden = !visible;

  if (!visible) {
    if (els.workerError) {
      els.workerError.hidden = true;
      els.workerError.textContent = "";
    }

    if (els.workerNameInput) {
      els.workerNameInput.value = "";
    }
  }
}

function openWorkerModal() {
  const stackLimit = getStackLimit();

  if (stackLimit <= 0) {
    showToast("A connected H-Cash Wallet is required first.");
    return;
  }

  if (state.workers.length >= stackLimit) {
    showToast(`You can create only ${stackLimit} workers.`);
    return;
  }

  if (els.workerModalTitle) {
    els.workerModalTitle.textContent = "Create New Worker";
  }

  if (els.workerError) {
    els.workerError.hidden = true;
    els.workerError.textContent = "";
  }

  if (els.workerNameInput) {
    els.workerNameInput.value = "";
  }

  setWorkerModalVisible(true);
  window.requestAnimationFrame(() => {
    els.workerNameInput?.focus();
  });
}

function closeWorkerModal() {
  setWorkerModalVisible(false);
}

function submitWorkerForm(event) {
  event.preventDefault();

  const stackLimit = getStackLimit();
  if (stackLimit <= 0) {
    closeWorkerModal();
    showToast("A connected H-Cash Wallet is required first.");
    return;
  }

  if (state.workers.length >= stackLimit) {
    if (els.workerError) {
      els.workerError.hidden = false;
      els.workerError.textContent = `You can create only ${stackLimit} workers.`;
    }
    return;
  }

  const name = String(els.workerNameInput?.value || "").trim();
  if (!name) {
    if (els.workerError) {
      els.workerError.hidden = false;
      els.workerError.textContent = "Please enter a worker name.";
    }
    els.workerNameInput?.focus();
    return;
  }

  state.workers.push({
    id: makeId("worker"),
    name,
    createdAt: new Date().toISOString(),
  });

  saveState();
  renderAll();
  closeWorkerModal();
  showToast(`${name} created.`);
}

function renderConnectionState() {
  if (els.dashboardSection) {
    els.dashboardSection.hidden = !state.dashboardVisible;
  }

  if (els.walletStatus) {
    els.walletStatus.textContent = state.connected
      ? `${formatInteger(getStackLimit())} stacked HACD detected`
      : "Connection pending";
  }

  if (els.walletAddress) {
    els.walletAddress.textContent = state.connected ? shortAddress(state.wallet?.address) : "-";
  }

  if (els.connectButton) {
    els.connectButton.textContent = state.connected ? "Disconnect" : "Connect H-Cash Wallet";
    els.connectButton.disabled = false;
  }
}

function openDashboardFromHome() {
  state.dashboardVisible = true;
  state.activeDashboardView = "construction";
  renderAll();

  window.requestAnimationFrame(() => {
    els.dashboardSection?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

function renderDashboardNavigation() {
  if (!els.dashboardNav) {
    return;
  }

  const stackLimit = getStackLimit();

  if (els.stackTabCount) {
    els.stackTabCount.textContent = formatInteger(stackLimit);
  }

  if (els.workerTabCount) {
    els.workerTabCount.textContent = `${formatInteger(state.workers.length)} / ${formatInteger(stackLimit)}`;
  }

  els.dashboardNav.querySelectorAll("[data-view]").forEach((button) => {
    const isActive = button.dataset.view === state.activeDashboardView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function renderDashboardVisibility() {
  const modules = {
    stack: els.stackBrickSection,
    workers: els.workersSection,
    construction: els.constructionSection,
    assets: els.assetsSection,
  };

  Object.entries(modules).forEach(([view, element]) => {
    if (!element) {
      return;
    }

    element.hidden = state.activeDashboardView !== view;
  });
}

function renderShapePreview(shape) {
  return `
    <svg class="asset-choice-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="${shape.path}" />
    </svg>
  `;
}

function renderStackBrickSection() {
  if (!els.stackGrid) {
    return;
  }

  const stacks = state.wallet?.brickStacks || [];
  if (!stacks.length) {
    els.stackGrid.innerHTML = `<p class="empty-state">No brick stacks were found in the wallet.</p>`;
    return;
  }

  els.stackGrid.innerHTML = stacks
    .map((stack, index) => {
      const accent = stack.color || BRICK_TYPES[index % BRICK_TYPES.length].color;
      const brickAmount = Number.isFinite(Number(stack.brickCount)) ? Math.round(Number(stack.brickCount)) : 0;
      const brickTypeLabel = BRICK_TYPE_MAP[stack.brickType]?.label || String(stack.brickType || "").toUpperCase();

      return `
        <article class="stack-card" style="--brick-color: ${accent};">
          <div class="stack-top">
            <div class="stack-name">
              <p class="eyebrow">HACD ${String(index + 1).padStart(2, "0")}</p>
              <strong>${stack.name}</strong>
              <span>${stack.source}</span>
            </div>
            <span class="asset-badge">${stack.lock}</span>
          </div>
          <div class="stack-amount">${brickAmount} bricks</div>
          <div class="stack-meta">
            <div class="meta-row">
              <span>Type</span>
              <strong>${brickTypeLabel}</strong>
            </div>
            <div class="meta-row">
              <span>Status</span>
              <strong>${stack.status}</strong>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderWorkers() {
  if (!els.workerGrid) {
    return;
  }

  const stackLimit = getStackLimit();

  if (els.workerQuotaText) {
    els.workerQuotaText.textContent = `${formatInteger(state.workers.length)} / ${formatInteger(stackLimit)}`;
  }

  if (els.workerEmpty) {
    els.workerEmpty.hidden = state.workers.length > 0;
  }

  if (!state.workers.length) {
    els.workerGrid.innerHTML = "";
    return;
  }

  els.workerGrid.innerHTML = state.workers
    .map((worker, index) => {
      const initials = worker.name
        .split(" ")
        .map((part) => part.slice(0, 1))
        .join("")
        .slice(0, 2)
        .toUpperCase();

      return `
        <article class="worker-card">
          <div class="worker-head">
            <div class="worker-avatar">${initials}</div>
            <div>
              <strong>${worker.name}</strong>
               <small>Worker ${formatInteger(index + 1)}</small>
            </div>
          </div>
          <div class="worker-meta">
            <span>Created</span>
            <strong>${formatDate(worker.createdAt)}</strong>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderConstructionWorkers() {
  if (!els.constructionWorkerGrid || !els.constructionWorkerEmpty) {
    return;
  }

  if (!state.workers.length) {
    els.constructionWorkerGrid.innerHTML = "";
    els.constructionWorkerEmpty.hidden = false;
    return;
  }

  els.constructionWorkerEmpty.hidden = true;

  els.constructionWorkerGrid.innerHTML = state.workers
    .map((worker, index) => {
      const isSelected = worker.id === state.selectedWorkerId;

      return `
        <article class="construction-worker-card${isSelected ? " is-active" : ""}">
          <div class="construction-worker-copy">
            <span class="construction-worker-index">Worker ${String(index + 1).padStart(2, "0")}</span>
            <strong>${worker.name}</strong>
          </div>
          <button
            class="btn btn-secondary btn-small construction-worker-button"
            type="button"
            data-select-construction-worker="${worker.id}"
          >
          ${isSelected ? "Selected" : "Select"}
          </button>
        </article>
      `;
    })
    .join("");
}

function renderShapeTabs() {
  if (!els.shapeTabs) {
    return;
  }

  els.shapeTabs.innerHTML = SHAPES.map((shape, index) => {
    const isActive = shape.id === state.selectedShapeId;
    return `
      <article class="asset-choice-card${isActive ? " is-active" : ""}" role="listitem" style="--shape-accent: ${shape.accent};">
        <div class="asset-choice-preview" aria-hidden="true">
          ${renderShapePreview(shape)}
        </div>
        <div class="asset-choice-copy">
          <span class="asset-choice-index">${String(index + 1).padStart(2, "0")}</span>
          <strong>${shape.label}</strong>
          <small>${shape.subtitle}</small>
        </div>
        <button
          class="btn btn-secondary btn-small asset-choice-button"
          type="button"
          data-build-shape-id="${shape.id}"
        >
          ${isActive ? "Selected" : "Select"}
        </button>
      </article>
    `;
  }).join("");
}

function renderBoard() {
  if (!els.boardGrid) {
    return;
  }

  const shape = getCurrentShape();
  const draft = ensureDraft(shape.id);

  if (els.shapeTitle) {
    els.shapeTitle.textContent = `${shape.label} template`;
  }

  if (els.builderProgress) {
    const filled = Object.keys(draft.placements).length;
    els.builderProgress.textContent = `${filled} / ${shape.totalCells}`;
  }

  els.boardGrid.style.gridTemplateColumns = `repeat(${shape.size}, minmax(0, 1fr))`;
  els.boardGrid.innerHTML = shape.rows
    .map((row, rowIndex) =>
      row
        .split("")
        .map((cell, colIndex) => {
          const key = `${rowIndex}-${colIndex}`;

          if (cell !== "1") {
            return `<div class="cell is-disabled" aria-hidden="true"></div>`;
          }

          const placement = draft.placements[key];
          if (placement) {
            return `
              <button
                class="cell is-filled"
                type="button"
                data-cell-key="${key}"
                data-placed-brick-type="${placement.brickType}"
                data-brick-id="${placement.id}"
                style="--brick-color: ${placement.color};"
                aria-label="Remove ${BRICK_TYPE_MAP[placement.brickType].label} brick"
              ></button>
            `;
          }

          return `<div class="cell is-slot" aria-hidden="true"></div>`;
        })
        .join(""),
    )
    .join("");
}

function renderConstructionCompletion() {
  if (!els.constructionComplete) {
    return;
  }

  const complete = isCurrentShapeComplete();
  els.constructionComplete.hidden = !complete;

  if (els.sendAssetButton) {
    els.sendAssetButton.disabled = !complete;
  }
}

function renderPalette() {
  if (!els.brickPalette) {
    return;
  }

  const selectedWorker = getSelectedWorker();
  const canBuild = Boolean(selectedWorker);

  els.brickPalette.innerHTML = BRICK_TYPES.map((type) => {
    const count = Number(state.inventory?.[type.id] || 0);
    const isDisabled = count <= 0;

    return `
      <button
        class="palette-card${canBuild ? "" : " is-locked"}"
        type="button"
        data-brick-type="${type.id}"
        style="--brick-color: ${type.color};"
        ${canBuild ? "" : 'title="Select a worker first."'}
        ${isDisabled ? "disabled" : ""}
      >
        <div class="palette-top" aria-hidden="true">
          <span class="palette-swatch"></span>
          <span class="palette-brick"></span>
        </div>
        <div class="palette-copy">
          <strong>${type.label}</strong>
          <small>${type.note} · Pool ${formatInteger(BRICK_POOL_COUNTS[type.id])}</small>
        </div>
        <div class="palette-stock" aria-label="${type.label} brick count">
          <span>Brick</span>
          <strong>${formatInteger(count)}</strong>
        </div>
      </button>
    `;
  }).join("");
}

function renderAssets() {
  if (!els.assetGrid || !els.assetEmpty) {
    return;
  }

  if (!state.completedAssets.length) {
    els.assetGrid.innerHTML = "";
    els.assetEmpty.hidden = false;
    return;
  }

  els.assetEmpty.hidden = true;

  const assets = [...state.completedAssets].sort((a, b) => new Date(b.builtAt) - new Date(a.builtAt));
  els.assetGrid.innerHTML = assets
    .map((asset) => {
      const listed = Boolean(asset.listed);
      const shape = SHAPE_MAP[asset.shapeId] || SHAPES[0];
      const placements = asset.placements || {};
      const brickCount = getAssetPlacements(asset).length || asset.brickCount || 0;
      const colorCount = getAssetUsedColors(asset).length || 1;
      const typeCount = getAssetUsedBrickTypes(asset).length || 1;
      const statusBadge = listed
          ? `<span class="asset-badge is-success">On Market</span>`
          : `<span class="asset-badge is-warning">Ready</span>`;

      return `
        <article class="asset-card" data-asset-id="${asset.id}">
          <div class="asset-top">
            <div>
              <p class="eyebrow">${shape.label}</p>
              <strong>${asset.shapeLabel} HACD</strong>
               <div class="meta-line">${formatInteger(brickCount)} bricks · ${formatInteger(colorCount)} colors</div>
            </div>
            ${statusBadge}
          </div>
          <div class="asset-preview-card">
            ${renderAssetPreview(shape, placements, "card")}
          </div>
          <div class="asset-badges">
             <span class="asset-badge">${listed ? "Listed on Market" : "Completed"}</span>
             <span class="asset-badge">${formatInteger(typeCount)} color types</span>
            <span class="asset-badge">${formatDate(asset.builtAt)}</span>
          </div>
          <div class="asset-meta">
            <div class="asset-meta-row">
              <span>Brick</span>
              <strong>${formatInteger(brickCount)} pcs</strong>
            </div>
            <div class="asset-meta-row">
              <span>Color</span>
              <strong>${formatInteger(colorCount)} pcs</strong>
            </div>
            ${listed
              ? `
                <div class="asset-meta-row">
                  <span>HAC</span>
                  <strong>${formatNumber(asset.priceHAC)}</strong>
                </div>
                <div class="asset-meta-row">
                  <span>HACD</span>
                  <strong>${formatNumber(asset.priceHACD)}</strong>
                </div>
              `
              : `
                <div class="asset-meta-row">
                  <span>Built at</span>
                  <strong>${formatDate(asset.builtAt)}</strong>
                </div>
              `}
          </div>
          <div class="asset-actions">
            <button class="btn btn-primary btn-small" type="button" data-sell-asset="${asset.id}" ${listed ? "disabled" : ""}>
               ${listed ? "On Market" : "Sell"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAssetModal() {
  if (!els.assetModal || !els.assetModalTitle || !els.assetModalMeta || !els.assetModalPreview || !els.assetModalColors) {
    return;
  }

  const asset = state.completedAssets.find((item) => item.id === state.assetDetailId);
  if (!asset) {
    els.assetModalTitle.textContent = "Asset details";
    els.assetModalMeta.innerHTML = "";
    els.assetModalPreview.innerHTML = "";
    els.assetModalColors.innerHTML = "";
    return;
  }

  const shape = SHAPE_MAP[asset.shapeId] || SHAPES[0];
  const placements = asset.placements || {};
  const brickCount = getAssetPlacements(asset).length || asset.brickCount || 0;
  const colorTypes = getAssetUsedBrickTypes(asset);
  const colorCount = getAssetUsedColors(asset).length || colorTypes.length || 1;
  const colorChips = colorTypes.length
    ? colorTypes
        .map((typeId) => {
          const type = BRICK_TYPE_MAP[typeId];
          if (!type) {
            return "";
          }

          return `
            <span class="asset-color-chip" style="--chip-color: ${type.color};">
              <span class="asset-color-dot"></span>
              ${type.label}
            </span>
          `;
        })
        .join("")
    : `<span class="asset-color-chip"><span class="asset-color-dot"></span>Single color</span>`;

  els.assetModalTitle.textContent = `${asset.shapeLabel} details`;
  els.assetModalPreview.innerHTML = renderAssetPreview(shape, placements, "modal");
  els.assetModalMeta.innerHTML = `
    <div class="asset-modal-stat">
      <span>Brick count</span>
      <strong>${formatInteger(brickCount)}</strong>
    </div>
    <div class="asset-modal-stat">
      <span>Color count</span>
      <strong>${formatInteger(colorCount)}</strong>
    </div>
    <div class="asset-modal-stat">
      <span>Shape cells</span>
      <strong>${formatInteger(asset.cellCount || shape.totalCells)}</strong>
    </div>
    <div class="asset-modal-stat">
      <span>Built at</span>
      <strong>${formatDate(asset.builtAt)}</strong>
    </div>
  `;
  els.assetModalColors.innerHTML = colorChips;
}

function setAssetModalVisible(visible) {
  if (!els.assetModal) {
    return;
  }

  els.assetModal.hidden = !visible;

  if (!visible) {
    state.assetDetailId = null;
  }
}

function openAssetModal(assetId) {
  const asset = state.completedAssets.find((item) => item.id === assetId);
  if (!asset) {
    return;
  }

  state.assetDetailId = asset.id;
  renderAssetModal();
  setAssetModalVisible(true);

  window.requestAnimationFrame(() => {
    els.assetModal?.querySelector?.("[data-close-asset-modal]")?.focus?.();
  });
}

function closeAssetModal() {
  setAssetModalVisible(false);
}

function renderAll() {
  renderConnectionState();
  renderRewardCountdown();
  renderDashboardNavigation();
  renderDashboardVisibility();
  renderStackBrickSection();
  renderWorkers();
  renderConstructionWorkers();
  renderShapeTabs();
  renderBoard();
  renderConstructionCompletion();
  renderPalette();
  renderAssets();
  renderAssetModal();
}

function clearCurrentDraft({ returnBricks = true } = {}) {
  const shape = getCurrentShape();
  const draft = ensureDraft(shape.id);
  const placementEntries = Object.entries(draft.placements);

  if (!placementEntries.length) {
    showToast("The draft is already empty.");
    return;
  }

  if (returnBricks) {
    placementEntries.forEach(([, placement]) => {
      state.inventory[placement.brickType] = Number(state.inventory[placement.brickType] || 0) + 1;
    });
  }

  state.drafts[shape.id] = { placements: {} };
  saveState();
  renderAll();
  showToast("Draft cleared.");
}

function sendCurrentAssetToAssets() {
  const shape = getCurrentShape();
  const draft = ensureDraft(shape.id);
  const filledCount = Object.keys(draft.placements).length;

  if (filledCount !== shape.totalCells) {
    return;
  }

  const placements = normalizePlacements(draft.placements);

  state.completedAssets.unshift({
    id: makeId("asset"),
    shapeId: shape.id,
    shapeLabel: shape.label,
    builtAt: new Date().toISOString(),
    placements,
    brickCount: filledCount,
    cellCount: shape.totalCells,
    usedColorCount: getAssetUsedColors({ placements }).length,
    listed: false,
    priceHAC: null,
    priceHACD: null,
    listedAt: null,
  });

  state.drafts[shape.id] = { placements: {} };
  state.activeDashboardView = "assets";
  saveState();
  renderAll();
  showToast(`${shape.label} moved to Assets.`);

  window.requestAnimationFrame(() => {
    if (!els.assetsSection) {
      return;
    }

    const top = els.assetsSection.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top - 20), behavior: "smooth" });
  });
}

function placeBrick(brickType) {
  const type = BRICK_TYPE_MAP[brickType];
  if (!type) {
    return;
  }

  if (!getSelectedWorker()) {
    showToast("Please create a worker first.");
    return;
  }

  if (Number(state.inventory[brickType] || 0) <= 0) {
    showToast("No bricks of this type remain.");
    return;
  }

  const shape = getCurrentShape();
  const draft = ensureDraft(shape.id);
  const availableCells = getAvailableCells(shape, draft);

  if (!availableCells.length) {
    showToast("This mold is already full.");
    return;
  }

  const targetKey = availableCells[Math.floor(Math.random() * availableCells.length)];
  draft.placements[targetKey] = {
    id: makeId("brick"),
    brickType,
    color: type.color,
    placedAt: new Date().toISOString(),
  };
  state.inventory[brickType] = Number(state.inventory[brickType] || 0) - 1;

  saveState();
  renderAll();

  if (isCurrentShapeComplete(shape.id)) {
    showToast(`${shape.label} completed. Send to Assets.`);
  }
}

function removeBrick(cellKey) {
  if (!getSelectedWorker()) {
    showToast("Please create a worker first.");
    return;
  }

  const shape = getCurrentShape();
  const draft = ensureDraft(shape.id);
  const placement = draft.placements[cellKey];

  if (!placement) {
    return;
  }

  state.inventory[placement.brickType] = Number(state.inventory[placement.brickType] || 0) + 1;
  delete draft.placements[cellKey];
  saveState();
  renderAll();
  showToast("Brick returned.");
}

function selectShape(shapeId) {
  if (!SHAPE_MAP[shapeId] || shapeId === state.selectedShapeId) {
    return;
  }

  state.selectedShapeId = shapeId;
  ensureDraft(shapeId);
  saveState();
  renderAll();
}

function selectConstructionWorker(workerId) {
  const worker = state.workers.find((item) => item.id === workerId);
  if (!worker) {
    return;
  }

  if (state.selectedWorkerId === workerId) {
    return;
  }

  state.selectedWorkerId = workerId;
  saveState();
  renderAll();
  showToast(`${worker.name} selected.`);
}

function openConstructionShape(shapeId) {
  if (!SHAPE_MAP[shapeId]) {
    return;
  }

  state.selectedShapeId = shapeId;
  state.activeDashboardView = "construction";
  ensureDraft(shapeId);
  saveState();
  renderAll();

  window.requestAnimationFrame(() => {
    if (!els.boardGrid) {
      return;
    }

    const boardTop = els.boardGrid.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, boardTop - 24), behavior: "smooth" });
  });
}

async function readInjectedWallet() {
  const api = getInjectedHcashProvider();
  if (!api) {
    return null;
  }

  try {
    const connectResponse =
      typeof api.connect === "function" ? await api.connect({}) : await requestHcashProvider(api, "connect");

    const walletState =
      typeof api.walletState === "function"
        ? await api.walletState().catch(() => null)
        : await requestHcashProvider(api, "walletState");

    const address = String(
      connectResponse?.address ||
        walletState?.address ||
        walletState?.activeAddress ||
        api.selectedAddress ||
        api.walletAddress ||
        "",
    ).trim();

    if (!address) {
      return null;
    }

    let balanceResponse = null;
    if (typeof api.getBalance === "function") {
      balanceResponse = await api.getBalance({ address }).catch(() => null);
    }

    if (!balanceResponse) {
      balanceResponse = await fetchHcashBalance(address);
    }

    const balance = normalizeHcashBalance(balanceResponse);
    const brickStacks = buildBrickStacksFromBalance(balance, address);

    const wallet = normalizeWallet({
      address,
      network:
        walletState?.walletName ||
        connectResponse?.info?.name ||
        api.info?.name ||
        "HACD Mainline",
      source: "H-Cash Wallet",
      isDemo: false,
      brickStacks,
      balance,
      stackCount: balance?.stackedDiamondCount ?? brickStacks.length,
    });

    if (!wallet) {
      return null;
    }

    wallet.address = address;
    wallet.balance = balance;
    wallet.stackCount = balance?.stackedDiamondCount ?? brickStacks.length;
    wallet.source = "H-Cash Wallet";
    wallet.isDemo = false;
    wallet.providerInfo = connectResponse?.info || walletState?.info || api.info || null;

    return wallet;
  } catch (error) {
    console.warn("Injected H-cash wallet could not be read.", error);
    return null;
  }
}

async function connectWallet() {
  if (els.connectButton) {
    els.connectButton.disabled = true;
    els.connectButton.textContent = "Connecting...";
  }

  try {
    const wallet = await readInjectedWallet();

    if (!wallet) {
      clearDailyRewardTimer();
      state.connected = false;
      state.wallet = null;
      state.demoMode = false;
      saveState();
      renderAll();
      showToast("H-Cash Wallet extension not found or connection failed.");
      return;
    }

    const nextWalletAddress = String(wallet.address || "").trim();
    const previousWalletAddress = String(state.lastWalletAddress || state.wallet?.address || "").trim();

    state.wallet = wallet;
    state.connected = true;
    state.demoMode = false;
    state.activeDashboardView = "stack";
    state.lastWalletAddress = nextWalletAddress;

    if (!previousWalletAddress || previousWalletAddress !== nextWalletAddress) {
      state.inventory = buildInventoryFromStacks(wallet.brickStacks);
    }

    SHAPES.forEach((shape) => ensureDraft(shape.id));

    processDailyBrickRewards({ reason: "connect" });
    scheduleDailyRewardTimer();
    saveState();
    renderAll();
    showToast(`H-Cash Wallet connected: ${shortAddress(wallet.address)} · ${formatInteger(wallet.brickStacks.length)} brick stacks`);
  } catch (error) {
    console.error(error);
    clearDailyRewardTimer();
    state.wallet = null;
    state.connected = false;
    state.demoMode = false;
    saveState();
    renderAll();
    showToast("H-Cash Wallet could not be read.");
  } finally {
    if (els.connectButton) {
      els.connectButton.disabled = false;
    }
  }
}

function disconnectWallet() {
  clearDailyRewardTimer();
  state.connected = false;
  state.wallet = null;
  state.demoMode = false;
  state.saleDraftId = null;
  setModalVisible(false);
  setWorkerModalVisible(false);
  saveState();
  renderAll();
  showToast("Connection closed.");
}

function openSaleModal(assetId) {
  const asset = state.completedAssets.find((item) => item.id === assetId);
  if (!asset) {
    return;
  }

  state.saleDraftId = asset.id;
  if (els.saleModalTitle) {
    els.saleModalTitle.textContent = `${asset.shapeLabel} list on market`;
  }

  if (els.saleHacInput) {
    els.saleHacInput.value = (asset.brickCount * 0.75).toFixed(2);
  }

  if (els.saleHacdInput) {
    els.saleHacdInput.value = (asset.brickCount * 1.1).toFixed(2);
  }

  if (els.saleError) {
    els.saleError.hidden = true;
    els.saleError.textContent = "";
  }

  setModalVisible(true);
  window.requestAnimationFrame(() => {
    els.saleHacInput?.focus();
  });
}

function submitSale(event) {
  event.preventDefault();

  const asset = state.completedAssets.find((item) => item.id === state.saleDraftId);
  if (!asset) {
    setModalVisible(false);
    return;
  }

  const hac = Number(String(els.saleHacInput.value).replace(",", "."));
  const hacd = Number(String(els.saleHacdInput.value).replace(",", "."));

  if (!Number.isFinite(hac) || hac <= 0 || !Number.isFinite(hacd) || hacd <= 0) {
    els.saleError.hidden = false;
    els.saleError.textContent = "HAC and HACD prices must be greater than zero.";
    return;
  }

  asset.listed = true;
  asset.priceHAC = hac;
  asset.priceHACD = hacd;
  asset.listedAt = new Date().toISOString();
  saveState();
  renderAssets();
  setModalVisible(false);
  showToast(`${asset.shapeLabel} listed on market.`);
}

function closeModalFromEvent(event) {
  if (!event.target?.closest?.("[data-close-modal]")) {
    return;
  }

  setModalVisible(false);
}

function closeAssetModalFromEvent(event) {
  if (!event.target?.closest?.("[data-close-asset-modal]")) {
    return;
  }

  closeAssetModal();
}

function bindEvents() {
  document.querySelectorAll("[data-open-dashboard-nav]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openDashboardFromHome();
    });
  });

  els.connectButton?.addEventListener("click", () => {
    if (state.connected) {
      disconnectWallet();
      return;
    }

    connectWallet();
  });
  els.clearDraftButton?.addEventListener("click", () => clearCurrentDraft());
  els.createWorkerButton?.addEventListener("click", openWorkerModal);
  els.sendAssetButton?.addEventListener("click", sendCurrentAssetToAssets);

  els.dashboardNav?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) {
      return;
    }

    const nextView = button.dataset.view;
    state.activeDashboardView = nextView;
    renderAll();
  });

  els.shapeTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-build-shape-id]");
    if (!button) {
      return;
    }

    openConstructionShape(button.dataset.buildShapeId);
  });

  els.constructionWorkerGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-construction-worker]");
    if (!button) {
      return;
    }

    selectConstructionWorker(button.dataset.selectConstructionWorker);
  });

  els.brickPalette?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-brick-type]");
    if (!button || button.disabled) {
      return;
    }

    placeBrick(button.dataset.brickType);
  });

  els.boardGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cell-key]");
    if (!button) {
      return;
    }

    removeBrick(button.dataset.cellKey);
  });

  els.assetGrid?.addEventListener("click", (event) => {
    const sellButton = event.target.closest("[data-sell-asset]");
    if (sellButton) {
      openSaleModal(sellButton.dataset.sellAsset);
      return;
    }

    const card = event.target.closest("[data-asset-id]");
    if (card) {
      openAssetModal(card.dataset.assetId);
    }
  });

  els.saleForm?.addEventListener("submit", submitSale);
  els.workerForm?.addEventListener("submit", submitWorkerForm);

  els.saleModal?.addEventListener("click", closeModalFromEvent);
  els.assetModal?.addEventListener("click", closeAssetModalFromEvent);
  els.workerModal?.addEventListener("click", (event) => {
    if (!event.target?.closest?.("[data-close-worker-modal]")) {
      return;
    }

    closeWorkerModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (els.assetModal && !els.assetModal.hidden) {
      closeAssetModal();
      return;
    }

    if (els.workerModal && !els.workerModal.hidden) {
      closeWorkerModal();
      return;
    }

    if (els.saleModal && !els.saleModal.hidden) {
      setModalVisible(false);
    }
  });
}

function loadInitialState() {
  hydrateState(loadStoredState());

  if (state.schemaVersion !== APP_SCHEMA_VERSION) {
    resetTestDataState();
    state.schemaVersion = APP_SCHEMA_VERSION;
    saveState();
  }

  if (!["stack", "workers", "construction", "assets"].includes(state.activeDashboardView)) {
    state.activeDashboardView = "stack";
  }

  SHAPES.forEach((shape) => ensureDraft(shape.id));
}

function init() {
  loadInitialState();
  bindEvents();
  renderAll();
  startRewardCountdownTicker();

  if (state.connected) {
    processDailyBrickRewards({ reason: "init" });
    scheduleDailyRewardTimer();
    showToast("H-Cash Wallet restored.");
  } else {
    clearDailyRewardTimer();
  }
}

init();
