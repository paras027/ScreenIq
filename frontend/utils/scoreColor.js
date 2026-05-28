export function scoreColor(score) {
  if (score < 5) return 'text-red-600';
  if (score <= 7) return 'text-amber-500';
  return 'text-green-600';
}

export function scoreBadgeColor(score) {
  if (score < 5) return 'bg-red-100 text-red-700';
  if (score <= 7) return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
}
