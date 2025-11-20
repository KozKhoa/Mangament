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
