# Course Management API - Design Document

**Version:** 1.0  
**Author:** Engineering Team  
**Date:** January 2026  
**Status:** Approved

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack & Rationale](#4-technology-stack--rationale)
5. [Data Model Design](#5-data-model-design)
6. [API Design Principles](#6-api-design-principles)
7. [Security Architecture](#7-security-architecture)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Testing Strategy](#9-testing-strategy)
10. [Monitoring & Observability](#10-monitoring--observability)
11. [Performance Considerations](#11-performance-considerations)
12. [Future Roadmap](#12-future-roadmap)
13. [Appendix](#13-appendix)

---

## 1. Executive Summary

### 1.1 Purpose

The **Course Management API** is a RESTful backend service that enables educational platforms to manage courses and their associated lessons. It provides a secure, scalable foundation for learning management systems (LMS) with built-in authentication, authorization, and comprehensive CRUD operations.

### 1.2 Scope

This document outlines the architectural decisions, design patterns, and implementation strategies for the Course Management API. It serves as a reference for:

- Understanding system design decisions
- Onboarding new team members
- Planning future enhancements
- Conducting architecture reviews

### 1.3 Key Features

| Feature | Description |
|---------|-------------|
| **Course Management** | Full CRUD operations for educational courses |
| **Lesson Management** | Create and retrieve lessons within courses |
| **User Authentication** | JWT-based stateless authentication |
| **Role-Based Access** | Admin and regular user role separation |
| **RESTful Design** | Clean, predictable API endpoints |
| **Containerization** | Docker-ready for consistent deployments |

---

## 2. Goals & Non-Goals

### 2.1 Goals

1. **Simplicity** - Provide a clean, intuitive API that's easy to consume
2. **Security** - Implement industry-standard authentication and authorization
3. **Scalability** - Design for horizontal scaling without architectural changes
4. **Maintainability** - Clean code structure with clear separation of concerns
5. **Developer Experience** - Comprehensive documentation and predictable behavior
6. **Testability** - High test coverage with isolated, fast unit tests

### 2.2 Non-Goals

1. **Real-time Features** - WebSocket/real-time notifications are out of scope
2. **File Storage** - Media upload/storage handled by external services
3. **Payment Processing** - Monetization features not included
4. **Multi-tenancy** - Single-tenant design (one database per deployment)
5. **Internationalization** - API responses in English only

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │           Client Layer              │
                                    │  (Web Apps, Mobile Apps, CLI Tools) │
                                    └──────────────────┬──────────────────┘
                                                       │
                                                       │ HTTPS/HTTP
                                                       │ REST API Calls
                                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              Application Layer (Express.js)                          │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Middleware Pipeline                                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────┐   │ │
│  │  │ Body Parser │→ │   Logger    │→ │  JWT Auth   │→ │ Role Check (Admin)    │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                          │                                           │
│                                          ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              Route Handlers                                      │ │
│  │  ┌───────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐                 │ │
│  │  │  /login   │  │  /courses  │  │  /lessons  │  │   /users    │                 │ │
│  │  │  (Auth)   │  │   (CRUD)   │  │   (CRUD)   │  │ (Admin CRUD)│                 │ │
│  │  └───────────┘  └────────────┘  └────────────┘  └─────────────┘                 │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                          │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Global Error Handler                                   │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                                       │
                                                       │ TypeORM
                                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                  Data Layer (TypeORM)                                │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                   │
│  │   User Entity   │    │  Course Entity  │    │  Lesson Entity  │                   │
│  │                 │    │                 │    │                 │                   │
│  │  - id           │    │  - id           │    │  - id           │                   │
│  │  - email        │    │  - title        │    │  - title        │                   │
│  │  - passwordHash │    │  - url          │    │  - duration     │                   │
│  │  - passwordSalt │    │  - seqNo        │    │  - seqNo        │                   │
│  │  - isAdmin      │    │  - category     │    │  - courseId (FK)│                   │
│  └─────────────────┘    │  - lessons[]    │    └─────────────────┘                   │
│                         └─────────────────┘                                          │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                                       │
                                                       │ PostgreSQL Driver (pg)
                                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                             Database Layer (PostgreSQL 15)                           │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                      │ │
│  │  │   USERS     │      │  COURSES    │      │   LESSONS   │                      │ │
│  │  │   Table     │      │   Table     │◄─────│   Table     │                      │ │
│  │  └─────────────┘      └─────────────┘  1:N └─────────────┘                      │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Request Lifecycle                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

  1. HTTP Request
         │
         ▼
  ┌─────────────┐
  │ Body Parser │──────▶ Parse JSON body
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Request    │──────▶ Log method, URL, timestamp
  │   Logger    │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐       ┌────────────────────────────────────────────┐
  │  JWT Auth   │──────▶│ Extract token from Authorization header    │
  │ Middleware  │       │ Verify signature with JWT_SECRET           │
  └──────┬──────┘       │ Decode payload (userId, email, isAdmin)    │
         │              │ Attach user info to request object         │
         │              └────────────────────────────────────────────┘
         │
         ▼ (if /api/users)
  ┌─────────────┐
  │ Admin Check │──────▶ Verify isAdmin === true
  │ Middleware  │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐       ┌────────────────────────────────────────────┐
  │   Route     │──────▶│ Execute business logic                     │
  │  Handler    │       │ Query database via TypeORM                 │
  └──────┬──────┘       │ Format and return response                 │
         │              └────────────────────────────────────────────┘
         │
         ▼ (on error)
  ┌─────────────┐
  │ Global Error│──────▶ Catch unhandled errors
  │   Handler   │        Format error response
  └──────┬──────┘        Log error details
         │
         ▼
  HTTP Response
```

### 3.3 Design Patterns Used

| Pattern | Implementation | Benefit |
|---------|---------------|---------|
| **Middleware Chain** | Express middleware pipeline | Separation of cross-cutting concerns |
| **Repository Pattern** | TypeORM entities & managers | Abstraction over database operations |
| **DTO Pattern** | Request/Response shaping in routes | Clean API contracts |
| **Singleton** | Database connection (DataSource) | Single connection pool management |
| **Factory** | JWT token generation | Encapsulated token creation logic |

---

## 4. Technology Stack & Rationale

### 4.1 Technology Choices

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Runtime** | Node.js | 18+ | Non-blocking I/O, large ecosystem, TypeScript support |
| **Language** | TypeScript | 5.3+ | Type safety, better tooling, improved maintainability |
| **Framework** | Express | 5.x | Minimal, flexible, battle-tested, async/await native |
| **ORM** | TypeORM | 0.3+ | TypeScript-first, decorator-based, active development |
| **Database** | PostgreSQL | 15 | ACID compliance, JSON support, excellent performance |
| **Auth** | jsonwebtoken | 9.x | Industry standard JWT implementation |
| **Logging** | Winston | 3.x | Flexible transports, log levels, production-ready |
| **Testing** | Jest + Supertest | 29.x | Fast, comprehensive mocking, API testing support |

### 4.2 Why TypeScript?

```typescript
// Type Safety prevents runtime errors
interface Course {
  id: number;
  title: string;
  category: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

// Compile-time error if wrong type
const course: Course = {
  id: 1,
  title: "TypeScript Bootcamp",
  category: "INVALID" // ❌ Error: Type '"INVALID"' is not assignable
};
```

**Benefits:**
- Catch errors at compile time, not runtime
- Better IDE support (autocomplete, refactoring)
- Self-documenting code through types
- Easier onboarding for new developers

### 4.3 Why Express 5?

Express 5 provides native async/await error handling:

```typescript
// Express 5 - Errors automatically caught
app.get('/api/courses', async (req, res) => {
  const courses = await courseRepository.find(); // No try-catch needed
  res.json({ courses });
});
```

### 4.4 Why TypeORM?

```typescript
// Declarative entity definition with decorators
@Entity({ name: "COURSES" })
export class Course {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(() => Lesson, lesson => lesson.course)
    lessons: Lesson[];
}

// Clean query API
const courses = await courseRepo.find({
  relations: ['lessons'],
  order: { seqNo: 'DESC' }
});
```

---

## 5. Data Model Design

### 5.1 Entity Relationship Diagram

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           Entity Relationship Diagram                          │
└───────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────┐
    │         USERS           │
    ├─────────────────────────┤
    │ PK │ id          │ INT  │
    ├────┼─────────────┼──────┤
    │    │ email       │ VARCHAR(255) │ UNIQUE
    │    │ passwordHash│ TEXT │
    │    │ passwordSalt│ TEXT │
    │    │ pictureUrl  │ TEXT │
    │    │ isAdmin     │ BOOLEAN │ DEFAULT false
    │    │ createdAt   │ TIMESTAMP │
    │    │ lastUpdatedAt│ TIMESTAMP │
    └─────────────────────────┘


    ┌─────────────────────────┐              ┌─────────────────────────┐
    │        COURSES          │              │        LESSONS          │
    ├─────────────────────────┤              ├─────────────────────────┤
    │ PK │ id          │ INT  │      1    N  │ PK │ id          │ INT  │
    ├────┼─────────────┼──────┤◄────────────►├────┼─────────────┼──────┤
    │    │ seqNo       │ INT  │              │ FK │ courseId    │ INT  │
    │    │ url         │ VARCHAR(255) │      │    │ seqNo       │ INT  │
    │    │ title       │ VARCHAR(255) │      │    │ title       │ VARCHAR(255) │
    │    │ iconUrl     │ TEXT │              │    │ duration    │ VARCHAR(20) │
    │    │ longDescription│ TEXT │           │    │ createdAt   │ TIMESTAMP │
    │    │ category    │ VARCHAR(50) │       │    │ lastUpdatedAt│ TIMESTAMP │
    │    │ createdAt   │ TIMESTAMP │         └─────────────────────────┘
    │    │ lastUpdatedAt│ TIMESTAMP │
    └─────────────────────────┘

    Relationships:
    ━━━━━━━━━━━━━━━
    COURSES ──1:N──► LESSONS (One course has many lessons)
    
    Cascade Rules:
    ━━━━━━━━━━━━━━
    DELETE COURSES → CASCADE DELETE LESSONS
```

### 5.2 Index Strategy

```sql
-- Performance-critical indexes
CREATE INDEX idx_users_email ON "USERS" (email);           -- Login lookups
CREATE INDEX idx_courses_url ON "COURSES" (url);           -- URL-based queries
CREATE INDEX idx_courses_seqno ON "COURSES" ("seqNo" DESC); -- Sorted listings
CREATE INDEX idx_lessons_course ON "LESSONS" ("courseId"); -- Course → Lessons
CREATE INDEX idx_lessons_course_seqno ON "LESSONS" ("courseId", "seqNo"); -- Ordered lessons
```

### 5.3 Data Integrity Rules

| Rule | Implementation | Purpose |
|------|---------------|---------|
| Unique emails | UNIQUE constraint on USERS.email | Prevent duplicate accounts |
| Cascade deletes | ON DELETE CASCADE for lessons | Clean removal of course data |
| Auto-timestamps | @CreateDateColumn, @UpdateDateColumn | Audit trail |
| Auto-increment | SERIAL PRIMARY KEY | Consistent ID generation |
| Sequence ordering | seqNo field with auto-increment logic | Predictable ordering |

---

## 6. API Design Principles

### 6.1 RESTful Design

The API follows REST conventions:

| Principle | Implementation |
|-----------|---------------|
| **Resource-based URLs** | `/api/courses`, `/api/courses/id/:id/lessons` |
| **HTTP Methods** | GET (read), POST (create), PATCH (update), DELETE (remove) |
| **Stateless** | Each request contains all needed info (JWT token) |
| **JSON Format** | All requests/responses use `application/json` |
| **HTTP Status Codes** | Appropriate codes for each scenario |

### 6.2 URL Structure

```
API Endpoint Hierarchy
━━━━━━━━━━━━━━━━━━━━━━

/api
├── /login                              POST   (authenticate)
├── /users                              POST   (create user - admin)
├── /courses                            GET    (list all)
│   └── POST                            POST   (create course)
├── /courses-include-lessons            GET    (list with lessons)
└── /courses
    ├── /id/:courseId                   GET    (get by ID)
    │   ├── PATCH                       PATCH  (update)
    │   ├── DELETE                      DELETE (remove)
    │   └── /lessons                    GET    (list lessons)
    │       └── POST                    POST   (create lesson)
    └── /url/:courseUrl                 GET    (get by URL)
```

### 6.3 Response Formats

**Success Response:**
```json
{
  "courses": [...],
  "totalCourses": 10
}
```

**Error Response:**
```json
{
  "status": "fail",
  "message": "Human-readable error description"
}
```

### 6.4 HTTP Status Code Usage

| Code | Meaning | When Used |
|------|---------|-----------|
| `200` | OK | Successful GET, PATCH, DELETE |
| `201` | Created | Successful POST (new resource) |
| `400` | Bad Request | Validation errors, malformed requests |
| `403` | Forbidden | Invalid/missing JWT, insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (e.g., email exists) |
| `500` | Server Error | Unhandled exceptions |

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              JWT Authentication Flow                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

  Login Request                                 Authenticated Request
  ━━━━━━━━━━━━━                                 ━━━━━━━━━━━━━━━━━━━━━

  ┌────────┐     POST /api/login         ┌────────┐     GET /api/courses
  │ Client │─────────────────────────────│ Client │──────────────────────────────
  └────┬───┘     {email, password}       └────┬───┘     Authorization: Bearer <JWT>
       │                                      │
       ▼                                      ▼
  ┌────────┐                             ┌────────┐
  │  API   │                             │  API   │
  └────┬───┘                             └────┬───┘
       │                                      │
       │ 1. Lookup user by email              │ 1. Extract JWT from header
       │ 2. Hash password with stored salt    │ 2. Verify signature (JWT_SECRET)
       │ 3. Compare hashes                    │ 3. Check expiration
       │ 4. Generate JWT token                │ 4. Decode payload → req.user
       │                                      │
       ▼                                      ▼
  ┌──────────────────────┐              ┌──────────────────────┐
  │ {                    │              │ Continue to route     │
  │   user: {...},       │              │ handler with user     │
  │   authJwtToken: "eyJ"│              │ context available     │
  │ }                    │              └──────────────────────┘
  └──────────────────────┘
```

### 7.2 Password Security

**Hashing Implementation:**
```
Password Hashing (PBKDF2)
━━━━━━━━━━━━━━━━━━━━━━━━━

Input Password: "mysecretpassword"
                        │
                        ▼
              ┌─────────────────┐
              │ Generate Salt   │ ──► 64 random bytes (hex encoded)
              │ crypto.randomBytes│    "a1b2c3d4e5f6..."
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ PBKDF2 Hashing  │
              │ ────────────────│
              │ Algorithm: SHA-512
              │ Iterations: 10,000
              │ Key Length: 64 bytes
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Store in DB     │
              │ passwordHash: "hash..."
              │ passwordSalt: "salt..."
              └─────────────────┘
```

**Why PBKDF2?**
- CPU-intensive (slows brute force attacks)
- Configurable iterations (can increase over time)
- Uses salt (prevents rainbow table attacks)
- NIST recommended standard

### 7.3 Authorization Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              Authorization Matrix                                     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   Endpoint                        │ Anonymous │ Regular User │ Admin User │          │
│   ────────────────────────────────┼───────────┼──────────────┼────────────┤          │
│   POST /api/login                 │     ✅    │      ✅      │     ✅     │          │
│   GET  /api/courses               │     ❌    │      ✅      │     ✅     │          │
│   POST /api/courses               │     ❌    │      ✅      │     ✅     │          │
│   GET  /api/courses/id/:id        │     ❌    │      ✅      │     ✅     │          │
│   PATCH /api/courses/id/:id       │     ❌    │      ✅      │     ✅     │          │
│   DELETE /api/courses/id/:id      │     ❌    │      ✅      │     ✅     │          │
│   GET  /api/courses/url/:url      │     ❌    │      ✅      │     ✅     │          │
│   GET  /api/courses-include-lessons│    ❌    │      ✅      │     ✅     │          │
│   GET  /api/courses/.../lessons   │     ❌    │      ✅      │     ✅     │          │
│   POST /api/courses/.../lessons   │     ❌    │      ✅      │     ✅     │          │
│   POST /api/users                 │     ❌    │      ❌      │     ✅     │          │
│                                                                                      │
│   Legend: ✅ = Allowed, ❌ = Forbidden (403)                                         │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Security Best Practices

| Practice | Implementation |
|----------|---------------|
| **No password storage** | Only hashed passwords stored |
| **Unique salts** | Per-user random salt prevents rainbow attacks |
| **JWT expiration** | Tokens have configurable TTL |
| **Environment variables** | Secrets stored in env vars, not code |
| **HTTPS ready** | Application designed for TLS termination |

---

## 8. Infrastructure & Deployment

### 8.1 Docker Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Docker Deployment                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────────────────────────┐
  │                            Docker Compose Network                                  │
  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │
  │  │                                                                              │  │
  │  │   ┌─────────────────────────┐         ┌─────────────────────────┐           │  │
  │  │   │    practicets_app       │         │   postgres_practicets   │           │  │
  │  │   │    (Node.js App)        │         │   (PostgreSQL 15)       │           │  │
  │  │   │                         │         │                         │           │  │
  │  │   │   ┌─────────────────┐   │         │   ┌─────────────────┐   │           │  │
  │  │   │   │  Express Server │   │  TCP    │   │   PostgreSQL    │   │           │  │
  │  │   │   │    Port 9000    │───┼────────►│   │    Port 5432    │   │           │  │
  │  │   │   └─────────────────┘   │         │   └─────────────────┘   │           │  │
  │  │   │                         │         │                         │           │  │
  │  │   └────────────┬────────────┘         └────────────┬────────────┘           │  │
  │  │                │                                   │                        │  │
  │  └────────────────┼───────────────────────────────────┼────────────────────────┘  │
  │                   │                                   │                           │
  └───────────────────┼───────────────────────────────────┼───────────────────────────┘
                      │                                   │
               Port 9000:9000                      Port 5433:5432
                      │                                   │
                      ▼                                   ▼
               ┌──────────────┐                   ┌──────────────┐
               │  Host :9000  │                   │  Host :5433  │
               │  (API Access)│                   │  (DB Access) │
               └──────────────┘                   └──────────────┘
```

### 8.2 Container Configuration

**App Container (Dockerfile):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 9000
CMD ["node", "dist/server.js"]
```

**Service Dependencies:**
```yaml
depends_on:
  postgres:
    condition: service_healthy  # Wait for DB health check
```

### 8.3 Environment Configuration

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           Environment Variables                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────┬─────────────────────────────────────┬────────────┬───────────┐  │
│  │ Variable       │ Description                         │ Required   │ Default   │  │
│  ├────────────────┼─────────────────────────────────────┼────────────┼───────────┤  │
│  │ PORT           │ HTTP server port                    │ No         │ 9000      │  │
│  │ DB_HOST        │ PostgreSQL hostname                 │ Yes        │ -         │  │
│  │ DB_PORT        │ PostgreSQL port                     │ No         │ 5432      │  │
│  │ DB_USERNAME    │ Database username                   │ Yes        │ -         │  │
│  │ DB_PASSWORD    │ Database password                   │ Yes        │ -         │  │
│  │ DB_NAME        │ Database name                       │ Yes        │ -         │  │
│  │ JWT_SECRET     │ Secret for signing JWTs             │ Yes        │ -         │  │
│  │ NODE_ENV       │ Environment (development/production)│ No         │ dev       │  │
│  │ LOGGER_LEVEL   │ Winston log level                   │ No         │ info      │  │
│  └────────────────┴─────────────────────────────────────┴────────────┴───────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Deployment Workflow

```
Development → Build → Test → Deploy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │   Develop   │     │    Build    │     │    Test     │     │   Deploy    │
  │             │     │             │     │             │     │             │
  │  TypeScript │────►│ npm run     │────►│ npm test    │────►│ docker-     │
  │  Source     │     │ build       │     │             │     │ compose up  │
  │  (src/*.ts) │     │ (tsc)       │     │ (Jest)      │     │ --build     │
  │             │     │             │     │             │     │             │
  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
        │                   │                   │                   │
        ▼                   ▼                   ▼                   ▼
    src/*.ts           dist/*.js          Test Report         Running App
```

---

## 9. Testing Strategy

### 9.1 Testing Pyramid

```
                         ┌───────────────┐
                         │   E2E Tests   │  ← Few, slow, high confidence
                         │   (Manual)    │
                         └───────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │    Integration Tests    │  ← Supertest API tests
                    │    (Jest + Supertest)   │
                    └────────────┬────────────┘
                                 │
       ┌─────────────────────────┴─────────────────────────┐
       │                    Unit Tests                      │  ← Many, fast, isolated
       │                (Jest + Mock DB)                    │
       └────────────────────────────────────────────────────┘
```

### 9.2 Test Categories

| Category | Tools | Purpose | Coverage Target |
|----------|-------|---------|-----------------|
| **Unit Tests** | Jest + Mocks | Test individual route handlers | 80%+ |
| **Integration Tests** | Supertest | Test full request/response cycle | Critical paths |
| **Database Tests** | Jest + Test DB | Test TypeORM queries | Entity operations |

### 9.3 Test Structure

```
src/__tests__/
├── mocks/
│   ├── database.mock.ts    # Mock TypeORM repositories
│   └── test-utils.ts       # Helper functions for tests
├── setup.ts                # Jest global setup
├── login.test.ts           # Auth endpoint tests
├── create-user.test.ts     # User creation tests
├── create-course.test.ts   # Course CRUD tests
├── create-lesson-for-course.test.ts
├── delete-course.test.ts
├── find-course-by-id.test.ts
├── find-course-by-url.test.ts
├── find-lessons-for-course.test.ts
├── get-all-courses.test.ts
├── get-all-courses-with-lessons.test.ts
├── update-course.test.ts
└── authentication-middleware.test.ts
```

### 9.4 Running Tests

```bash
# Run all tests
npm test

# Watch mode (development)
npm run test:watch

# With coverage report
npm run test:coverage

# Verbose output
npm run test:verbose
```

---

## 10. Monitoring & Observability

### 10.1 Logging Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Logging Architecture                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

  Application Events                    Winston Logger                   Log Files
  ━━━━━━━━━━━━━━━━━━                    ━━━━━━━━━━━━━━                   ━━━━━━━━━

  ┌─────────────────┐              ┌─────────────────────┐
  │ Request Received│─────────────►│                     │────────►  logs/all.log
  │                 │              │    Winston Logger   │
  └─────────────────┘              │                     │
                                   │  ┌───────────────┐  │
  ┌─────────────────┐              │  │ Console       │──┼─────────►  stdout
  │ DB Query        │─────────────►│  │ Transport     │  │
  │                 │              │  └───────────────┘  │
  └─────────────────┘              │                     │
                                   │  ┌───────────────┐  │
  ┌─────────────────┐              │  │ File          │──┼─────────►  logs/error.log
  │ Error Occurred  │─────────────►│  │ Transport     │  │            (errors only)
  │                 │              │  └───────────────┘  │
  └─────────────────┘              │                     │
                                   └─────────────────────┘
```

### 10.2 Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `error` | System failures, unhandled exceptions | Database connection failed |
| `warn` | Potential issues, deprecations | Invalid JWT token format |
| `info` | Normal operations, key events | Server started, User logged in |
| `debug` | Detailed debugging info | Query parameters, Full request body |

### 10.3 Log Format

```
2026-01-15 10:30:00 [info]: Server is running on http://localhost:9000
2026-01-15 10:30:05 [info]: Database connection established successfully
2026-01-15 10:30:10 [info]: POST /api/login - User authenticated: user@example.com
2026-01-15 10:31:00 [error]: Database query failed - Connection refused
```

---

## 11. Performance Considerations

### 11.1 Database Optimization

| Technique | Implementation | Impact |
|-----------|---------------|--------|
| **Indexing** | Indexes on frequently queried columns | Faster lookups |
| **Eager Loading** | `relations: ['lessons']` for course+lessons | Reduce N+1 queries |
| **Pagination** | `pageNumber` and `pageSize` params | Bounded response sizes |
| **Connection Pooling** | TypeORM default pooling | Efficient connections |

### 11.2 Query Patterns

```typescript
// ✅ Good: Single query with eager loading
const courses = await courseRepo.find({
  relations: ['lessons'],
  order: { seqNo: 'DESC' }
});

// ❌ Bad: N+1 queries
const courses = await courseRepo.find();
for (const course of courses) {
  course.lessons = await lessonRepo.find({ where: { courseId: course.id } });
}
```

### 11.3 Scalability Path

```
Current Architecture (Single Instance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────►│   App    │────►│ Postgres │
└──────────┘     └──────────┘     └──────────┘


Future: Horizontal Scaling
━━━━━━━━━━━━━━━━━━━━━━━━━━

                              ┌──────────┐
                         ┌───►│  App 1   │───┐
┌──────────┐   ┌──────┐  │    └──────────┘   │   ┌──────────┐
│  Client  │──►│  LB  │──┤                   ├──►│ Postgres │
└──────────┘   └──────┘  │    ┌──────────┐   │   │ (Primary)│
                         └───►│  App 2   │───┘   └──────────┘
                              └──────────┘

Benefits:
- Stateless JWT auth enables horizontal scaling
- No session affinity required
- Can add/remove instances dynamically
```

---

## 12. Future Roadmap

### 12.1 Short-term Enhancements

| Feature | Priority | Complexity | Description |
|---------|----------|------------|-------------|
| Course pagination | High | Low | Add pagination to GET /api/courses |
| URL uniqueness constraint | High | Low | Enforce unique course URLs |
| Input validation | High | Medium | Add Joi/Zod schema validation |
| Rate limiting | Medium | Low | Prevent API abuse |
| Health check endpoint | Medium | Low | `/health` for container orchestration |

### 12.2 Medium-term Features

| Feature | Priority | Complexity | Description |
|---------|----------|------------|-------------|
| Soft deletes | Medium | Medium | Archive instead of delete |
| Course versioning | Medium | Medium | Track course content changes |
| Search functionality | Medium | High | Full-text search on courses |
| Batch operations | Low | Medium | Bulk create/update endpoints |

### 12.3 Long-term Vision

| Feature | Description |
|---------|-------------|
| **Multi-tenancy** | Support multiple organizations |
| **File uploads** | Course thumbnails, lesson videos |
| **Progress tracking** | User course completion tracking |
| **Real-time updates** | WebSocket for live notifications |
| **GraphQL API** | Alternative to REST for flexible queries |
| **Microservices split** | Separate auth, courses, lessons services |

---

## 13. Appendix

### 13.1 Glossary

| Term | Definition |
|------|------------|
| **JWT** | JSON Web Token - stateless authentication token |
| **ORM** | Object-Relational Mapping - database abstraction layer |
| **CRUD** | Create, Read, Update, Delete operations |
| **DTO** | Data Transfer Object - data structure for API contracts |
| **Middleware** | Functions that process requests before route handlers |
| **Entity** | TypeORM class representing a database table |
| **Salt** | Random data added to password before hashing |

### 13.2 Related Documents

| Document | Purpose |
|----------|---------|
| `README.md` | Quick start guide and basic usage |
| `SPECS.md` | Detailed API specification |
| `openapi.yaml` | OpenAPI 3.0 specification for API documentation |

### 13.3 API Quick Reference

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                              API Quick Reference                                    │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  Authentication                                                                    │
│  ━━━━━━━━━━━━━━                                                                    │
│  POST /api/login              Authenticate user, get JWT token                     │
│                                                                                    │
│  Courses                                                                           │
│  ━━━━━━━                                                                           │
│  GET  /api/courses            List all courses                                     │
│  GET  /api/courses-include-lessons    List courses with lessons                    │
│  GET  /api/courses/id/:id     Get course by ID                                     │
│  GET  /api/courses/url/:url   Get course by URL                                    │
│  POST /api/courses            Create new course                                    │
│  PATCH /api/courses/id/:id    Update course                                        │
│  DELETE /api/courses/id/:id   Delete course                                        │
│                                                                                    │
│  Lessons                                                                           │
│  ━━━━━━━                                                                           │
│  GET  /api/courses/id/:id/lessons     List lessons for course                      │
│  POST /api/courses/id/:id/lessons     Create lesson for course                     │
│                                                                                    │
│  Users (Admin Only)                                                                │
│  ━━━━━━━━━━━━━━━━━                                                                 │
│  POST /api/users              Create new user                                      │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 13.4 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Jan 2026 | Use TypeScript over JavaScript | Type safety, better tooling |
| Jan 2026 | Use Express 5 over Express 4 | Native async/await support |
| Jan 2026 | Use TypeORM over Prisma/Sequelize | TypeScript-first design |
| Jan 2026 | Use PostgreSQL over MySQL | Better JSON support, performance |
| Jan 2026 | Use JWT over sessions | Stateless, scalable |
| Jan 2026 | Use PBKDF2 over bcrypt | NIST standard, configurable |

---

**Document Revision History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Engineering Team | Initial document |

---

*This design document is a living document and will be updated as the system evolves.*
