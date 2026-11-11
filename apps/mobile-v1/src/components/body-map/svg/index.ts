import { NEUTRAL_FRONT_SVG } from './neutralFrontSvg';
import { NEUTRAL_BACK_SVG } from './neutralBackSvg';
import { MALE_FRONT_SVG } from './maleFrontSvg';
import { MALE_BACK_SVG } from './maleBackSvg';
import { FEMALE_FRONT_SVG } from './femaleFrontSvg';
import { FEMALE_BACK_SVG } from './femaleBackSvg';
import type { BodyMapViewType, BodyMapVariantType } from '@repo/schema';
import { theme } from '../../../theme';

const SELECTION_FILL = theme.colors.primary.DEFAULT;
const SELECTION_STROKE = theme.colors.primary.dark;

export interface BodyMapDimensions {
  x: number;
  y: number;
  w: number;
  h: number;
}

export {
  NEUTRAL_FRONT_SVG,
  NEUTRAL_BACK_SVG,
  MALE_FRONT_SVG,
  MALE_BACK_SVG,
  FEMALE_FRONT_SVG,
  FEMALE_BACK_SVG,
};

export function getBodyMapDimensions(
  view: BodyMapViewType,
  variant: BodyMapVariantType = 'neutral',
): BodyMapDimensions {
  if (view === 'Front') {
    return variant === 'female'
      ? { x: 0, y: 0, w: 262, h: 533 }
      : { x: 0, y: 0, w: 294, h: 545 };
  } else {
    return variant === 'female'
      ? { x: 0, y: 0, w: 303, h: 560 }
      : { x: 0, y: 0, w: 276, h: 526 };
  }
}

export function getBodyMapRawSvg(
  view: BodyMapViewType,
  variant: BodyMapVariantType = 'neutral',
): string {
  if (view === 'Front') {
    if (variant === 'female') return FEMALE_FRONT_SVG;
    if (variant === 'male') return MALE_FRONT_SVG;
    return NEUTRAL_FRONT_SVG;
  } else {
    if (variant === 'female') return FEMALE_BACK_SVG;
    if (variant === 'male') return MALE_BACK_SVG;
    return NEUTRAL_BACK_SVG;
  }
}

/**
 * react-native-svg's XML parser camel-cases every attribute (`data-anatomy-id` -> `dataAnatomyId`)
 * and forwards it to the element. On web those end up on real DOM nodes, and React logs a
 * console error per unknown prop. They carry no rendering information, so drop them
 * from the string that is actually rendered (after highlighting, which relies on them).
 */
export function stripDataAttributes(xml: string): string {
  return xml.replace(/\sdata-[a-z-]+="[^"]*"/gi, '');
}

/**
 * Returns the SVG string with the selected anatomy highlighted in the app's primary colour.
 */
export function getBodyMapProcessedSvg(
  view: BodyMapViewType,
  variant: BodyMapVariantType = 'neutral',
  selectedAnatomyId?: string | null,
  viewBox?: BodyMapDimensions,
): string {
  let xml = getBodyMapRawSvg(view, variant);

  if (viewBox) {
    xml = xml.replace(
      /viewBox="[^"]*"/,
      `viewBox="${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}"`,
    );
  }

  if (!selectedAnatomyId) return xml;

  const applyHighlight = (tag: string): string => {
    let res = tag;
    if (/style="[^"]*"/.test(res)) {
      res = res.replace(/style="[^"]*"/, `style="fill: ${SELECTION_FILL}; stroke: ${SELECTION_STROKE}; stroke-width: 2.5px;"`);
    }
    if (/fill="[^"]*"/.test(res)) {
      res = res.replace(/fill="[^"]*"/, `fill="${SELECTION_FILL}"`);
    } else {
      res = res.replace(/^<[a-zA-Z]+/, (m) => `${m} fill="${SELECTION_FILL}"`);
    }
    if (/stroke="[^"]*"/.test(res)) {
      res = res.replace(/stroke="[^"]*"/, `stroke="${SELECTION_STROKE}"`);
    } else {
      res = res.replace(/^<[a-zA-Z]+/, (m) => `${m} stroke="${SELECTION_STROKE}"`);
    }
    if (/stroke-width="[^"]*"/.test(res)) {
      res = res.replace(/stroke-width="[^"]*"/, 'stroke-width="2.5"');
    } else {
      res = res.replace(/^<[a-zA-Z]+/, (m) => `${m} stroke-width="2.5"`);
    }
    return res;
  };

  // 1. Group match with nested-tag depth tracking
  const groupStartRegex = new RegExp(`(<g\\b[^>]*data-anatomy-id="${selectedAnatomyId}"[^>]*>)`, 'i');
  const groupMatch = groupStartRegex.exec(xml);

  if (groupMatch) {
    const startIndex = groupMatch.index;
    let depth = 0;
    let endIndex = startIndex;
    const tagRegex = /<\/?g\b[^>]*>/gi;
    tagRegex.lastIndex = startIndex;
    let tMatch: RegExpExecArray | null;
    while ((tMatch = tagRegex.exec(xml)) !== null) {
      if (tMatch[0].startsWith('</')) {
        depth--;
        if (depth === 0) {
          endIndex = tMatch.index + tMatch[0].length;
          break;
        }
      } else {
        depth++;
      }
    }

    if (endIndex > startIndex) {
      const before = xml.slice(0, startIndex);
      const groupContent = xml.slice(startIndex, endIndex);
      const after = xml.slice(endIndex);
      const highlightedGroup = groupContent.replace(/(<(?:path|ellipse|circle|rect)\b[^>]*>)/gi, applyHighlight);
      return before + highlightedGroup + after;
    }
  }

  // 2. Direct shape match
  const tagRegex = new RegExp(
    `(<(?:path|ellipse|circle|rect)\\b[^>]*data-anatomy-id="${selectedAnatomyId}"[^>]*>)`,
    'gi',
  );
  return xml.replace(tagRegex, applyHighlight);
}

