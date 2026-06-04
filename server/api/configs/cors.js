const WHITE_LIST = process.env.CORS_WHITE_LIST.split(",").map((url) => url.trim());


if (!WHITE_LIST.length) {
  console.warn(
    "CORS_WHITE_LIST is empty. Please set it in the .env file to allow specific origins."
  );
}

export const corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // Allow server-to-server request
    if (!origin) {
      return callback(null, true);
    }

    if (WHITE_LIST.includes(origin)) {
      return callback(null, true);
    }

    // ✅ allow *.trycloudflare.com
    if (/^https:\/\/.*\.trycloudflare\.com$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`${origin} is not allowed by CORS`));
  },
  credentials: true,

  optionsSuccessStatus: 200,
};
