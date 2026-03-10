export function getDegreLabel(tier) {
  if (tier === 1) return '· 1st';
  if (tier === 2) return '· 2nd';
  if (tier === 3) return '· 3rd';
  if (tier === 4) return '· 4th';
  if (tier === 5) return '· 5th';
  if (tier === 6) return '· 6th';
  return '· –';
}
