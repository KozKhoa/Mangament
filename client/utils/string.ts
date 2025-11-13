export function capitalizeFirstChar(str: string): string {
  const newStr = str.charAt(0)?.toUpperCase() + str.slice(1);
  return newStr;
}

export function capitalizeWords(str: string): string {
  str = str.toLowerCase();
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
