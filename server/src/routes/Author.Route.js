import express from "express";
import multer from "multer";
import path from "path";

import {
  AuthenticationToken,
  AuthorizationRole,
} from "../middlewares/Auth.Middleware.js";

import {
  DeleteAuthor,
  GetAllAuthors,
  PostAuthor,
  PutAuthor,
} from "../controllers/Author.Controller.js";

const saveLocation = "uploads/image";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, saveLocation), // save location
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // file name
  },
});

const upload = multer({ storage: storage });

const authorRoute = express.Router();

authorRoute.get("/", GetAllAuthors);
authorRoute.post("/", AuthenticationToken, AuthorizationRole, PostAuthor);
authorRoute.put("/:id", AuthenticationToken, AuthorizationRole, PutAuthor);
authorRoute.delete(
  "/:id",
  AuthenticationToken,
  AuthorizationRole,
  DeleteAuthor
);

export default authorRoute;
