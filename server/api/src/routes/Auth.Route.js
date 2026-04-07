import express from "express";

import { ForgotPassword, Login, Logout, Refresh, Register, ResetPassword, ChangePassword } from "../controllers/Auth.Controller.js";

import { GetUser } from "../controllers/User.Controller.js";

import { AuthenticationToken, AuthorizationRole } from "../middlewares/Auth.Middleware.js";

const authRouter = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication
 *
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user and return tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             example:
 *               name: "Jane Doe"
 *               email: "jane@example.com"
 *               password: "S3cureP@ssw0rd"
 *     responses:
 *       '200':
 *         description: Register success (returns access token and user)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               message: "Register success"
 *               data:
 *                 accessToken: "<jwt>"
 *                 user:
 *                   id: "user_1"
 *                   name: "Jane Doe"
 *                   email: "jane@example.com"
 *       '400':
 *         description: Validation error
 *       '409':
 *         description: Email already exists
 *
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive access token (refresh token set as httpOnly cookie)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             example:
 *               email: "jane@example.com"
 *               password: "S3cureP@ssw0rd"
 *     responses:
 *       '200':
 *         description: Login success (returns access token & user)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         avatar:
 *                           $ref: '#/components/schemas/Image'
 *             example:
 *               success: true
 *               message: "Login success"
 *               data:
 *                 accessToken: "<jwt>"
 *                 user:
 *                   id: "user_1"
 *                   name: "Jane Doe"
 *                   email: "jane@example.com"
 *                   role: "user"
 *       '401':
 *         description: Invalid credentials
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     summary: Logout current user (clears refresh token cookie)
 *     responses:
 *       '200':
 *         description: Logout result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               success: true
 *               message: "Logout success"
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange refresh token (from httpOnly cookie) for a new access token
 *     responses:
 *       '200':
 *         description: New access token and user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *             example:
 *               success: true
 *               message: "Get new access token success"
 *               data:
 *                 token: "<jwt>"
 *                 user:
 *                   id: "user_1"
 *                   name: "Jane Doe"
 *                   email: "jane@example.com"
 *                   role: "user"
 *       '401':
 *         description: Invalid or expired refresh token
 *
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     summary: Get current authenticated user
 *     responses:
 *       '200':
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               data:
 *                 id: "user_1"
 *                 name: "Jane Doe"
 *                 email: "jane@example.com"
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Send OTP to user's email for password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             example:
 *               email: "jane@example.com"
 *     responses:
 *       '200':
 *         description: OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               success: true
 *               message: "OTP has been sent to your email"
 *
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *             example:
 *               email: "jane@example.com"
 *               otp: "123456"
 *     responses:
 *       '200':
 *         description: Password reset success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               success: true
 *               message: "New password has been sent to your email"
 */

authRouter.post("/register", Register);
authRouter.post("/login", Login);
authRouter.post("/logout", Logout);
authRouter.post("/refresh", Refresh);
authRouter.get("/me", AuthenticationToken, GetUser);
authRouter.post("/forgot-password", ForgotPassword);
authRouter.post("/reset-password", ResetPassword);
authRouter.post("/change-password", AuthenticationToken, ChangePassword);

export default authRouter;
