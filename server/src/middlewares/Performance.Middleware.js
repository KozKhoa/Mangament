export function MeasureRequestTime(req, res, next) {
  const start = process.hrtime.bigint();

  function mappingColorMethod(method) {
    switch (method) {
      case "GET":
        return "\x1b[32m"; // xanh lá
      case "POST":
        return "\x1b[33m"; // vàng
      case "DELETE":
        return "\x1b[31m"; // đỏ
      case "PUT":
        return "\x1b[34m"; // xanh nuớc
      case "PATCH":
        return "\x1b[36m"; // cyan
    }
  }

  function mappingTimeResponseColor(time) {
    let color = "\x1b[32m"; // xanh

    if (time > 300)
      color = "\x1b[31m"; // đỏ
    else if (time > 150) color = "\x1b[33m"; // vàng

    return color;
  }

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e6;

    console.log(
      `${mappingColorMethod(req.method)}${req.method} \x1b[39m${req.originalUrl} - ${mappingTimeResponseColor(duration)}${duration.toFixed(2)}ms\x1b[0m`,
    );
  });

  next();
}
