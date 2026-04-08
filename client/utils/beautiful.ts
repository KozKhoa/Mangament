export function beautifulView(view: number): string {
  if (view < 1000) return view.toString();

  let strView = "";

  const viewString = view.toString();
  let j = 0;
  for (let i = viewString.length - 1; i >= 0; i--) {
    strView = viewString[i] + strView;
    if ((j + 1) % 3 == 0 && i !== 0) strView = "." + strView;
    j++;
  }

  console.log(view, strView);

  return strView;
}
