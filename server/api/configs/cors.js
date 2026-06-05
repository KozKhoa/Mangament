const WHITE_LIST = process.env.CORS_WHITE_LIST.split(",").map((url) => url.trim());

if (!WHITE_LIST.length) {
  console.warn("CORS_WHITE_LIST is empty. Please set it in the .env file to allow specific origins.");
}

const isHttps = (origin) => /^https:\/\//.test(origin);

export const corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // Bị chặn nếu không có origin nào được cấu hình
    if (!WHITE_LIST.length) {
      return callback(new Error("CORS Error: No allowed origins configured! Please config CORS_WHITE_LIST before deploying."));
    }

    // Allow server-to-server request
    if (!origin) {
      return callback(null, true);
    }

    if (!isHttps(origin)) {
      return callback(new Error("CORS Error: Only allow HTTPS!")); // Bị chặn
    }

    if (WHITE_LIST.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`${origin} is not allowed by CORS`));
  },
  credentials: true,

  optionsSuccessStatus: 200,
};
