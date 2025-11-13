export function beautifulView(view: number) {
  let strView = "";
  while (view > 0) {
    strView = +(view % 1000).toString() + strView;
    if (view >= 1000) {
      strView = "." + strView;
    }
    view = Math.trunc(view / 10000);
  }
  return strView;
}
