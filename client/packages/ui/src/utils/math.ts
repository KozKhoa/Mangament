export function roundTo(number: number, digits: number = 10) {
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

export function sum(arr: number[]) {
  let sum = 0;
  arr.forEach((v) => (sum += v));
  return sum;
}
