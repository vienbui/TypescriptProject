# PracticeTS - Course Management API

A RESTful API built with **TypeScript**, **Express**, and **TypeORM** for managing courses and lessons. Features JWT authentication and PostgreSQL database.

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express 5
- **ORM:** TypeORM
- **Database:** PostgreSQL 15
- **Authentication:** JWT (jsonwebtoken)
- **Logging:** Winston
- **Containerization:** Docker & Docker Compose

## Project Structure

```
src/
├── database/           # Database configuration & scripts
│   ├── data-source.ts  # TypeORM data source config
│   ├── populate-db.ts  # Seed database script
│   └── delete-db.ts    # Clear database script
├── entitites/          # TypeORM entities
│   ├── course.ts       # Course entity
│   ├── lesson.ts       # Lesson entity
│   └── user.ts         # User entity
├── middlewares/        # Express middlewares
│   ├── authentication-middleware.ts      # JWT auth check
│   ├── authentication-admin-only-middleware.ts  # Admin role check
│   └── default-error-handler.ts          # Global error handler
├── route/              # API route handlers
│   ├── login.ts        # User login
│   ├── create-user.ts  # Create new user (admin only)
│   ├── get-all-courses.ts
│   ├── find-course-by-id.ts
│   ├── find-course-by-url.ts
│   ├── create-course.ts
│   ├── update-course.ts
│   ├── delete-course.ts
│   └── ...
├── logger.ts           # Winston logger config
├── utils.ts            # Utility functions
└── server.ts           # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ (or Docker)
- PostgreSQL 15 (or Docker)

### Option 1: Run with Docker (Recommended)

```bash
# Start all services (app + database)
docker-compose up --build

# Run in background
docker-compose up --build -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

### Option 2: Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start PostgreSQL** (via Docker or locally):
   ```bash
   docker-compose up postgres -d
   ```

3. **Create `.env` file** in project root:
   ```env
   PORT=9000
   DB_HOST=localhost
   DB_PORT=5433
   DB_USERNAME=postgres
   DB_PASSWORD=postgres123
   DB_NAME=practicets
   JWT_SECRET=your-secret-key-here
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Populate database with sample data (optional):**
   ```bash
   npm run populate-db
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `9000` |
| `DB_HOST` | PostgreSQL host | - |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database username | - |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | - |
| `JWT_SECRET` | Secret key for JWT signing | - |

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/login` | User login, returns JWT | No |

### Courses

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/courses` | Get all courses | Yes |
| `GET` | `/api/courses-include-lessons` | Get all courses with lessons | Yes |
| `GET` | `/api/courses/id/:courseId` | Get course by ID | Yes |
| `GET` | `/api/courses/url/:courseUrl` | Get course by URL | Yes |
| `POST` | `/api/courses` | Create a new course | Yes |
| `PATCH` | `/api/courses/id/:courseId` | Update a course | Yes |
| `DELETE` | `/api/courses/id/:courseId` | Delete a course | Yes |

### Lessons

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/courses/id/:courseId/lessons` | Get lessons for a course | Yes |
| `POST` | `/api/courses/id/:courseId/lessons` | Create a lesson for a course | Yes |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/users` | Create a new user | Yes (Admin) |

## Usage Examples

### Login

```bash
curl -X POST http://localhost:9000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

**Response:**
```json
{
  "user": {
    "email": "user@example.com",
    "pictureUrl": "https://...",
    "isAdmin": false
  },
  "authJwtToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Get All Courses (with JWT)

```bash
curl http://localhost:9000/api/courses \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Create a Course

```bash
curl -X POST http://localhost:9000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "title": "TypeScript Fundamentals",
    "url": "typescript-fundamentals",
    "iconUrl": "https://example.com/icon.png",
    "longDescription": "Learn TypeScript from scratch",
    "category": "BEGINNER",
    "seqNo": 1
  }'
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Clean, build, and start dev server with watch mode |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start-server` | Start production server |
| `npm run populate-db` | Seed database with sample data |
| `npm run delete-db` | Clear all data from database |
| `npm run clean` | Remove `dist/` folder |

## Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v

# Rebuild a specific service
docker-compose up --build app

# Execute command in running container
docker-compose exec app node dist/database/populate-db.js
```

## Logs

Logs are stored in the `logs/` directory:
- `all.log` - All log levels
- `error.log` - Errors only

## License

MIT

