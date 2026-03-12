// ─── Tooth Type Constants ──────────────────────────────────────────────────
export const TOOTH_TYPE = {
  INCISOR: 'incisor',
  CANINE: 'canine',
  PREMOLAR: 'premolar',
  MOLAR: 'molar',
}

export const ARCH = { UPPER: 'upper', LOWER: 'lower' }
export const QUADRANT = { UR: 1, UL: 2, LL: 3, LR: 4 }

// ─── FDI Tooth Definitions ────────────────────────────────────────────────
// Each tooth: fdi number, Palmer name, type, arch, quadrant
// mesialRight = true means mesial surface is on the RIGHT side of the drawn box
// (true for upper-right & lower-right quadrants when arch is laid out with midline center)
export const TEETH_META = [
  // Upper Right  (FDI: 18→11, displayed left→right on screen)
  { fdi: 18, palmer: 'UR8', uns: 1,  type: TOOTH_TYPE.MOLAR,    arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  { fdi: 17, palmer: 'UR7', uns: 2,  type: TOOTH_TYPE.MOLAR,    arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  { fdi: 16, palmer: 'UR6', uns: 3,  type: TOOTH_TYPE.MOLAR,    arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  { fdi: 15, palmer: 'UR5', uns: 4,  type: TOOTH_TYPE.PREMOLAR, arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  { fdi: 14, palmer: 'UR4', uns: 5,  type: TOOTH_TYPE.PREMOLAR, arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  { fdi: 13, palmer: 'UR3', uns: 6,  type: TOOTH_TYPE.CANINE,   arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  { fdi: 12, palmer: 'UR2', uns: 7,  type: TOOTH_TYPE.INCISOR,  arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  { fdi: 11, palmer: 'UR1', uns: 8,  type: TOOTH_TYPE.INCISOR,  arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  // Upper Left   (FDI: 21→28, displayed left→right on screen)
  { fdi: 21, palmer: 'UL1', uns: 9,  type: TOOTH_TYPE.INCISOR,  arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  { fdi: 22, palmer: 'UL2', uns: 10, type: TOOTH_TYPE.INCISOR,  arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  { fdi: 23, palmer: 'UL3', uns: 11, type: TOOTH_TYPE.CANINE,   arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  { fdi: 24, palmer: 'UL4', uns: 12, type: TOOTH_TYPE.PREMOLAR, arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  { fdi: 25, palmer: 'UL5', uns: 13, type: TOOTH_TYPE.PREMOLAR, arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  { fdi: 26, palmer: 'UL6', uns: 14, type: TOOTH_TYPE.MOLAR,    arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  { fdi: 27, palmer: 'UL7', uns: 15, type: TOOTH_TYPE.MOLAR,    arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  { fdi: 28, palmer: 'UL8', uns: 16, type: TOOTH_TYPE.MOLAR,    arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  // Lower Left   (FDI: 31→38, displayed left→right on screen)
  { fdi: 31, palmer: 'LL1', uns: 24, type: TOOTH_TYPE.INCISOR,  arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  { fdi: 32, palmer: 'LL2', uns: 23, type: TOOTH_TYPE.INCISOR,  arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  { fdi: 33, palmer: 'LL3', uns: 22, type: TOOTH_TYPE.CANINE,   arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  { fdi: 34, palmer: 'LL4', uns: 21, type: TOOTH_TYPE.PREMOLAR, arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  { fdi: 35, palmer: 'LL5', uns: 20, type: TOOTH_TYPE.PREMOLAR, arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  { fdi: 36, palmer: 'LL6', uns: 19, type: TOOTH_TYPE.MOLAR,    arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  { fdi: 37, palmer: 'LL7', uns: 18, type: TOOTH_TYPE.MOLAR,    arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  { fdi: 38, palmer: 'LL8', uns: 17, type: TOOTH_TYPE.MOLAR,    arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  // Lower Right  (FDI: 48→41, displayed left→right on screen)
  { fdi: 48, palmer: 'LR8', uns: 32, type: TOOTH_TYPE.MOLAR,    arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
  { fdi: 47, palmer: 'LR7', uns: 31, type: TOOTH_TYPE.MOLAR,    arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
  { fdi: 46, palmer: 'LR6', uns: 30, type: TOOTH_TYPE.MOLAR,    arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
  { fdi: 45, palmer: 'LR5', uns: 29, type: TOOTH_TYPE.PREMOLAR, arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
  { fdi: 44, palmer: 'LR4', uns: 28, type: TOOTH_TYPE.PREMOLAR, arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
  { fdi: 43, palmer: 'LR3', uns: 27, type: TOOTH_TYPE.CANINE,   arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
  { fdi: 42, palmer: 'LR2', uns: 26, type: TOOTH_TYPE.INCISOR,  arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
  { fdi: 41, palmer: 'LR1', uns: 25, type: TOOTH_TYPE.INCISOR,  arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
]

// Quick lookup by FDI number
export const TEETH_BY_FDI = Object.fromEntries(TEETH_META.map(t => [t.fdi, t]))

// Arch display order (left → right on screen)
export const UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
export const LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

// ─── Condition Definitions ────────────────────────────────────────────────
export const CONDITIONS = {
  // Surface conditions
  caries:    { label: 'Caries',       color: '#e53935', surface: true,  fullTooth: false, category: 'Decay'        },
  composite: { label: 'Composite',    color: '#1e88e5', surface: true,  fullTooth: false, category: 'Restorations' },
  amalgam:   { label: 'Amalgam',      color: '#546e7a', surface: true,  fullTooth: false, category: 'Restorations' },
  gic:       { label: 'GIC',          color: '#78909c', surface: true,  fullTooth: false, category: 'Restorations' },
  gold:      { label: 'Gold',         color: '#f9a825', surface: true,  fullTooth: false, category: 'Restorations' },
  // Full-tooth conditions
  crown:           { label: 'Crown',             color: '#fb8c00', surface: false, fullTooth: true, category: 'Prosthetics'   },
  'crown-gold':    { label: 'Gold Crown',         color: '#f9a825', surface: false, fullTooth: true, category: 'Prosthetics'   },
  'crown-zirconia':{ label: 'Zirconia Crown',     color: '#90a4ae', surface: false, fullTooth: true, category: 'Prosthetics'   },
  veneer:          { label: 'Veneer',             color: '#7e57c2', surface: false, fullTooth: true, category: 'Prosthetics'   },
  'inlay-onlay':   { label: 'Inlay/Onlay',        color: '#f9a825', surface: true,  fullTooth: false, category: 'Prosthetics'  },
  bridge:          { label: 'Bridge',             color: '#fb8c00', surface: false, fullTooth: true, category: 'Prosthetics'   },
  rct:             { label: 'RCT',                color: '#d81b60', surface: false, fullTooth: true, category: 'Endodontics'   },
  'post-core':     { label: 'Post & Core',        color: '#ad1457', surface: false, fullTooth: true, category: 'Endodontics'   },
  implant:         { label: 'Implant',            color: '#43a047', surface: false, fullTooth: true, category: 'Implantology'  },
  'implant-crown': { label: 'Implant Crown',      color: '#2e7d32', surface: false, fullTooth: true, category: 'Implantology'  },
  missing:         { label: 'Missing',            color: '#9e9e9e', surface: false, fullTooth: true, category: 'Surgical'      },
  'extraction-planned': { label: 'Extraction',   color: '#e53935', surface: false, fullTooth: true, category: 'Surgical'      },
  fracture:        { label: 'Fracture',           color: '#f57f17', surface: false, fullTooth: true, category: 'Other'         },
  erosion:         { label: 'Erosion',            color: '#ff8a65', surface: true,  fullTooth: false, category: 'Other'        },
  staining:        { label: 'Staining',           color: '#a1887f', surface: true,  fullTooth: false, category: 'Other'        },
}

export const CONDITION_CATEGORIES = ['Decay', 'Restorations', 'Prosthetics', 'Endodontics', 'Implantology', 'Surgical', 'Other']

// ─── Default Tooth State Factory ─────────────────────────────────────────
export function createDefaultTooth(fdi) {
  return {
    fdi,
    missing: false,
    unerupted: false,
    implant: false,
    bridgeStart: false,
    bridgeEnd: false,
    bridgePontic: false,
    surfaces: {
      buccal:   { condition: null, status: 'existing' },
      lingual:  { condition: null, status: 'existing' },
      mesial:   { condition: null, status: 'existing' },
      distal:   { condition: null, status: 'existing' },
      occlusal: { condition: null, status: 'existing' },
    },
    toothCondition: null,
    toothConditionStatus: 'existing',
    notes: '',
  }
}

// ─── Notation Helpers ─────────────────────────────────────────────────────
export function getToothLabel(fdi, notation = 'FDI') {
  const meta = TEETH_BY_FDI[fdi]
  if (!meta) return String(fdi)
  if (notation === 'Palmer') return meta.palmer
  if (notation === 'UNS')    return String(meta.uns)
  return String(fdi)
}

// ─── Color Helpers ────────────────────────────────────────────────────────
// Returns fill color for a surface given its condition and status
export function getSurfaceColor(condition, status) {
  if (!condition) return '#ffffff'
  const base = CONDITIONS[condition]?.color || '#ffffff'
  if (status === 'planned') return base + '55'    // semi-transparent = planned
  if (status === 'completed') return base + 'bb'  // slightly muted = completed
  return base
}

export function getConditionColor(condition) {
  return CONDITIONS[condition]?.color || '#000000'
}

// ─── Deciduous (Primary) Teeth ────────────────────────────────────────────
// FDI 55–51 upper right, 61–65 upper left, 71–75 lower left, 85–81 lower right
export const DECIDUOUS_META = [
  // Upper Right
  { fdi: 55, palmer: 'URe', uns: 'A', type: TOOTH_TYPE.MOLAR,    arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  { fdi: 54, palmer: 'URd', uns: 'B', type: TOOTH_TYPE.PREMOLAR, arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  { fdi: 53, palmer: 'URc', uns: 'C', type: TOOTH_TYPE.CANINE,   arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  { fdi: 52, palmer: 'URb', uns: 'D', type: TOOTH_TYPE.INCISOR,  arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  { fdi: 51, palmer: 'URa', uns: 'E', type: TOOTH_TYPE.INCISOR,  arch: ARCH.UPPER, quadrant: QUADRANT.UR, mesialRight: true  },
  // Upper Left
  { fdi: 61, palmer: 'ULa', uns: 'F', type: TOOTH_TYPE.INCISOR,  arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  { fdi: 62, palmer: 'ULb', uns: 'G', type: TOOTH_TYPE.INCISOR,  arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  { fdi: 63, palmer: 'ULc', uns: 'H', type: TOOTH_TYPE.CANINE,   arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  { fdi: 64, palmer: 'ULd', uns: 'I', type: TOOTH_TYPE.PREMOLAR, arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  { fdi: 65, palmer: 'ULe', uns: 'J', type: TOOTH_TYPE.MOLAR,    arch: ARCH.UPPER, quadrant: QUADRANT.UL, mesialRight: false },
  // Lower Left
  { fdi: 71, palmer: 'LLa', uns: 'K', type: TOOTH_TYPE.INCISOR,  arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  { fdi: 72, palmer: 'LLb', uns: 'L', type: TOOTH_TYPE.INCISOR,  arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  { fdi: 73, palmer: 'LLc', uns: 'M', type: TOOTH_TYPE.CANINE,   arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  { fdi: 74, palmer: 'LLd', uns: 'N', type: TOOTH_TYPE.PREMOLAR, arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  { fdi: 75, palmer: 'LLe', uns: 'O', type: TOOTH_TYPE.MOLAR,    arch: ARCH.LOWER, quadrant: QUADRANT.LL, mesialRight: false },
  // Lower Right
  { fdi: 85, palmer: 'LRe', uns: 'P', type: TOOTH_TYPE.MOLAR,    arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
  { fdi: 84, palmer: 'LRd', uns: 'Q', type: TOOTH_TYPE.PREMOLAR, arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
  { fdi: 83, palmer: 'LRc', uns: 'R', type: TOOTH_TYPE.CANINE,   arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
  { fdi: 82, palmer: 'LRb', uns: 'S', type: TOOTH_TYPE.INCISOR,  arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
  { fdi: 81, palmer: 'LRa', uns: 'T', type: TOOTH_TYPE.INCISOR,  arch: ARCH.LOWER, quadrant: QUADRANT.LR, mesialRight: true  },
]

// Merge deciduous into TEETH_BY_FDI lookup
DECIDUOUS_META.forEach(t => { TEETH_BY_FDI[t.fdi] = t })

export const DECIDUOUS_UPPER_RIGHT = [55, 54, 53, 52, 51]
export const DECIDUOUS_UPPER_LEFT  = [61, 62, 63, 64, 65]
export const DECIDUOUS_LOWER_LEFT  = [71, 72, 73, 74, 75]
export const DECIDUOUS_LOWER_RIGHT = [85, 84, 83, 82, 81]

export const DECIDUOUS_UPPER_ARCH = [...DECIDUOUS_UPPER_RIGHT, ...DECIDUOUS_UPPER_LEFT]
export const DECIDUOUS_LOWER_ARCH = [...DECIDUOUS_LOWER_RIGHT, ...DECIDUOUS_LOWER_LEFT]

// ─── Tooth Status Definitions ─────────────────────────────────────────────
export const TOOTH_STATUSES = [
  { value: 'present',           label: 'Present' },
  { value: 'unerupted',         label: 'Unerupted' },
  { value: 'partially_erupted', label: 'Partially Erupted' },
  { value: 'missing',           label: 'Missing' },
  { value: 'extracted',         label: 'Extracted' },
  { value: 'implanted',         label: 'Implanted' },
  { value: 'retained_root',     label: 'Retained Root' },
]
