export function syntaxHighlight(json) {
  json = JSON.stringify(json, null, 2);
  json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|\b\d+\b)/g, function (match) {
    let color = "#333";
    if (/^"/.test(match)) {
      color = /:$/.test(match) ? "#d73a49" : "#032f62"; // key vs string
    } else if (/true|false/.test(match)) {
      color = "#005cc5";
    } else if (/null/.test(match)) {
      color = "#6a737d";
    } else {
      color = "#005cc5"; // number
    }
    return `<span style="color:${color}">${match}</span>`;
  });
}
