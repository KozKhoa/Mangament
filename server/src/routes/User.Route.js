import express from "express";
import multer from "multer";
import path from "path";

import {
  AuthorizationRole,
  AuthenticationToken,
} from "../middlewares/Auth.Middleware.js";

import {
  GetUser,
  GetAllUsers,
  PutUser,
  PutUserPassword,
  DeleteUser,
  PatchUserAvatar,
} from "../controllers/User.Controller.js";

import {
  PostReadingHistory,
  GetAllReadingHistories,
  DeleteReadingHistory,
} from "../controllers/History.Controller.js";

import {
  PostFavouriteStory,
  GetAllFavouriteStories,
  DeleteFavouriteStory,
} from "../controllers/Favourite.Controller.js";

const saveLocation = "uploads/image";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, saveLocation), // save location
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // file name
  },
});

const upload = multer({ storage: storage });

const userRoute = express.Router();

// User
userRoute.get("/me", AuthenticationToken, GetUser); // Get user info
userRoute.get("/:id", AuthenticationToken, AuthorizationRole, GetUser); // Get user info
userRoute.get("/", AuthenticationToken, AuthorizationRole, GetAllUsers); // Get list of user information

userRoute.put("/me", AuthenticationToken, PutUser); // Update user info
userRoute.put("/:id", AuthenticationToken, AuthorizationRole, PutUser); // Update user info
userRoute.patch("/me/password", AuthenticationToken, PutUserPassword); // Change user password
userRoute.delete("/:id", AuthenticationToken, AuthorizationRole, DeleteUser); // Remove user
userRoute.patch(
  "/me/avatar",
  AuthenticationToken,
  upload.single("image"),
  PatchUserAvatar
);

// Favourite story
userRoute.post("/me/favourites", AuthenticationToken, PostFavouriteStory);
userRoute.get("/me/favourites", AuthenticationToken, GetAllFavouriteStories);
userRoute.delete(
  "/me/favourites/:favouriteId",
  AuthenticationToken,
  DeleteFavouriteStory
);

// Reading history
userRoute.post("/me/histories", AuthenticationToken, PostReadingHistory);
userRoute.get("/me/histories", AuthenticationToken, GetAllReadingHistories);
userRoute.delete(
  "/me/histories/:historyId",
  AuthenticationToken,
  DeleteReadingHistory
);
export default userRoute;
