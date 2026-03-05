import express from "express";
import multer from "multer";
import path from "path";

import { AuthorizationRole, AuthenticationToken } from "../middlewares/Auth.Middleware.js";

import { GetUser, GetAllUsers, PutUser, PutUserPassword, DeleteUser, PatchUserAvatar } from "../controllers/User.Controller.js";

import { PostReadingHistory, GetAllReadingHistories, DeleteReadingHistory } from "../controllers/History.Controller.js";

import { PostFavouriteStory, GetAllFavouriteStories, DeleteFavouriteStory } from "../controllers/Favourite.Controller.js";

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
/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: User management
 *
 * /users/me:
 *   get:
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     summary: Get current user profile
 *     responses:
 *       '200':
 *         description: User profile
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags: [Users]
 *     summary: Update user by id
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Updated
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Users]
 *     summary: Delete user by id
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Deleted
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Users list
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /users/me/avatar:
 *   patch:
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     summary: Upload current user avatar
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Avatar updated
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
userRoute.get("/me", AuthenticationToken, GetUser); // Get user info
userRoute.get("/:id", AuthenticationToken, AuthorizationRole, GetUser); // Get user info
userRoute.get("/", AuthenticationToken, AuthorizationRole, GetAllUsers); // Get list of user information

userRoute.put("/me", AuthenticationToken, PutUser); // Update user info
userRoute.put("/:id", AuthenticationToken, AuthorizationRole, PutUser); // Update user info
userRoute.patch("/me/password", AuthenticationToken, PutUserPassword); // Change user password
userRoute.delete("/:id", AuthenticationToken, AuthorizationRole, DeleteUser); // Remove user
userRoute.patch("/me/avatar", AuthenticationToken, upload.single("image"), PatchUserAvatar);

// Favourite story
userRoute.post("/me/favourites", AuthenticationToken, PostFavouriteStory);
userRoute.get("/me/favourites", AuthenticationToken, GetAllFavouriteStories);
userRoute.delete("/me/favourites/:id", AuthenticationToken, DeleteFavouriteStory);

// Reading history
userRoute.post("/me/histories", AuthenticationToken, PostReadingHistory);
userRoute.get("/me/histories", AuthenticationToken, GetAllReadingHistories);
userRoute.delete("/me/histories/:historyId", AuthenticationToken, DeleteReadingHistory);
export default userRoute;
