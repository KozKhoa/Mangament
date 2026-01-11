import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { corsOptions } from "./src/configs/cors.js";

import authRouter from "./src/routes/Auth.Route.js";
import userRoute from "./src/routes/User.Route.js";
import ErrorMiddleware from "./src/middlewares/Error.Middleware.js";
import RequestLogger from "./src/middlewares/LogReport.Middleware.js";

import storyRoute from "./src/routes/Story.Routes.js";
import storyNodeRoute from "./src/routes/StoryNode.Route.js";
import authorRoute from "./src/routes/Author.Route.js";
import genreRoute from "./src/routes/Genre.Route.js";

console.log("App is running with NODE ENV =", process.env.NODE_ENV);

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(RequestLogger);

app.use(cors(corsOptions));

// Main routes
app.use("/auth", authRouter);
app.use("/users", userRoute);
app.use("/stories", storyRoute);
app.use("/story-nodes", storyNodeRoute);
app.use("/authors", authorRoute);
app.use("/genres", genreRoute);

//api for getting story image
app.use("/uploads", express.static("./../uploads"));

// Middlewares
app.use(ErrorMiddleware);

// Listen
app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`🚀 Server chạy tại http://localhost:${process.env.PORT}`);
});
