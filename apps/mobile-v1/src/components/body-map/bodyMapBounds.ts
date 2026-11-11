// Canonical SVG Anatomy Bounding Boxes extracted from Web SVG assets
import type { BodyMapViewType, BodyMapVariantType, ExactPointDTO } from '@repo/schema';

export interface AnatomyBBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FRONT_BOUNDS: Record<string, [number, number, number, number]> = {
  'cranium': [134, 19, 52, 75], 'forehead': [134, 19, 52, 75],
  'nose': [157, 56, 7, 12], 'mouth': [154, 71, 12, 6],
  'chin': [154, 80, 12, 8], 'face': [134, 19, 52, 75],
  'right-ear': [131, 50, 6, 17], 'left-ear': [183, 49, 6, 18],
  'head': [131, 19, 58, 75], 'anterior-neck': [112, 80, 97, 37],
  'neck': [112, 80, 97, 37], 'head-neck': [112, 19, 97, 98],
  'right-chest': [104, 111, 57, 61], 'left-chest': [160, 111, 56, 61],
  'chest': [104, 111, 112, 61], 'upper-abdomen': [108, 157, 104, 71],
  'lower-abdomen': [115, 214, 90, 105], 'abdomen': [108, 157, 104, 162],
  'groin': [167, 274, 35, 102], 'torso': [104, 111, 112, 265],
  'right-shoulder': [77, 110, 41, 46], 'right-upper-arm': [76, 136, 37, 74],
  'right-elbow': [61, 222, 16, 16], 'right-forearm': [56, 192, 40, 79],
  'right-wrist': [45, 266, 19, 16], 'right-thumb-nail': [41, 283, 4, 5],
  'right-thumb': [37, 279, 13, 13], 'right-index-finger-nail': [44, 296, 4, 5],
  'right-index-finger': [40, 287, 12, 23], 'right-middle-finger': [49, 292, 9, 24],
  'right-ring-finger': [57, 293, 8, 22], 'right-little-finger': [65, 293, 5, 18],
  'right-hand': [37, 272, 34, 44], 'left-shoulder': [202, 110, 41, 46],
  'left-upper-arm': [207, 136, 38, 74], 'left-elbow': [243, 222, 16, 16],
  'left-forearm': [223, 192, 42, 79], 'left-wrist': [256, 266, 19, 16],
  'left-thumb-nail': [275, 283, 4, 5], 'left-thumb': [270, 279, 14, 13],
  'left-index-finger-nail': [273, 297, 4, 5], 'left-index-finger': [269, 288, 11, 22],
  'left-middle-finger': [261, 292, 10, 24], 'left-ring-finger': [255, 292, 8, 23],
  'left-little-finger': [250, 293, 6, 17], 'left-hand': [249, 272, 35, 44],
  'upper-limb': [37, 110, 247, 206], 'right-thigh': [95, 260, 35, 215],
  'right-knee': [103, 353, 24, 24], 'right-shin': [89, 366, 41, 109],
  'right-ankle': [88, 457, 16, 16], 'right-big-toe': [99, 502, 6, 8],
  'right-foot': [74, 471, 35, 42], 'left-thigh': [191, 260, 34, 107],
  'left-knee': [193, 353, 24, 24], 'left-shin': [190, 353, 41, 122],
  'left-ankle': [215, 457, 16, 16], 'left-big-toe': [215, 502, 6, 8],
  'left-foot': [211, 471, 35, 42], 'lower-limb': [74, 260, 172, 253],
};

export const BACK_BOUNDS: Record<string, [number, number, number, number]> = {
  'cranium': [99, 16, 52, 50], 'left-ear': [99, 35, 5, 12],
  'right-ear': [147, 35, 5, 12], 'head': [99, 16, 53, 50],
  'posterior-neck': [75, 45, 49, 139], 'neck': [75, 45, 49, 139],
  'head-neck': [75, 16, 77, 168], 'upper-back': [42, 105, 166, 154],
  'lower-back': [82, 197, 86, 62], 'sacrum': [105, 295, 16, 38],
  'left-buttock': [65, 244, 62, 63], 'right-buttock': [123, 244, 62, 63],
  'torso': [42, 105, 166, 228], 'left-shoulder': [108, 64, 18, 113],
  'left-upper-arm': [41, 149, 25, 68], 'left-elbow': [26, 220, 16, 16],
  'left-forearm': [23, 190, 39, 77], 'left-wrist': [10, 263, 30, 25],
  'left-thumb-nail': [7, 280, 3, 4], 'left-thumb': [1, 276, 14, 13],
  'left-index-finger-nail': [12, 298, 3, 4], 'left-index-finger': [12, 298, 3, 4],
  'left-middle-finger': [18, 304, 3, 4], 'left-ring-finger': [24, 302, 3, 4],
  'left-little-finger': [30, 298, 3, 4], 'left-hand': [1, 276, 36, 37],
  'right-shoulder': [124, 64, 17, 114], 'right-upper-arm': [184, 149, 25, 68],
  'right-elbow': [207, 220, 16, 16], 'right-forearm': [188, 190, 39, 78],
  'right-wrist': [210, 263, 30, 25], 'right-thumb-nail': [241, 280, 3, 4],
  'right-thumb': [236, 276, 12, 13], 'right-index-finger-nail': [236, 298, 3, 4],
  'right-index-finger': [236, 298, 3, 4], 'right-middle-finger': [230, 304, 3, 4],
  'right-ring-finger': [224, 302, 3, 4], 'right-little-finger': [218, 298, 3, 4],
  'right-hand': [213, 276, 35, 37], 'upper-limb': [1, 64, 247, 249],
  'left-thigh': [60, 287, 51, 84], 'left-knee': [84, 360, 20, 20],
  'left-shin': [41, 349, 54, 161], 'left-ankle': [53, 457, 14, 14],
  'left-foot': [41, 416, 41, 94], 'right-thigh': [139, 287, 51, 83],
  'right-knee': [150, 360, 20, 20], 'right-shin': [155, 349, 54, 161],
  'right-ankle': [183, 457, 14, 14], 'right-foot': [168, 416, 41, 94],
  'lower-limb': [41, 287, 168, 223],
};

export const FEMALE_FRONT_BOUNDS: Record<string, [number, number, number, number]> = {
  'cranium': [99, 12, 49, 73], 'forehead': [99, 12, 49, 73],
  'nose': [120, 50, 7, 11], 'mouth': [118, 64, 11, 6],
  'chin': [118, 73, 11, 7], 'face': [99, 12, 49, 73],
  'right-ear': [97, 50, 5, 11], 'left-ear': [145, 50, 5, 11],
  'head': [97, 12, 53, 73], 'anterior-neck': [89, 76, 69, 28],
  'neck': [89, 76, 69, 28], 'head-neck': [89, 12, 69, 92],
  'right-chest': [73, 96, 51, 65], 'left-chest': [123, 96, 51, 66],
  'chest': [73, 96, 101, 66], 'upper-abdomen': [83, 156, 80, 139],
  'lower-abdomen': [90, 211, 66, 93], 'abdomen': [83, 156, 80, 148],
  'groin': [98, 275, 22, 94], 'torso': [73, 96, 101, 273],
  'right-shoulder': [53, 94, 38, 48], 'right-upper-arm': [45, 132, 33, 63],
  'right-elbow': [41, 173, 14, 14], 'right-forearm': [14, 181, 49, 81],
  'right-wrist': [63, 227, 34, 142], 'right-thumb-nail': [13, 243, 4, 4],
  'right-thumb': [13, 243, 242, 23], 'right-index-finger-nail': [16, 258, 4, 4],
  'right-index-finger': [16, 258, 4, 4], 'right-middle-finger': [19, 266, 4, 4],
  'right-ring-finger': [22, 263, 4, 4], 'right-little-finger': [25, 258, 4, 4],
  'right-hand': [0, 243, 255, 36], 'left-shoulder': [156, 94, 38, 48],
  'left-upper-arm': [169, 132, 32, 62], 'left-elbow': [191, 173, 14, 14],
  'left-forearm': [183, 182, 50, 80], 'left-wrist': [150, 227, 33, 142],
  'left-thumb-nail': [228, 243, 4, 4], 'left-thumb': [85, 243, 147, 245],
  'left-index-finger-nail': [225, 258, 4, 4], 'left-index-finger': [225, 258, 4, 4],
  'left-middle-finger': [222, 266, 4, 4], 'left-ring-finger': [219, 263, 4, 4],
  'left-little-finger': [216, 258, 4, 4], 'left-hand': [85, 243, 163, 245],
  'upper-limb': [0, 94, 255, 394], 'right-thigh': [70, 224, 35, 135],
  'right-knee': [84, 344, 22, 22], 'right-shin': [99, 378, 18, 107],
  'right-ankle': [71, 448, 14, 14], 'right-big-toe': [81, 491, 6, 8],
  'right-foot': [81, 486, 30, 27], 'left-thigh': [132, 356, 30, 133],
  'left-knee': [141, 344, 22, 22], 'left-shin': [140, 392, 26, 97],
  'left-ankle': [161, 448, 14, 14], 'left-big-toe': [159, 491, 6, 8],
  'left-foot': [137, 490, 28, 18], 'lower-limb': [70, 224, 105, 289],
};

export const FEMALE_BACK_BOUNDS: Record<string, [number, number, number, number]> = {
  'cranium': [115, 16, 50, 51], 'left-ear': [116, 35, 5, 12],
  'right-ear': [160, 35, 5, 12], 'head': [115, 16, 50, 51],
  'posterior-neck': [103, 64, 74, 108], 'neck': [103, 64, 74, 108],
  'head-neck': [103, 16, 74, 156], 'upper-back': [79, 103, 121, 108],
  'lower-back': [90, 178, 99, 68], 'sacrum': [120, 297, 16, 32],
  'left-buttock': [80, 229, 61, 76], 'right-buttock': [138, 229, 62, 77],
  'torso': [79, 103, 121, 226], 'left-shoulder': [70, 97, 40, 74],
  'left-upper-arm': [62, 142, 25, 90], 'left-elbow': [44, 212, 16, 16],
  'left-forearm': [32, 192, 38, 72], 'left-wrist': [17, 256, 22, 21],
  'left-thumb-nail': [12, 264, 3, 4], 'left-thumb': [8, 262, 11, 7],
  'left-index-finger-nail': [15, 274, 3, 4], 'left-index-finger': [15, 274, 3, 4],
  'left-middle-finger': [20, 276, 3, 4], 'left-ring-finger': [24, 274, 3, 4],
  'left-little-finger': [28, 270, 3, 4], 'left-hand': [8, 262, 25, 22],
  'right-shoulder': [170, 97, 40, 74], 'right-upper-arm': [192, 143, 25, 87],
  'right-elbow': [221, 212, 16, 16], 'right-forearm': [210, 192, 38, 72],
  'right-wrist': [240, 256, 23, 21], 'right-thumb-nail': [265, 264, 3, 4],
  'right-thumb': [260, 262, 11, 8], 'right-index-finger-nail': [263, 274, 3, 4],
  'right-index-finger': [263, 274, 3, 4], 'right-middle-finger': [259, 276, 3, 4],
  'right-ring-finger': [255, 274, 3, 4], 'right-little-finger': [251, 270, 3, 4],
  'right-hand': [247, 262, 24, 23], 'upper-limb': [8, 97, 263, 188],
  'left-thigh': [80, 291, 57, 85], 'left-knee': [100, 360, 20, 20],
  'left-shin': [97, 365, 36, 157], 'left-ankle': [109, 473, 14, 14],
  'left-foot': [99, 365, 34, 157], 'right-thigh': [143, 290, 57, 86],
  'right-knee': [160, 360, 20, 20], 'right-shin': [147, 365, 36, 157],
  'right-ankle': [158, 473, 14, 14], 'right-foot': [149, 436, 32, 86],
  'lower-limb': [80, 290, 120, 232],
};

export function getAnatomyBoundingBox(
  id: string,
  view: BodyMapViewType,
  variant: BodyMapVariantType = 'neutral',
): AnatomyBBox | null {
  const map = variant === 'female'
    ? (view === 'Front' ? FEMALE_FRONT_BOUNDS : FEMALE_BACK_BOUNDS)
    : (view === 'Front' ? FRONT_BOUNDS : BACK_BOUNDS);
  const arr = map[id];
  if (!arr) return null;
  return { x: arr[0], y: arr[1], w: arr[2], h: arr[3] };
}

export function findAnatomyAtSvgCoords(
  svgX: number,
  svgY: number,
  view: BodyMapViewType,
  variant: BodyMapVariantType = 'neutral',
): string | null {
  const map = variant === 'female'
    ? (view === 'Front' ? FEMALE_FRONT_BOUNDS : FEMALE_BACK_BOUNDS)
    : (view === 'Front' ? FRONT_BOUNDS : BACK_BOUNDS);

  let bestId: string | null = null;
  let smallestArea = Infinity;

  for (const [id, [x, y, w, h]] of Object.entries(map)) {
    if (svgX >= x && svgX <= x + w && svgY >= y && svgY <= y + h) {
      const area = w * h;
      if (area < smallestArea) {
        smallestArea = area;
        bestId = id;
      }
    }
  }

  return bestId;
}

export function getPinSvgCoords(
  anatomyId: string | null,
  exactPoint: ExactPointDTO | null,
  view: BodyMapViewType,
  variant: BodyMapVariantType = 'neutral',
  defaultDim?: { w: number; h: number },
): { svgX: number; svgY: number } | null {
  if (!exactPoint) return null;
  const bbox = anatomyId ? getAnatomyBoundingBox(anatomyId, view, variant) : null;
  if (bbox && bbox.w > 0 && bbox.h > 0) {
    return {
      svgX: bbox.x + exactPoint.x * bbox.w,
      svgY: bbox.y + exactPoint.y * bbox.h,
    };
  }
  if (defaultDim) {
    return {
      svgX: exactPoint.x * defaultDim.w,
      svgY: exactPoint.y * defaultDim.h,
    };
  }
  return null;
}
