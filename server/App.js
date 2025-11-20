import express from "express";
import cookieParser from "cookie-parser";

import authRouter from "./src/routes/Auth.Route.js";
import userRoute from "./src/routes/User.Route.js";
import ErrorMiddleware from "./src/middlewares/Error.Middleware.js";
import RequestLogger from "./src/middlewares/LogReport.Middleware.js";

import { PORT } from "./src/configs/env.js";
import storyRoute from "./src/routes/Story.Routes.js";
import storyNodeRoute from "./src/routes/StoryNode.Route.js";
import authorRoute from "./src/routes/Author.Route.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(RequestLogger);

// Main routes
app.use("/auth", authRouter);
app.use("/users", userRoute);
app.use("/stories", storyRoute);
app.use("/story-nodes", storyNodeRoute);
app.use("/authors", authorRoute);

//api for getting story image
app.use("/uploads/story", express.static("uploads/story"));

// Middlewares
app.use(ErrorMiddleware);

// Listen
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
