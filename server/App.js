import "./src/configs/env.js";

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { corsOptions } from "./src/configs/cors.js";
import { initRedis } from "./src/configs/redis.js";

import authRouter from "./src/routes/Auth.Route.js";
import userRoute from "./src/routes/User.Route.js";
import ErrorMiddleware from "./src/middlewares/Error.Middleware.js";
import RequestLogger from "./src/middlewares/LogReport.Middleware.js";
import * as PerformanceMiddleware from "./src/middlewares/Performance.Middleware.js";

import storyRoute from "./src/routes/Story.Routes.js";
import storyNodeRoute from "./src/routes/StoryNode.Route.js";
import authorRoute from "./src/routes/Author.Route.js";
import genreRoute from "./src/routes/Genre.Route.js";
import adminRoute from "./src/routes/Admin.Route.js";
import commentRoute from "./src/routes/Comment.Route.js";
import uploadRoute from "./src/routes/Upload.Route.js";

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import db from "./src/configs/db.js";

initRedis();

console.log("App is running with NODE ENV =", process.env.NODE_ENV);

const app = express();

// Generate OpenAPI spec from JSDoc comments in route files
const specs = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Mangament API", version: "1.0.0" },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      responses: {
        Unauthorized: {
          description: "Authentication information is missing or invalid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { message: { type: "string" } },
              },
            },
          },
        },
      },
      schemas: {
        Image: {
          type: "object",
          properties: {
            key: { type: "string" },
            url: { type: "string", format: "uri" },
            width: { type: "integer" },
            height: { type: "integer" },
          },
        },
        Nation: {
          type: "object",
          properties: {
            name: { type: "string" },
            flag_icon: { type: "string" },
            flag_image: { $ref: "#/components/schemas/Image" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            gender: { type: "string" },
            birthday: { type: "string", format: "date" },
            join_date: { type: "string", format: "date-time" },
            nation: { $ref: "#/components/schemas/Nation" },
            role: { type: "string", description: "user or admin" },
            is_banned: { type: "boolean" },
            avatar: { $ref: "#/components/schemas/Image" },
          },
        },
        Story: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            type: { type: "string" },
            status: { type: "string" },
            summary: { type: "string" },
            view: { type: "integer" },
            star: { type: "number" },
            is_actived: { type: "boolean" },
            cover_art: { $ref: "#/components/schemas/Image" },
            nation: { $ref: "#/components/schemas/Nation" },
            authors: { type: "array", items: { $ref: "#/components/schemas/Author" } },
            genres: { type: "array", items: { type: "string" } },
            favourite: { type: "object", properties: { id: { type: "string" } } },
            rating: { $ref: "#/components/schemas/Rating" },
            newest_chapter: { type: "array", items: { $ref: "#/components/schemas/StoryNode" } },
            children: { type: "array", items: { $ref: "#/components/schemas/StoryNode" } },
          },
        },
        StoryNode: {
          type: "object",
          properties: {
            id: { type: "string" },
            story_id: { type: "string" },
            parent_id: { type: "string" },
            title: { type: "string" },
            type: { type: "string" },
            order_index: { type: "number" },
            view: { type: "integer" },
            number_of_children: { type: "integer" },
            plain_text: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            poster_id: { type: "string" },
            content: { type: "array", items: { $ref: "#/components/schemas/StoryNodeContent" } },
            children: { type: "array", items: { $ref: "#/components/schemas/StoryNode" } },
          },
        },
        StoryNodeContent: {
          type: "object",
          properties: {
            id: { type: "string" },
            story_node_id: { type: "string" },
            type: { type: "string" },
            order_index: { type: "integer" },
            content: { type: "string" },
            image: { $ref: "#/components/schemas/Image" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Rating: {
          type: "object",
          properties: {
            id: { type: "string" },
            user_id: { type: "string" },
            story_id: { type: "string" },
            star: { type: "integer" },
            title: { type: "string" },
            content: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            id: { type: "string" },
            parent_id: { type: "string" },
            story_id: { type: "string" },
            story_node_id: { type: "string" },
            user_id: { type: "string" },
            title: { type: "string" },
            content: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        FavouriteStory: {
          type: "object",
          properties: {
            id: { type: "string" },
            user_id: { type: "string" },
            story_id: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        ReadingHistory: {
          type: "object",
          properties: {
            id: { type: "string" },
            user_id: { type: "string" },
            story_id: { type: "string" },
            story_node_id: { type: "string" },
            last_position: { type: "object" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        RefreshToken: {
          type: "object",
          properties: {
            user_id: { type: "string" },
            token: { type: "string" },
          },
        },
        Author: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            nation: { $ref: "#/components/schemas/Nation" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            pageSize: { type: "integer" },
            totalPages: { type: "integer" },
            totalItems: { type: "integer" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
});

app.get("/openapi.json", (req, res) => {
  res.json(specs);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

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
app.use("/uploads", uploadRoute);

// Let render ping after amount of time for preventing container to idle
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

// Middlewares
app.use(ErrorMiddleware);

// Keep db prisma alive after 3 min
setInterval(
  async () => {
    try {
      await db.$queryRaw`SELECT 1`;
      console.log("\x1b[32mDB keepalive successfully");
    } catch (err) {
      console.error("\x1b[31mDB keepalive error", err);
    }
  },
  1000 * 60 * 3,
);

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
