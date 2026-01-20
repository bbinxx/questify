# Deployment Guide

This guide explains how to deploy Questify to production using a hosted PostgreSQL database (Prisma) and Redis.

## 1. Prerequisites
- **PostgreSQL Database**: You need a hosted Postgres database (e.g., Supabase, Neon, Railway, AWS RDS).
- **Redis Instance**: You need a hosted Redis instance (e.g., Upstash, Redis Cloud, Railway).
- **Node.js**: The server where you deploy the app.

## 2. Environment Variables
Update your production environment variables (or `.env` on the server):

```env
# Production Database URL (Postgres)
# Example: postgres://user:password@host:port/database
DATABASE_URL="your_postgres_connection_string"

# Production Redis URL
# Example: redis://default:password@host:port
REDIS_URL="your_redis_connection_string"

# Next.js Secret (for sessions/auth if needed later)
NEXTAUTH_SECRET="your_secret_key"
```

## 3. Database Migration (Prisma)
Since development uses SQLite and production uses PostgreSQL, we use a separate schema file for production.

1. **Delete existing migrations** (if any) or start fresh.
2. **Generate Client** using the production schema:
   ```bash
   npx prisma generate --schema=prisma/prod.schema.prisma
   ```
3. **Push Schema** to your hosted DB:
   ```bash
   npx prisma db push --schema=prisma/prod.schema.prisma
   ```

## 4. Build and Start
1. **Build the Next.js app**:
   ```bash
   npm run build
   ```
2. **Start the server**:
   ```bash
   npm start
   ```

## 5. Deployment Checklist
- [ ] `DATABASE_URL` matches your hosted Postgres DB.
- [ ] `REDIS_URL` matches your hosted Redis.
- [ ] `npx prisma db push --schema=prisma/prod.schema.prisma` executed successfully.
- [ ] Application logs show "✅ Database (Prisma): Connected" and "✅ Cache (Redis): Connected".

## 6. Docker Deployment (Recommended)
This approach creates a self-contained container with your app, custom server, and dependencies, ready for any cloud provider (Railway, AWS, DigitalOcean, etc.).

1. **Build the Image**:
   ```bash
   docker build -t questify-app .
   ```

2. **Run the Container**:
   You must pass the environment variables to the container.
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="Your_Prod_Postgres_URL" \
     -e REDIS_URL="Your_Prod_Redis_URL" \
     questify-app
   ```

3. **Deploy to Railway/Render/Heroku**:
   - Connect your GitHub repo.
   - The provider should automatically detect the `Dockerfile`.
   - Add your environment variables in the provider's dashboard.
   - The app will build and start automatically using the settings in `Dockerfile`.
