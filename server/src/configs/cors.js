const WHITE_LIST = ["http://localhost:3000"];

export const corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    if (WHITE_LIST.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error(`${origin} is not allowed by CORS`));
    }
  },

  optionsSuccessStatus: 200,

  credentials: true,
};
