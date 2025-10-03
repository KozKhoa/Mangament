import express from "express";
import cookieParser from "cookie-parser";

import authRouter from "./src/routes/Auth.Route.js";
import userRoute from "./src/routes/User.Route.js";
import ErrorMiddleware from "./src/middlewares/Error.Middleware.js";

import { PORT } from "./src/configs/env.js";
import storyRoute from "./src/routes/Story.Routes.js";

const app = express();

app.use(cookieParser());
app.use(express.json());

// Main routes
app.use("/auth", authRouter);
app.use("/user", userRoute);
app.use("/story", storyRoute);

// Middlewares
app.use(ErrorMiddleware);

// Listen
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
