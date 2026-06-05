# 📚 Mangament - Story Reading & Management Platform

Một nền tảng web full-stack để quản lý và đọc các loại truyện (Manga, Light Novel, Web Novel). Dự án bao gồm frontend Next.js, backend Express API, worker service, và ML-service để tạo embeddings cho hệ thống đề xuất truyện.

---

## 🚀 Tech Stack

### Frontend (Client)

- **Framework:** Next.js 15+ (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4, Framer Motion
- **Drag & Drop:** `@dnd-kit`
- **HTTP Client:** Axios
- **Testing:** Vitest
- **Other utilities:** `date-fns`, `sonner`, `lodash`

### Backend (Server - Express API)

- **Framework:** Node.js with Express 5.1
- **Language:** JavaScript/TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Caching & Queue:** Redis (ioredis)
- **Authentication:** JWT & bcrypt
- **File Upload:** Multer, Cloudinary, AWS S3
- **Testing:** Vitest
- **Documentation:** Swagger/OpenAPI

### ML Service

- **Purpose:** Tạo vector embeddings cho các truyện nhằm cải thiện hệ thống recommend
- **Functionality:** Phân tích nội dung truyện và tạo embeddings để tính similarity
- **Output:** Vector embeddings được lưu trong database

### Worker Service

- **Purpose:** Xử lý các tác vụ nền bất đồng bộ
- **Features:** Queue management, background jobs, scheduled tasks
- **Integration:** Kết nối với Redis queue

---

## 📖 Features Chính

- ✅ **Quản lý tài khoản:** Đăng ký, đăng nhập, phân quyền (Admin & User)
- ✅ **Hỗ trợ nhiều loại truyện:** Manga, Light Novels, Web Novels
- ✅ **Cấu trúc phân cấp:** Tổ chức nội dung theo Volumes, Arcs, Chapters
- ✅ **Lịch sử đọc & Yêu thích:** Theo dõi vị trí đọc gần nhất, quản lý truyện yêu thích
- ✅ **Đánh giá & Bình luận:** Người dùng có thể đánh giá và bình luận truyện
- ✅ **Dashboard Admin:** Quản lý truyện, tác giả, thể loại, quốc gia, người dùng
- ✅ **Quản lý tệp:** Upload ảnh an toàn qua Cloudinary/AWS S3
- ✅ **Hệ thống recommend:** Dùng embeddings từ ML-service để gợi ý truyện liên quan

---

## 📂 Project Structure

```
Mangament/
├── 📂 client/                    # Frontend Next.js application
│   ├── 📂 app/                   # Next.js App Router
│   │   ├── (auth)/              # Authentication routes (login, register)
│   │   ├── (user)/              # User routes (dashboard, library)
│   │   ├── admin/               # Admin dashboard routes
│   │   ├── api/                 # API routes
│   │   └── layout.tsx           # Root layout
│   ├── 📂 components/           # React components
│   │   ├── buttons/             # Button components
│   │   ├── cards/               # Card components (story, comment)
│   │   ├── chart/               # Chart components
│   │   ├── displays/            # Display components
│   │   ├── draggable/           # Draggable components
│   │   ├── filters/             # Filter components
│   │   ├── forms/               # Form components
│   │   ├── grids/               # Grid layouts
│   │   ├── inputs/              # Input components
│   │   ├── layouts/             # Layout components
│   │   ├── list/                # List components
│   │   ├── modal/               # Modal components
│   │   ├── search/              # Search components
│   │   ├── selections/          # Selection components
│   │   ├── table/               # Table components
│   │   └── tags/                # Tag components
│   ├── 📂 contexts/             # React contexts
│   │   ├── AdminContext.tsx     # Admin state management
│   │   ├── AppContext.tsx       # App-wide state
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── NextAuthProvider.tsx # NextAuth provider wrapper
│   ├── 📂 hoc/                  # Higher-Order Components
│   │   ├── withAdmin.tsx        # Admin protection HOC
│   │   └── withAuth.tsx         # Auth protection HOC
│   ├── 📂 hooks/                # Custom React hooks
│   │   ├── useInView.ts         # Intersection observer hook
│   │   ├── usePaperClip.ts      # File handling hook
│   │   └── useResize.ts         # Window resize hook
│   ├── 📂 lib/                  # Utility libraries
│   │   ├── axios.ts             # Axios config & interceptors
│   │   ├── remember-me.ts       # Remember login feature
│   │   ├── routes.ts            # Route definitions
│   │   ├── token.ts             # Token management
│   │   └── validation.ts        # Form validation rules
│   ├── 📂 public/               # Static assets
│   │   ├── arrows/              # Arrow icons
│   │   ├── auth/                # Auth-related icons
│   │   ├── genres/              # Genre icons
│   │   ├── theme/               # Theme assets
│   │   └── upload/              # Upload icons
│   ├── 📂 services/             # API service calls
│   │   ├── admin/               # Admin API services
│   │   ├── auth/                # Authentication services
│   │   ├── author/              # Author services
│   │   ├── comment/             # Comment services
│   │   ├── favourite/           # Favorite services
│   │   ├── genre/               # Genre services
│   │   ├── history/             # History services
│   │   ├── rating/              # Rating services
│   │   ├── story/               # Story services
│   │   ├── story-node/          # Story node services
│   │   └── user/                # User services
│   ├── 📂 types/                # TypeScript type definitions
│   │   ├── author.ts
│   │   ├── comment.ts
│   │   ├── favourite.ts
│   │   ├── filter.ts
│   │   ├── genre.ts
│   │   ├── history.ts
│   │   ├── story.ts
│   │   ├── user.ts
│   │   └── ...
│   ├── 📂 utils/                # Utility functions
│   │   ├── beautiful.ts         # UI/formatting utilities
│   │   ├── convert.ts           # Data conversion
│   │   ├── date.ts              # Date utilities
│   │   ├── error.ts             # Error handling
│   │   ├── math.ts              # Math utilities
│   │   ├── string.ts            # String utilities
│   │   └── ...
│   ├── 📂 __tests__/            # Unit tests
│   │   ├── button.test.tsx
│   │   ├── header.test.tsx
│   │   ├── story-card.test.tsx
│   │   └── filters/
│   ├── next.config.ts           # Next.js configuration
│   ├── tailwind.config.ts       # Tailwind CSS config
│   ├── tsconfig.json            # TypeScript config
│   ├── vitest.config.ts         # Vitest config
│   └── package.json
│
├── 📂 server/                   # Backend - Express API
│   ├── 📂 api/                  # Express API application
│   │   ├── 📂 src/
│   │   │   ├── 📂 controllers/  # Request handlers
│   │   │   ├── 📂 models/       # Data models
│   │   │   ├── 📂 routes/       # API routes
│   │   │   ├── 📂 services/     # Business logic
│   │   │   ├── 📂 middleware/   # Express middleware
│   │   │   └── 📂 utils/        # Helper functions
│   │   ├── 📂 prisma/           # Prisma schema & migrations
│   │   │   ├── schema.prisma    # Database schema
│   │   │   └── migrations/      # Migration files
│   │   ├── 📂 queues/           # Redis queue definitions
│   │   ├── 📂 logs/             # Log files
│   │   ├── 📂 uploads/          # Temporary file storage
│   │   ├── App.js               # Express app entry point
│   │   ├── docker-compose.yml   # Local development services
│   │   ├── package.json
│   │   └── vitest.config.ts
│   │
│   ├── 📂 ml-service/           # ML Service for embeddings
│   │   ├── 📂 models/           # ML models
│   │   ├── 📂 scripts/          # Processing scripts
│   │   ├── 📄 requirements.txt   # Python dependencies
│   │   └── 📄 main.py           # Entry point
│   │
│   ├── 📂 workers/              # Worker service
│   │   ├── 📂 jobs/             # Job definitions
│   │   ├── 📂 queues/           # Queue handlers
│   │   ├── WorkerApp.js         # Worker entry point
│   │   └── package.json
│   │
│   └── README.md
│
├── docker-compose.yml           # Root docker compose (all services)
├── Mangament.code-workspace     # VS Code workspace config
└── README.md
```

---

## 🏗️ Architecture Overview

### Client Layer (Next.js)

- **App Router:** Routing với file-based structure
- **Context API:** State management cho auth, app, admin
- **Services:** Gọi API thông qua axios interceptors
- **Components:** Reusable UI components theo atomic design

### API Layer (Express)

- **Controllers:** Xử lý HTTP requests
- **Services:** Business logic độc lập với database
- **Middleware:** Authentication, validation, error handling
- **Database:** PostgreSQL với Prisma ORM
- **Queue:** Redis cho async jobs

### ML Service

- **Functionality:** Tạo vector embeddings từ nội dung truyện
- **Integration:** Kết nối với API để lưu embeddings
- **Usage:** Dùng cho recommendation engine

### Worker Service

- **Purpose:** Xử lý background jobs
- **Queue Integration:** Lắng nghe Redis queue
- **Tasks:** Embedding generation, notification, cleanup

---

## 🔄 Data Flow

```
User (Browser)
    ↓
Next.js Frontend
    ↓
Axios (HTTP + JWT)
    ↓
Express API
    ├→ Prisma ORM
    ├→ PostgreSQL
    └→ Redis Queue
         ↓
    Worker Service
         ↓
    ML-Service (Embeddings)
         ↓
    Store in Database
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis
- Docker & Docker Compose (optional)

### Installation

#### 1. Clone repository

```bash
git clone https://github.com/KozKhoa/Mangament.git
cd Mangament
```

#### 2. Setup Frontend

```bash
cd client
npm install
npm run build && npm run start  # Or 'npm run dev' for development
```

#### 3. Setup Backend API

```bash
cd server/api
npm install
npm run build
npm run start  # Or 'npm run dev' for development
```

#### 4. Setup ML Service

```bash
cd server/ml-service
python3 -m venv .venv # Create .venv folder
source .venv/bin/activate # For linux
pip install -r requirements.txt
python main.py
```

#### 5. Setup Worker

```bash
cd server/api
npm install
npm run build
npm run worker
```

##### Migrate database

```bash
cd server/api
npx prisma migrate dev # If you fail, consider to swich DATABASE_URL to DIRECT_URL in prisma.config.ts file
```

##### Seed database

```bash
cd server/api
npm run seed
```

### Environment Variables

**Client (.env.local):**

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

**Server (.env):**

```
DATABASE_URL=postgresql://user:password@localhost:5432/mangament
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
CLOUDINARY_API_KEY=your_api_key
```

---

## 📦 Docker Deployment

### Quick Start with Docker Compose

The project includes a comprehensive `docker-compose.yml` at the root that orchestrates all services.

**Prerequisites:**

- Docker 20.10+
- Docker Compose 2.0+

**Setup:**

1. Copy environment files:

```bash
cp client/.env.example client/.env.local
cp server/api/.env.example server/api/.env
```

2. Update environment variables with your configuration

3. Build all services:

```bash
docker-compose build
```

4. Start all services:

```bash
docker compose up -d
```

**Access services:**

- Frontend: http://localhost:3000
- API: http://localhost:5000
- API Docs: http://localhost:5000/api/docs
- ML Service: http://localhost:8000
- Redis: localhost:6379
- MongoDB: localhost:27017

**View logs:**

```bash
docker-compose logs -f                # All services
docker-compose logs -f api            # Specific service
```

**Stop services:**

```bash
docker-compose down
```

### Services in Docker Compose

| Service        | Image              | Port  | Purpose            |
| -------------- | ------------------ | ----- | ------------------ |
| **postgres**   | postgres:16-alpine | 5432  | Primary database   |
| **redis**      | redis:7-alpine     | 6379  | Cache & queue      |
| **logs-db**    | mongo:8-alpine     | 27017 | Logs storage       |
| **ml-service** | custom             | 8000  | Story embeddings   |
| **api**        | custom             | 5000  | Express API server |
| **worker**     | custom             | -     | Background jobs    |
| **client**     | custom             | 3000  | Next.js frontend   |

### Detailed Docker Guide

For comprehensive Docker deployment guide, environment variables, troubleshooting, and production tips, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

---

## 🧪 Testing

### Frontend Tests

```bash
cd client
npm run test
```

### Backend Tests

```bash
cd server/api
npm run test
```

---

## 📚 API Documentation

API documentation available at:

```
http://localhost:3000/api/docs
```

Swagger/OpenAPI endpoints are automatically generated from Express routes.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 📞 Support

For issues and questions, please open an issue in the repository.

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
