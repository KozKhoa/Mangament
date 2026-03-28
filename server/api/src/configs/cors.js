const WHITE_LIST = ["http://localhost:3000", "https://mangament.netlify.app"];

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
