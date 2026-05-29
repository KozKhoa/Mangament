import express from "express";

import { AuthenticationToken } from "../middlewares/Auth.Middleware.js";

import * as userController from "../controllers/User.Controller.js";
import { ValidateData } from "../middlewares/Validate.Middleware.js";
import userSchemas from "../schemas/user.schemas.js";

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
userRoute.get("/me", AuthenticationToken, ValidateData(userSchemas.getUser), userController.GetUser); // Get user info

userRoute.put("/me", AuthenticationToken, ValidateData(userSchemas.updateProfile), userController.UpdateUserInfo); // Update user info

export default userRoute;
