import express from "express";
import multer from "multer";
import path from "path";

import { AuthenticationToken, AuthorizationRole } from "../middlewares/Auth.Middleware.js";

import { DeleteAuthor, GetAllAuthors, PostAuthor, PutAuthor } from "../controllers/Author.Controller.js";

const authorRoute = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Authors
 *     description: Authors management
 *
 * /authors:
 *   get:
 *     tags: [Authors]
 *     summary: List authors with optional pagination
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
 *     responses:
 *       '200':
 *         description: List of authors with pagination
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
 *                     $ref: '#/components/schemas/Author'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             example:
 *               success: true
 *               message: "Get authors successfully"
 *               data:
 *                 - id: "author_1"
 *                   name: "John Author"
 *                   nation:
 *                     id: "nation_1"
 *                     name: "Country"
 *                   storyCount: 12
 *               pagination:
 *                 page: 1
 *                 pageSize: 10
 *                 totalPages: 2
 *                 totalItems: 12
 *   post:
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new author (avatar optional)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *             required: [name]
 *     responses:
 *       '200':
 *         description: Created author
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
 *                   $ref: '#/components/schemas/Author'
 *             example:
 *               success: true
 *               message: "Create author successfully"
 *               data:
 *                 id: "author_1"
 *                 name: "John Author"
 *                 nation: null
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /authors/{id}:
 *   put:
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     summary: Update author (name or avatar)
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
 *               avatar:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Updated author
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
 *                   $ref: '#/components/schemas/Author'
 *             example:
 *               success: true
 *               message: "Update author successfully"
 *               data:
 *                 id: "author_1"
 *                 name: "John Updated"
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     summary: Delete author
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Deleted
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
 *               message: "Delete author author_1"
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */

authorRoute.get("/", GetAllAuthors);
authorRoute.post("/", AuthenticationToken, AuthorizationRole, PostAuthor);
authorRoute.put("/:id", AuthenticationToken, AuthorizationRole, PutAuthor);
authorRoute.delete("/:id", AuthenticationToken, AuthorizationRole, DeleteAuthor);

export default authorRoute;
