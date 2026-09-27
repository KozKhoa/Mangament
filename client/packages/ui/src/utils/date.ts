export function diffDate(date1: Date, date2: Date) {
  if (!date1 || !date2) return 0;
  const diffMs = date1.getTime() - date2.getTime();

  const diffD = diffMs / (1000 * 60 * 60 * 24);

  return Math.floor(diffD);
}
