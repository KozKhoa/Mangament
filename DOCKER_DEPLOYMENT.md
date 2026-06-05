# Docker Deployment Guide

## Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

## Project Structure
```
Mangament/
├── docker-compose.yml       # Main orchestration file
├── client/
│   └── Dockerfile          # Next.js client
├── server/
│   ├── api/
│   │   ├── Dockerfile      # Express API
│   │   └── workers/
│   │       └── Dockerfile  # Worker service
│   └── ml-service/
│       └── Dockerfile      # ML service
└── uploads/                # Shared volume for uploads
```

## Services Architecture

```
┌─────────────────────────────────────────────────────┐
│ Docker Network: mangament_network                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Client (Next.js)           API (Express)           │
│  :3000 ◄────────────────────► :5000                 │
│         ◄────────────────────────────┐              │
│                          ┌──────────────────┐       │
│                          │ PostgreSQL       │       │
│                          │ :5432           │       │
│                          └──────────────────┘       │
│                                 ▲                   │
│  Worker                         │                   │
│  (Background Jobs) ────────► Redis                  │
│                          │ :6379           │       │
│                          └──────────────────┘       │
│                                 ▲                   │
│  ML-Service            ┌──────────────────┐        │
│  :8000 ◄───────────────│ MongoDB Logs     │        │
│                        │ :27017           │        │
│                        └──────────────────┘        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Setup Environment Variables

**Copy template files:**
```bash
cp client/.env.example client/.env.local
cp server/api/.env.example server/api/.env
```

**Update with your actual values:**
- Database credentials
- JWT secret
- API keys (Cloudinary, AWS, Google, etc.)
- ML Service URL
- Email configuration

### 2. Build and Run

**Start all services:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f
```

**View specific service logs:**
```bash
docker-compose logs -f client
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f ml-service
```

### 3. Verify Services

- **Frontend:** http://localhost:3000
- **API:** http://localhost:5000 or http://localhost:5000/api/docs (Swagger)
- **ML Service:** http://localhost:8000
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379
- **MongoDB:** localhost:27017

### 4. Initialize Database

**Run Prisma migrations:**
```bash
docker-compose exec api npx prisma migrate deploy
```

**Seed database:**
```bash
docker-compose exec api npm run seed
```

## Management Commands

### Stop all services
```bash
docker-compose down
```

### Remove volumes (WARNING: Deletes all data)
```bash
docker-compose down -v
```

### Rebuild images
```bash
docker-compose build --no-cache
```

### Restart a specific service
```bash
docker-compose restart api
```

### Execute command in container
```bash
docker-compose exec api npm run dev
docker-compose exec client npm run dev
docker-compose exec postgres psql -U postgres -d mangament
```

### View service health
```bash
docker-compose ps
```

## Environment Variables

### Client (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_name
```

### Server (.env)
```
DATABASE_URL=postgresql://postgres:password@postgres:5432/mangament
REDIS_URL=redis://redis:6379
JWT_SECRET=your_secret
MONGODB_CONNECTION_STRING=mongodb://admin:password@logs-db:27017/management_logs?authSource=admin
ML_SERVICE_URL=http://ml-service:8000
```

## Troubleshooting

### Connection refused errors
- Check if services are running: `docker-compose ps`
- Check logs: `docker-compose logs -f [service-name]`
- Ensure all services have started before using them

### Database migration errors
```bash
docker-compose exec api npx prisma migrate reset
```

### Port conflicts
- Modify port mappings in `docker-compose.yml`
- Format: `"<host-port>:<container-port>"`

### Out of memory
```bash
docker system prune
docker volume prune
```

### Redis connection errors
- Check Redis is running: `docker-compose exec redis redis-cli ping`
- Should return: `PONG`

### PostgreSQL issues
```bash
# Check database
docker-compose exec postgres psql -U postgres -d mangament

# List tables
\dt

# Exit
\q
```

## Production Deployment

### Before deploying:
1. Set `NODE_ENV=production` in `.env`
2. Use strong `JWT_SECRET` (min 32 characters)
3. Configure real database credentials
4. Set up proper SSL/TLS certificates
5. Use environment-specific `.env` files
6. Configure logging and monitoring

### Production considerations:
- Use Docker secrets for sensitive data
- Set resource limits in docker-compose
- Use health checks (already configured)
- Set up automated backups for PostgreSQL
- Monitor Redis memory usage
- Use CDN for static assets
- Set up reverse proxy (Nginx/Traefik)

## Scaling

### For high traffic:
```yaml
api:
  deploy:
    replicas: 3
  
worker:
  deploy:
    replicas: 2
```

### Load balancing:
Use Nginx or Traefik as reverse proxy in front of services.

## Monitoring

### Check resource usage:
```bash
docker stats
```

### View container logs:
```bash
docker logs -f mangament_api
```

### Execute monitoring commands:
```bash
# CPU/Memory stats
docker-compose exec api node -e "console.log(process.memoryUsage())"

# Redis status
docker-compose exec redis redis-cli info
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [Node.js Best Practices](https://nodejs.org/en/docs)
