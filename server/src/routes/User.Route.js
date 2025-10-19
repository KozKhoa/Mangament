import express from "express";

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
  PostFavouriteStory,
  GetFavouriteStories,
  DeleteFavouriteStory,
  GetReadingHistories,
  PostReadingHistory,
  DeleteReadingHistory,
} from "../controllers/User.Controller.js";

const userRoute = express.Router();

// User
userRoute.get("/me", AuthenticationToken, GetUser); // Get user info
userRoute.get("/:id", AuthenticationToken, AuthorizationRole, GetUser); // Get user info
userRoute.get("/", AuthenticationToken, AuthorizationRole, GetAllUsers); // Get list of user information

userRoute.put("/me", AuthenticationToken, PutUser); // Update user info
userRoute.put("/:id", AuthenticationToken, AuthorizationRole, PutUser); // Update user info
userRoute.patch("/me/password", AuthenticationToken, PutUserPassword); // Change user password
userRoute.delete("/:id", AuthenticationToken, AuthorizationRole, DeleteUser); // Remove user

// Favourite story
userRoute.post("/me/favourites", AuthenticationToken, PostFavouriteStory);
userRoute.get("/me/favourites", AuthenticationToken, GetFavouriteStories);
userRoute.delete(
  "/me/favourites/:favouriteId",
  AuthenticationToken,
  DeleteFavouriteStory
);

// Reading history
userRoute.post("/me/histories", AuthenticationToken, PostReadingHistory);
userRoute.get("/me/histories", AuthenticationToken, GetReadingHistories);
userRoute.delete(
  "/me/histories/:historyId",
  AuthenticationToken,
  DeleteReadingHistory
);
export default userRoute;
