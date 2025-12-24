export function roundTo(number: number, digits: number = 10) {
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}
