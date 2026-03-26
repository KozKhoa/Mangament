import express from "express";

import { AuthenticationToken, AuthorizationRole } from "../middlewares/Auth.Middleware.js";

import * as adminController from "../controllers/Admin.Controller.js";

const adminRoute = express.Router();

adminRoute.use(AuthenticationToken);
adminRoute.use(AuthorizationRole);

/**
 * @openapi
 * tags:
 *   - name: Admin
 *     description: Admin operations
 */

//
//
//
// Dashboard
//
//
//

/**
 * @openapi
 * /admin/dashboard/overview:
 *   get:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Dashboard overview
 *     responses:
 *       '200':
 *         description: Overview data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                      type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                      totalStories:
 *                         type: integer
 *                      totalStoriesBaseOnStatus:
 *                          type: object
 *                          properties:
 *                              postpone:
 *                                  type: integer
 *                              upcoming:
 *                                  type: integer
 *                              finished:
 *                                  type: integer
 *                              ongoing:
 *                                  type: integer
 *                      totalUsers:
 *                          type: integer
 *                      totalUserBaseOnRole:
 *                          type: object
 *                          properties:
 *                              admin:
 *                                  type: integer
 *                              user:
 *                                  type: integer
 *                      totalBannedUsers:
 *                         type: integer
 *                      totalView:
 *                         type: integer
 *                      totalRating:
 *                         type: integer
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.get("/dashboard/overview", adminController.GetDashboardOverview);

/**
 * @openapi
 * /admin/dashboard/stats/views:
 *   get:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Get view statistics in a date range
 *     parameters:
 *       - name: fromDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: toDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: groupBy
 *         in: query
 *         description: Group by period (day|week|month)
 *         schema:
 *           type: string
 *       - name: storyId
 *         in: query
 *         schema:
 *           type: string
 *       - name: storyNodeId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: View statistics array (date grouped)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       count:
 *                         type: integer
 *             example:
 *               success: true
 *               data:
 *                 - date: "2026-01-09T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-10T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-11T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-12T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-13T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-14T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-15T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-16T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-17T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-18T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-19T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-20T00:00:00.000Z"
 *                   view: 0
 *                 - date: "2026-01-21T00:00:00.000Z"
 *                   view: 0
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.get("/dashboard/stats/views", adminController.GetDashboardViewInRange);

/**
 * @openapi
 * /admin/dashboard/stats/new-users:
 *   get:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Get new users count grouped by period
 *     parameters:
 *       - name: fromDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: toDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: groupBy
 *         in: query
 *         description: Group by period (day|week|month)
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: New users statistics array (date grouped)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       count:
 *                         type: integer
 *             example:
 *               success: true
 *               data:
 *                 - date: "2026-01-09T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-10T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-11T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-12T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-13T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-14T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-15T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-16T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-17T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-18T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-19T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-20T00:00:00.000Z"
 *                   count: 0
 *                 - date: "2026-01-21T00:00:00.000Z"
 *                   count: 0
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.get("/dashboard/stats/new-users", adminController.GetDashboardNewUsers);

//
//
//
// Stories
//
//
//

/**
 * @openapi
 * /admin/stories:
 *   get:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: List stories with filters
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: keyword
 *         in: query
 *         schema:
 *           type: string
 *       - name: authors
 *         in: query
 *         schema:
 *           type: string
 *       - name: genres
 *         in: query
 *         schema:
 *           type: string
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: List of stories with pagination
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Story'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.get("/stories", adminController.GetAllStories);

/**
 * @openapi
 * /admin/stories/trash:
 *   get:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: List stories with filters
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: keyword
 *         in: query
 *         schema:
 *           type: string
 *       - name: authors
 *         in: query
 *         schema:
 *           type: string
 *       - name: genres
 *         in: query
 *         schema:
 *           type: string
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: List of stories with pagination
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Story'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.get("/stories/trash", adminController.GetAllTrashStories);

/**
 * @openapi
 * /admin/stories/{id}:
 *   get:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Get story by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: isGettingChildren
 *         in: query
 *         schema:
 *           type: boolean
 *       - name: isGettingContent
 *         in: query
 *         schema:
 *           type: boolean
 *     responses:
 *       '200':
 *         description: Story detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Story'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.get("/stories/:id", adminController.GetStory);

/**
 * @openapi
 * /admin/stories:
 *   post:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Create story
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *               nation:
 *                 type: string
 *               summary:
 *                 type: string
 *               status:
 *                 type: string
 *               genre:
 *                 type: array
 *               authorIds:
 *                 type: array
 *               coverArt:
 *                 type: object
 *                 properties:
 *                   url:
 *                      type: string
 *                   key:
 *                      type: string
 *
 *     responses:
 *       '200':
 *         description: Created story
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Story'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 */
adminRoute.post("/stories", adminController.PostNewStory);

/**
 * @openapi
 * /admin/stories/{id}:
 *   put:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Update story (multipart/form-data, optional coverArt)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *               nation:
 *                 type: string
 *               summary:
 *                 type: string
 *               status:
 *                 type: string
 *               genre:
 *                 type: string
 *               authorIds:
 *                 type: string
 *               children:
 *                 type: string
 *               coverArt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Updated story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.put("/stories/:id", adminController.UpdateStory);

/**
 * @openapi
 * /admin/stories/{id}/active:
 *   patch:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Toggle active flag for story
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActived:
 *                 type: boolean
 *           example:
 *             isActived: true
 *     responses:
 *       '200':
 *         description: Toggle result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 */
adminRoute.patch("/stories/:id/active", adminController.ToggleActiveStory);

/**
 * @openapi
 * /admin/stories:
 *   delete:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: This is used to permanently remove stories that soft-removed
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *     responses:
 *       '200':
 *         description: List of stories with pagination
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
// This is used to permanently remove many stories
adminRoute.delete("/stories/trash", adminController.DeleteManyTrashStories);

/**
 * @openapi
 * /admin/stories/{id}:
 *   delete:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Soft Delete story
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Deletion result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
// This is used for soft removing story
adminRoute.delete("/stories/:id", adminController.DeleteStory);

/**
 * @openapi
 * /admin/stories/trash/{id}:
 *   delete:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Hard Delete story (Remove Permanently)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Deletion result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
// This is used to permanently remove story
adminRoute.delete("/stories/trash/:id", adminController.DeleteTrashStory);

/**
 * @openapi
 * /admin/stories/trash/restore:
 *   patch:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: This is used to restore stories soft-removed
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *     responses:
 *       '200':
 *         description: List of stories with pagination
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
// This is used to restore stories soft-removed
adminRoute.patch("/stories/trash/restore", adminController.RestoreManyTrashStories);

/**
 * @openapi
 * /admin/stories/trash/{id}/restore:
 *   patch:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Restore soft-delelted story with id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Deletion result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
// This is used to restored story soft-removed
adminRoute.patch("/stories/trash/:id/restore", adminController.RestoreTrashStory);

//
//
//
// User
//
//
//

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Get list of users with filters and pagination
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number (>=1)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Page size
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: search
 *         in: query
 *         description: Full-text search on name/email
 *         schema:
 *           type: string
 *       - name: genders
 *         in: query
 *         description: Comma-separated genders to filter (e.g. male,female)
 *         schema:
 *           type: string
 *       - name: roles
 *         in: query
 *         description: Comma-separated roles to filter (e.g. admin,user)
 *         schema:
 *           type: string
 *       - name: fromDate
 *         in: query
 *         description: ISO date-time for range start (inclusive)
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: toDate
 *         in: query
 *         description: ISO date-time for range end (inclusive)
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: isBanned
 *         in: query
 *         description: Filter by banned status
 *         schema:
 *           type: boolean
 *       - name: sort
 *         in: query
 *         description: Sort string in the format field:direction (e.g. join_date:desc)
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: List of users with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: strings
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *             example:
 *               success: true
 *               message: "Get users successfully"
 *               data:
 *                 - id: "user_1"
 *                   name: "Jane Doe"
 *                   email: "jane@example.com"
 *                   gender: "female"
 *                   birthday: "1990-05-01"
 *                   join_date: "2026-03-01T12:34:56Z"
 *                   role: "user"
 *                   is_banned: false
 *                   avatar:
 *                     url: "https://cdn.example.com/avatars/jane.jpg"
 *                     width: 200
 *                     height: 200
 *               pagination:
 *                 page: 1
 *                 pageSize: 1
 *                 totalPages: 10
 *                 totalItems: 10
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.get("/users", adminController.GetAllUsers);

/**
 * @openapi
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Get user by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: User information
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
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               message: "Get user information successfully"
 *               data:
 *                 id: "user_1"
 *                 name: "Jane Doe"
 *                 email: "jane@example.com"
 *                 gender: "female"
 *                 birthday: "1990-05-01"
 *                 join_date: "2026-03-01T12:34:56Z"
 *                 role: "user"
 *                 is_banned: false
 *                 avatar:
 *                   url: "https://cdn.example.com/avatars/jane.jpg"
 *                   width: 200
 *                   height: 200
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.get("/users/:id", adminController.GetUser);

/**
 * @openapi
 * /admin/users/{id}:
 *   put:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Update user information (name, role)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *           example:
 *             name: "Jane Updated"
 *             role: "admin"
 *     responses:
 *       '200':
 *         description: Updated user
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
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               message: "Update user successfully"
 *               data:
 *                 id: "user_1"
 *                 name: "Jane Updated"
 *                 email: "jane@example.com"
 *                 role: "admin"
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.put("/users/:id", adminController.UpdateUserInfo);

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Soft delete a user
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Deletion result
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
 *               message: "Delete user user_1"
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.delete("/users/:id", adminController.DeleteUser);

/**
 * @openapi
 * /admin/users/{id}/ban:
 *   patch:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Ban or unban a user
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isBanned:
 *                 type: boolean
 *           example:
 *             isBanned: true
 *     responses:
 *       '200':
 *         description: Ban operation result
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
 *               message: "Banned user_1"
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.patch("/users/:id/ban", adminController.BanUser);

//
//
//
// Images
//
//
//

/**
 * @openapi
 * /admin/images/trash:
 *   get:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: List trashed images with pagination
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       '200':
 *         description: List of trashed images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Image'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.get("/images/trash", adminController.GetAllTrashImages);

/**
 * @openapi
 * /admin/images/trash/{id}:
 *   delete:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a trashed image permanently
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Image deleted successfully
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
 *               message: "Delete image image_1"
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.delete("/images/trash/:id", adminController.DeleteTrashImage);

/**
 * @openapi
 * /admin/images/trash:
 *   delete:
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     summary: Delete multiple trashed images permanently
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image IDs to delete
 *             required:
 *               - ids
 *           example:
 *             ids: ["image_1", "image_2", "image_3"]
 *     responses:
 *       '200':
 *         description: Images deleted successfully
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
 *               message: "Delete images successfully"
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
adminRoute.delete("/images/trash", adminController.DeleteManyTrashImages);

export default adminRoute;
