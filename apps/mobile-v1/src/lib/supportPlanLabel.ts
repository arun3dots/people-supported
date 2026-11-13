/** Use supported-living terminology for labels without changing stored values. */
export function supportPlanLabel(label: string): string {
  return label.replace(/\bcare[\s_-]*plans?\b/gi, (match) => {
    const plural = /plans$/i.test(match);
    const replacement = plural ? 'support plans' : 'support plan';
    if (match === match.toUpperCase()) return replacement.toUpperCase();
    return /^[A-Z]/.test(match)
      ? (plural ? 'Support Plans' : 'Support Plan')
      : replacement;
  });
}
