# Management - Story Reading Platform

A full-stack web application for managing and reading stories (Manga, Light Novel, Web Novel, Anime).

## 🚀 Tech Stack

### Frontend (Client)

- **Framework:** Next.js 15+ (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4, Framer Motion
- **Drag & Drop:** `@dnd-kit`
- **Other utilities:** `axios`, `date-fns`, `sonner`, `lodash`

### Backend (Server)

- **Framework:** Node.js with Express 5.1
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Caching & Queue:** Redis (ioredis)
- **Authentication:** JWT & bcrypt
- **File Upload:** Multer, Cloudinary, AWS S3
- **Documentation:** Swagger/OpenAPI

## 📖 Features

- **User Accounts:** Registration, Login, and role-based access control (Admin & User).
- **Story Parsing:** Support for Manga, Light Novels, Web Novels, and Anime.
- **Hierarchical Content:** Organize content into Volumes, Arcs, and Chapters.
- **Reading History & Favorites:** Track user's last read position and manage favorite stories.
- **Rating & Comments:** Users can leave ratings and comments on stories and chapters.
- **Admin Dashboard:** Manage stories, authors, genres, nations, and users.
- **File Management:** Image uploads stored securely via Cloudinary/AWS S3.

## 📂 Project Structure

```bash
📦 Management
 ┣ 📂 client      # Next.js frontend application
 ┃ ┣ 📂 app       # App Router (auth, admin, user routes)
 ┃ ┣ 📂 public    # Static assets
 ┃ ┗ 📜 package.json
 ┣ 📂 server      # Node.js/Express backend API
 ┃ ┣ 📂 prisma    # Database schema and migrations
 ┃ ┣ 📂 src       # API Controllers, Models, Routes, Services
 ┃ ┣ 📜 App.js    # Entry point
 ┃ ┗ 📜 package.json
 ┗ 📜 README.md
```

## ⚙️ Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- PostgreSQL
- Redis Server
- Cloudinary / AWS S3 account (for images)

### Environment Variables

Configure `.env` files in both `/client` and `/server`. See `.env.example` in respective directories.

### Running Backend

```bash
cd server
npm install
npx prisma generate
npx prisma db push # or npx prisma migrate dev
npm run dev
```

### Running Frontend

```bash
cd client
npm install
npm run dev
```

The client will typically run on `http://localhost:3000` and the server on `http://localhost:5000` (check your port configs).

## 📄 License

ISC License
