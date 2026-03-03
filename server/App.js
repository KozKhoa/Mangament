import "./src/configs/env.js";

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { corsOptions } from "./src/configs/cors.js";

import authRouter from "./src/routes/Auth.Route.js";
import userRoute from "./src/routes/User.Route.js";
import ErrorMiddleware from "./src/middlewares/Error.Middleware.js";
import RequestLogger from "./src/middlewares/LogReport.Middleware.js";
import * as PerformanceMiddleware from "./src/middlewares/Performance.Middleware.js";

import storyRoute from "./src/routes/Story.Routes.js";
import storyNodeRoute from "./src/routes/StoryNode.Route.js";
import authorRoute from "./src/routes/Author.Route.js";
import genreRoute from "./src/routes/Genre.Route.js";
import { initRedis } from "./src/configs/redis.js";
import adminRoute from "./src/routes/Admin.Route.js";
import commentRoute from "./src/routes/Comment.Route.js";
import cloudinaryRoute from "./src/routes/Cloudinary.Route.js";
import uploadMulter from "./src/configs/multer.js";
import uploadRoute from "./src/routes/Upload.Route.js";

initRedis();

console.log("App is running with NODE ENV =", process.env.NODE_ENV);

const app = express();

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(RequestLogger);

// Dùng để đo thời gian thực hiện request
app.use(PerformanceMiddleware.MeasureRequestTime);

// Main routes
app.use("/auth", authRouter);
app.use("/users", userRoute);
app.use("/stories", storyRoute);
app.use("/story-nodes", storyNodeRoute);
app.use("/authors", authorRoute);
app.use("/genres", genreRoute);
app.use("/comments", commentRoute);
app.use("/admin", adminRoute);
app.use("/cloudinary", cloudinaryRoute);
app.use("/uploads", uploadRoute);

app.use(express.static("./../uploads"));

// Middlewares
app.use(ErrorMiddleware);

if (process.env.NODE_ENV === "development") {
  // Listen
  app.listen(process.env.LOCAL_PORT, "0.0.0.0", () => {
    console.log(`🚀 Server chạy tại http://localhost:${process.env.LOCAL_PORT}`);
  });
} else if (process.env.NODE_ENV === "production") {
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server chạy tại :${process.env.PORT}`);
  });
}
