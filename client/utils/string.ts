export function capitalizeFirstChar(str: string): string {
  return str.charAt(0)?.toUpperCase() + str.slice(1);
}

export function capitalizeWords(str: string): string {
  str = str.toLowerCase();
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function snakeCaseToNormal(snake: string) {
  return capitalizeFirstChar(snake.split("_").join(" "));
}

export function snakeCaseToCapitalizeWord(snake: string) {
  return snake
    .split("_")
    .map((word) => capitalizeFirstChar(word))
    .join(" ");
}

export function snakeCaseToAllCapital(str: string) {
  return str.replaceAll("_", " ").toLocaleUpperCase();
}

export function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD") // tách dấu
    .replaceAll(/[\u0300-\u036f]/g, "") // xóa dấu
    .replaceAll(/[^a-zA-Z0-9]/g, " ")
    .replaceAll(/\s+/g, " ") // chuẩn hóa space
    .trim();
}

export function isEqualFlexible(a: string, b: string) {
  return normalize(a) === normalize(b);
}

export function isFitSearch(keyword: string, str: string) {
  return normalize(str).includes(normalize(keyword));
}
