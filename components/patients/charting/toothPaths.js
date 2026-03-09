/**
 * SVG path data for dental tooth illustrations.
 * Front view:   viewBox "0 0 48 82"
 * Occlusal view: viewBox "0 0 52 52"
 *
 * FRONT VIEW structure per tooth type:
 *   { crown: '<path d="...">', roots: ['<path d="...">',..] }
 *
 * OCCLUSAL VIEW is the same outer clip shape for all teeth,
 * with 5 clipped surface polygon regions.
 */

// ─── Front View Paths ─────────────────────────────────────────────────────
// viewBox = "0 0 48 82"
export const FRONT_PATHS = {
  incisor: {
    crown: 'M 13,44 C 11,34 11,20 13,12 Q 17,5 24,5 Q 31,5 35,12 C 37,20 37,34 35,44 Q 29,48 24,48 Q 19,48 13,44 Z',
    roots: [
      'M 15,47 Q 24,51 33,47 L 30,68 Q 28,77 24,79 Q 20,77 18,68 Z',
    ],
  },
  canine: {
    crown: 'M 12,43 C 10,30 11,16 14,8 Q 18,2 24,2 Q 30,2 34,8 C 37,16 38,30 36,43 Q 30,47 24,47 Q 18,47 12,43 Z',
    roots: [
      'M 13,46 Q 24,50 35,46 L 31,70 Q 28,80 24,82 Q 20,80 17,70 Z',
    ],
  },
  premolar: {
    crown: 'M 9,42 C 8,30 8,18 11,10 Q 15,3 24,3 Q 33,3 37,10 C 40,18 40,30 39,42 Q 32,46 24,46 Q 16,46 9,42 Z',
    roots: [
      'M 10,45 Q 24,50 38,45 L 34,66 Q 31,75 24,77 Q 17,75 14,66 Z',
    ],
  },
  molar: {
    crown: 'M 3,40 C 2,28 2,15 6,7 Q 12,1 24,1 Q 36,1 42,7 C 46,15 46,28 45,40 Q 36,46 24,46 Q 12,46 3,40 Z',
    roots: [
      'M 4,44 Q 11,49 18,48 L 15,66 Q 13,74 10,74 Q 7,72 7,65 Z',
      'M 44,44 Q 37,49 30,48 L 33,66 Q 35,74 38,74 Q 41,72 41,65 Z',
    ],
  },
}

// ─── Occlusal View ────────────────────────────────────────────────────────
// viewBox = "0 0 52 52"
// One outer shape (used as clipPath) — same organic oval for all teeth
export const OCCLUSAL_CLIP = 'M 11,4 C 22,2 30,2 41,4 C 48,7 50,15 50,26 C 50,37 48,45 41,48 C 30,50 22,50 11,48 C 4,45 2,37 2,26 C 2,15 4,7 11,4 Z'

// 5 surface polygon point strings (within 52×52 space, clipped by OCCLUSAL_CLIP)
export const OCCLUSAL_SURFACES = {
  buccal:   '0,0 52,0 40,20 12,20',
  lingual:  '12,32 40,32 52,52 0,52',
  mesial:   '0,0 12,20 12,32 0,52',      // left side of the box
  distal:   '40,20 52,0 52,52 40,32',    // right side of the box
  occlusal: '12,20 40,20 40,32 12,32',   // center rectangle
}
