# Course Management API Specs

## Table of Contents

- [1. Overview](#1-overview)
  * [1.1 Purpose](#11-purpose)
  * [1.2 Tech Stack](#12-tech-stack)
  * [1.3 Roles and Access Control](#13-roles-and-access-control)
- [2. Functional Requirements (API Behavior)](#2-functional-requirements-api-behavior)
  * [2.1 Authentication](#21-authentication)
  * [2.2 Course Management](#22-course-management)
  * [2.3 Lesson Management](#23-lesson-management)
  * [2.4 User Management](#24-user-management)
- [3. Authentication & Authorization](#3-authentication--authorization)
  * [3.1 JWT Authentication Flow](#31-jwt-authentication-flow)
  * [3.2 Role-Based Access Control](#32-role-based-access-control)
  * [3.3 Password Security](#33-password-security)
- [4. API Specification](#4-api-specification)
  * [4.1 Authentication Endpoints](#41-authentication-endpoints)
  * [4.2 Course Endpoints](#42-course-endpoints)
  * [4.3 Lesson Endpoints](#43-lesson-endpoints)
  * [4.4 User Endpoints](#44-user-endpoints)
- [5. Data Model (Database Schema & ER)](#5-data-model-database-schema--er)
  * [5.1 Database Schema (overview)](#51-database-schema-overview)
  * [5.2 PostgreSQL Schema (reference)](#52-postgresql-schema-reference)
  * [5.3 ER Relationships (summary)](#53-er-relationships-summary)
- [6. System & Backend Architecture](#6-system--backend-architecture)
  * [6.1 System Architecture Overview](#61-system-architecture-overview)
  * [6.2 Project Structure](#62-project-structure)
  * [6.3 Middleware Pipeline](#63-middleware-pipeline)
  * [6.4 Error Handling](#64-error-handling)
- [7. Non-Functional Requirements](#7-non-functional-requirements)
  * [7.1 Environment Configuration](#71-environment-configuration)
  * [7.2 Logging](#72-logging)
  * [7.3 Docker Support](#73-docker-support)
- [8. Test Accounts](#8-test-accounts)
- [9. Open Questions](#9-open-questions)
- [10. Deliverables](#10-deliverables)
- [11. Change Log](#11-change-log)

---

## 1. Overview

### 1.1 Purpose

The Course Management API is a RESTful backend service designed to manage educational courses and their associated lessons. It provides:

- User authentication via JWT tokens
- CRUD operations for courses
- CRUD operations for lessons within courses
- Role-based access control (Admin vs Regular Users)
- Secure password handling with salt-based hashing

### 1.2 Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js |
| **Language** | TypeScript |
| **Framework** | Express 5 |
| **ORM** | TypeORM |
| **Database** | PostgreSQL 15 |
| **Authentication** | JWT (jsonwebtoken) |
| **Logging** | Winston |
| **Testing** | Jest + Supertest |
| **Containerization** | Docker & Docker Compose |

### 1.3 Roles and Access Control

| Role | Description | Access Level |
|------|-------------|--------------|
| **Regular User** | Standard authenticated user | Can read/write courses and lessons |
| **Admin User** | Administrator with elevated privileges | All regular user permissions + user management |
| **Anonymous** | Unauthenticated user | Can only access login endpoint |

---

## 2. Functional Requirements (API Behavior)

### 2.1 Authentication

- **Login**
  - Goal: Authenticate user and issue JWT token
  - Input: email, password
  - Output: User details + JWT token
  - Validation:
    - Email is required (400 if missing)
    - Password is required (400 if missing)
    - User must exist (403 if not found)
    - Password must match stored hash (403 if mismatch)
  - States: success (200), validation error (400), authentication failed (403)

### 2.2 Course Management

- **Get All Courses**
  - Goal: Retrieve list of all courses
  - Auth: Required (JWT)
  - Output: Array of courses sorted by `seqNo` DESC, total count
  - States: success (200), unauthorized (403), error (500)

- **Get All Courses with Lessons**
  - Goal: Retrieve courses with their associated lessons eagerly loaded
  - Auth: Required (JWT)
  - Output: Array of courses with lessons, total courses count, total lessons count
  - States: success (200), unauthorized (403), error (500)

- **Find Course by ID**
  - Goal: Retrieve a specific course by its numeric ID
  - Auth: Required (JWT)
  - Path param: `courseId` (number)
  - Output: Course object + total lessons count
  - States: success (200), not found (404), unauthorized (403)

- **Find Course by URL**
  - Goal: Retrieve a specific course by its URL slug
  - Auth: Required (JWT)
  - Path param: `courseUrl` (string)
  - Output: Course object + total lessons count
  - States: success (200), not found (404), unauthorized (403)

- **Create Course**
  - Goal: Create a new course with auto-incremented sequence number
  - Auth: Required (JWT)
  - Input: Course data (title, url, iconUrl, longDescription, category)
  - Output: Created course object with generated `id` and `seqNo`
  - Transaction: REPEATABLE READ isolation level
  - States: success (201), validation error (400), unauthorized (403)

- **Update Course**
  - Goal: Partially update an existing course
  - Auth: Required (JWT)
  - Path param: `courseId` (number)
  - Input: Partial course data (any fields to update)
  - Output: Success message
  - Validation: `courseId` must be a valid integer
  - States: success (200), validation error (400), unauthorized (403)

- **Delete Course**
  - Goal: Delete a course and all its associated lessons
  - Auth: Required (JWT)
  - Path param: `courseId` (number)
  - Transaction: Deletes lessons first, then course
  - Output: Success message
  - States: success (200), validation error (400), unauthorized (403)

### 2.3 Lesson Management

- **Find Lessons for Course**
  - Goal: Retrieve paginated lessons for a specific course
  - Auth: Required (JWT)
  - Path param: `courseId` (number)
  - Query params:
    - `pageNumber` (default: 0)
    - `pageSize` (default: 3)
  - Output: Array of lessons ordered by `seqNo`
  - States: success (200), validation error (400), unauthorized (403)

- **Create Lesson for Course**
  - Goal: Create a new lesson within a course
  - Auth: Required (JWT)
  - Path param: `courseId` (number)
  - Input: Lesson data (title, duration)
  - Output: Created lesson object with generated `id` and `seqNo`
  - Transaction: REPEATABLE READ isolation level
  - Validation: Course must exist
  - States: success (201), not found (404), unauthorized (403)

### 2.4 User Management

- **Create User**
  - Goal: Create a new user account
  - Auth: Required (JWT) + Admin role
  - Input: email, password, pictureUrl, isAdmin
  - Output: Created user object (without password hash/salt)
  - Validation:
    - Email is required (400 if missing)
    - Password is required (400 if missing)
    - Email must be unique (409 if exists)
  - Security: Password is hashed with random salt before storage
  - States: success (200), validation error (400), conflict (409), unauthorized (403)

---

## 3. Authentication & Authorization

### 3.1 JWT Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌──────────┐
│  Client │         │   API   │         │ Database │
└────┬────┘         └────┬────┘         └────┬─────┘
     │                   │                   │
     │ POST /api/login   │                   │
     │ {email, password} │                   │
     │──────────────────>│                   │
     │                   │ Find user by email│
     │                   │──────────────────>│
     │                   │<──────────────────│
     │                   │                   │
     │                   │ Verify password   │
     │                   │ hash              │
     │                   │                   │
     │    JWT Token      │                   │
     │<──────────────────│                   │
     │                   │                   │
     │ GET /api/courses  │                   │
     │ Authorization:    │                   │
     │ Bearer <token>    │                   │
     │──────────────────>│                   │
     │                   │ Verify JWT        │
     │                   │                   │
     │    Courses data   │                   │
     │<──────────────────│                   │
     │                   │                   │
```

### 3.2 Role-Based Access Control

| Endpoint | Method | Regular User | Admin |
|----------|--------|--------------|-------|
| `/api/login` | POST | ✅ (no auth) | ✅ (no auth) |
| `/api/courses` | GET | ✅ | ✅ |
| `/api/courses` | POST | ✅ | ✅ |
| `/api/courses/id/:id` | GET | ✅ | ✅ |
| `/api/courses/id/:id` | PATCH | ✅ | ✅ |
| `/api/courses/id/:id` | DELETE | ✅ | ✅ |
| `/api/courses/url/:url` | GET | ✅ | ✅ |
| `/api/courses-include-lessons` | GET | ✅ | ✅ |
| `/api/courses/id/:id/lessons` | GET | ✅ | ✅ |
| `/api/courses/id/:id/lessons` | POST | ✅ | ✅ |
| `/api/users` | POST | ❌ | ✅ |

### 3.3 Password Security

- **Hashing Algorithm**: PBKDF2 with SHA-512
- **Iterations**: 10,000
- **Key Length**: 64 bytes
- **Salt**: 64 random bytes (hex encoded) per user
- **Storage**: Password hash and salt stored separately in database

---

## 4. API Specification

### 4.1 Authentication Endpoints

#### POST /api/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "email": "user@example.com",
    "pictureUrl": "https://example.com/avatar.png",
    "isAdmin": false
  },
  "authJwtToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request`: Missing email or password
  ```json
  {
    "status": "fail",
    "message": "Email is required"
  }
  ```
- `403 Forbidden`: Invalid credentials
  ```json
  {
    "status": "fail",
    "message": "Invalid email or password. Login denied with email user@example.com."
  }
  ```

---

### 4.2 Course Endpoints

#### GET /api/courses

Get all courses sorted by sequence number (descending).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "courses": [
    {
      "id": 1,
      "seqNo": 10,
      "url": "typescript-bootcamp",
      "title": "Typescript Bootcamp",
      "iconUrl": "https://example.com/icon.jpg",
      "longDescription": "Learn TypeScript in depth...",
      "category": "BEGINNER",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastUpdatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalCourses": 1
}
```

---

#### GET /api/courses-include-lessons

Get all courses with their lessons eagerly loaded.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "courses": [
    {
      "id": 1,
      "seqNo": 10,
      "url": "typescript-bootcamp",
      "title": "Typescript Bootcamp",
      "iconUrl": "https://example.com/icon.jpg",
      "longDescription": "Learn TypeScript in depth...",
      "category": "BEGINNER",
      "lessons": [
        {
          "id": 1,
          "title": "Introduction",
          "duration": "10:30",
          "seqNo": 1,
          "createdAt": "2024-01-15T10:30:00.000Z",
          "lastUpdatedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastUpdatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalCourses": 1,
  "totalLessons": 1
}
```

---

#### GET /api/courses/id/:courseId

Get a specific course by ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `courseId` (number): The course ID

**Response (200 OK):**
```json
{
  "course": {
    "id": 1,
    "seqNo": 10,
    "url": "typescript-bootcamp",
    "title": "Typescript Bootcamp",
    "iconUrl": "https://example.com/icon.jpg",
    "longDescription": "Learn TypeScript in depth...",
    "category": "BEGINNER",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastUpdatedAt": "2024-01-15T10:30:00.000Z"
  },
  "totalLessons": 5
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Could not find a course with id 999"
}
```

---

#### GET /api/courses/url/:courseUrl

Get a specific course by URL slug.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `courseUrl` (string): The course URL slug

**Response (200 OK):**
```json
{
  "course": {
    "id": 1,
    "seqNo": 10,
    "url": "typescript-bootcamp",
    "title": "Typescript Bootcamp",
    "iconUrl": "https://example.com/icon.jpg",
    "longDescription": "Learn TypeScript in depth...",
    "category": "BEGINNER",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastUpdatedAt": "2024-01-15T10:30:00.000Z"
  },
  "totalLessons": 5
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Could not find a course with url invalid-url"
}
```

---

#### POST /api/courses

Create a new course.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "TypeScript Fundamentals",
  "url": "typescript-fundamentals",
  "iconUrl": "https://example.com/icon.png",
  "longDescription": "Learn TypeScript from scratch",
  "category": "BEGINNER"
}
```

**Response (201 Created):**
```json
{
  "savedCourse": {
    "id": 2,
    "seqNo": 11,
    "url": "typescript-fundamentals",
    "title": "TypeScript Fundamentals",
    "iconUrl": "https://example.com/icon.png",
    "longDescription": "Learn TypeScript from scratch",
    "category": "BEGINNER",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastUpdatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### PATCH /api/courses/id/:courseId

Update an existing course (partial update).

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters:**
- `courseId` (number): The course ID

**Request:**
```json
{
  "title": "Updated Course Title",
  "category": "ADVANCED"
}
```

**Response (200 OK):**
```json
{
  "message": "Course 1 was updated successful"
}
```

---

#### DELETE /api/courses/id/:courseId

Delete a course and all its lessons.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `courseId` (number): The course ID

**Response (200 OK):**
```json
{
  "message": "Course 1 was deleted successfully"
}
```

---

### 4.3 Lesson Endpoints

#### GET /api/courses/id/:courseId/lessons

Get paginated lessons for a course.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `courseId` (number): The course ID

**Query Parameters:**
- `pageNumber` (number, optional, default: 0): Page number (0-indexed)
- `pageSize` (number, optional, default: 3): Number of lessons per page

**Response (200 OK):**
```json
{
  "lessons": [
    {
      "id": 1,
      "title": "Introduction to TypeScript",
      "duration": "10:30",
      "seqNo": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastUpdatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "title": "Setting Up the Environment",
      "duration": "08:15",
      "seqNo": 2,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastUpdatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### POST /api/courses/id/:courseId/lessons

Create a new lesson for a course.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters:**
- `courseId` (number): The course ID

**Request:**
```json
{
  "title": "Advanced TypeScript Features",
  "duration": "15:45"
}
```

**Response (201 Created):**
```json
{
  "lesson": {
    "id": 3,
    "title": "Advanced TypeScript Features",
    "duration": "15:45",
    "seqNo": 3,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastUpdatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Course 999 not found"
}
```

---

### 4.4 User Endpoints

#### POST /api/users

Create a new user (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "pictureUrl": "https://example.com/avatar.png",
  "isAdmin": false
}
```

**Response (200 OK):**
```json
{
  "email": "newuser@example.com",
  "pictureUrl": "https://example.com/avatar.png",
  "isAdmin": false
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
  ```json
  {
    "status": "fail",
    "message": "Could not extract the email from the request"
  }
  ```
- `403 Forbidden`: Not an admin user
- `409 Conflict`: User already exists
  ```json
  {
    "status": "fail",
    "message": "User with email newuser@example.com already exists"
  }
  ```

---

## 5. Data Model (Database Schema & ER)

### 5.1 Database Schema (overview)

- **Users & auth:**
  - `USERS`: Application users with role-based access (admin/regular), email, password hash, salt, profile picture, timestamps.

- **Course data:**
  - `COURSES`: Master data for courses (title, url slug, description, icon, category, sequence number, timestamps).
  - `LESSONS`: Individual lessons belonging to courses (title, duration, sequence number, course reference, timestamps).

### 5.2 PostgreSQL Schema (reference)

```sql
-- Users & auth -------------------------------------------------------------

CREATE TABLE "USERS" (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    "passwordHash"  TEXT NOT NULL,
    "passwordSalt"  TEXT NOT NULL,
    "pictureUrl"    TEXT,
    "isAdmin"       BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
    "lastUpdatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON "USERS" (email);


-- Courses ------------------------------------------------------------------

CREATE TABLE "COURSES" (
    id                SERIAL PRIMARY KEY,
    "seqNo"           INTEGER NOT NULL,
    url               VARCHAR(255) NOT NULL,
    title             VARCHAR(255) NOT NULL,
    "iconUrl"         TEXT,
    "longDescription" TEXT,
    category          VARCHAR(50),
    "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
    "lastUpdatedAt"   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_url ON "COURSES" (url);
CREATE INDEX idx_courses_seqno ON "COURSES" ("seqNo" DESC);


-- Lessons ------------------------------------------------------------------

CREATE TABLE "LESSONS" (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    duration        VARCHAR(20),
    "seqNo"         INTEGER NOT NULL,
    "courseId"      INTEGER NOT NULL REFERENCES "COURSES"(id) ON DELETE CASCADE,
    "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
    "lastUpdatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_lessons_course ON "LESSONS" ("courseId");
CREATE INDEX idx_lessons_course_seqno ON "LESSONS" ("courseId", "seqNo");
```

### 5.3 ER Relationships (summary)

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id (PK)         │
│ email           │
│ passwordHash    │
│ passwordSalt    │
│ pictureUrl      │
│ isAdmin         │
│ createdAt       │
│ lastUpdatedAt   │
└─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│    COURSES      │         │    LESSONS      │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │◄────────│ courseId (FK)   │
│ seqNo           │  1    N │ id (PK)         │
│ url             │         │ title           │
│ title           │         │ duration        │
│ iconUrl         │         │ seqNo           │
│ longDescription │         │ createdAt       │
│ category        │         │ lastUpdatedAt   │
│ createdAt       │         └─────────────────┘
│ lastUpdatedAt   │
└─────────────────┘
```

**Relationships:**
- `COURSES` → `LESSONS`: One-to-Many (One course has many lessons)
- `LESSONS` → `COURSES`: Many-to-One (Each lesson belongs to one course)
- Cascade delete: When a course is deleted, all its lessons are deleted

---

## 6. System & Backend Architecture

### 6.1 System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (Web Browser, Mobile App, API Client - Postman, curl, etc.)    │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP/HTTPS
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Express Application                         │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Body Parser  │  │ JSON Parser  │  │ Error Handler        │   │
│  │ Middleware   │  │              │  │ (Global)             │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Authentication Middleware                    │   │
│  │  • JWT Validation (checkIfAuthenticated)                  │   │
│  │  • Admin Role Check (checkIfAdmin)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐   │
│  │   Login    │  │  Courses   │  │  Lessons   │  │  Users   │   │
│  │   Route    │  │  Routes    │  │  Routes    │  │  Route   │   │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                         TypeORM Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    User      │  │   Course     │  │   Lesson     │           │
│  │   Entity     │  │   Entity     │  │   Entity     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │  USERS   │  │ COURSES  │  │ LESSONS  │                       │
│  └──────────┘  └──────────┘  └──────────┘                       │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Project Structure

```
src/
├── __tests__/              # Jest test files
│   ├── mocks/              # Test utilities and mocks
│   │   ├── database.mock.ts
│   │   └── test-utils.ts
│   ├── setup.ts            # Test setup configuration
│   ├── login.test.ts
│   ├── create-user.test.ts
│   ├── create-course.test.ts
│   └── ...
├── database/               # Database configuration & scripts
│   ├── data-source.ts      # TypeORM DataSource configuration
│   ├── database.ts         # Database utilities
│   ├── db-data.ts          # Seed data definitions
│   ├── populate-db.ts      # Database seeding script
│   └── delete-db.ts        # Database cleanup script
├── entitites/              # TypeORM entity definitions
│   ├── course.ts           # Course entity
│   ├── lesson.ts           # Lesson entity
│   └── user.ts             # User entity
├── middlewares/            # Express middleware
│   ├── authentication-middleware.ts       # JWT verification
│   ├── authentication-admin-only-middleware.ts  # Admin check
│   └── default-error-handler.ts           # Global error handler
├── route/                  # Express route handlers
│   ├── root.ts             # Root endpoint
│   ├── login.ts            # Authentication
│   ├── create-user.ts      # User creation (admin)
│   ├── get-all-courses.ts
│   ├── get-all-courses-with-lessons.ts
│   ├── find-course-by-id.ts
│   ├── find-course-by-url.ts
│   ├── create-course.ts
│   ├── update-course.ts
│   ├── delete-course.ts
│   ├── find-lesson-for-course.ts
│   └── create-lesson-for-course.ts
├── logger.ts               # Winston logger configuration
├── utils.ts                # Utility functions (password hashing, etc.)
└── server.ts               # Application entry point
```

### 6.3 Middleware Pipeline

```
Request Flow:
─────────────────────────────────────────────────────────────────────>

┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    ┌───────┐
│ Body Parser │ -> │ JSON Parser │ -> │ Auth Middleware │ -> │ Route │
└─────────────┘    └─────────────┘    └─────────────────┘    └───────┘
                                             │
                                             │ (for /api/users only)
                                             ▼
                                      ┌─────────────────┐
                                      │ Admin Middleware │
                                      └─────────────────┘

Error Flow:
<─────────────────────────────────────────────────────────────────────

┌───────────────────┐
│ Global Error      │ <- Any unhandled error
│ Handler           │
└───────────────────┘
```

### 6.4 Error Handling

| Error Type | HTTP Status | Response Format |
|------------|-------------|-----------------|
| Validation Error | 400 | `{ status: "fail", message: "..." }` |
| Authentication Failed | 403 | `{ status: "fail", message: "..." }` |
| Resource Not Found | 404 | `{ message: "..." }` |
| Conflict (Duplicate) | 409 | `{ status: "fail", message: "..." }` |
| Internal Server Error | 500 | `{ status: "error", message: "Internal Server Error" }` |

---

## 7. Non-Functional Requirements

### 7.1 Environment Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `9000` |
| `DB_HOST` | PostgreSQL host | Yes | - |
| `DB_PORT` | PostgreSQL port | No | `5432` |
| `DB_USERNAME` | Database username | Yes | - |
| `DB_PASSWORD` | Database password | Yes | - |
| `DB_NAME` | Database name | Yes | - |
| `JWT_SECRET` | Secret key for JWT signing | Yes | - |

### 7.2 Logging

- **Logger**: Winston
- **Log Files**:
  - `logs/all.log`: All log levels
  - `logs/error.log`: Error level only
- **Log Levels**: debug, info, warn, error
- **Format**: Timestamp + level + message

### 7.3 Docker Support

**Docker Compose Services:**

| Service | Port | Description |
|---------|------|-------------|
| `app` | 9000 | Node.js application |
| `postgres` | 5433:5432 | PostgreSQL database |

**Docker Commands:**
```bash
# Start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 8. Test Accounts

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Regular User | `test@angular-university.io` | `test` | Standard user access |
| Admin | `admin@angular-university.io` | `admin` | Full admin access |

---

## 9. Open Questions

- **Authorization granularity**
  - Should course/lesson modification be restricted to course creators only?
  - Should there be a "teacher" role separate from admin?

- **Pagination**
  - Should GET /api/courses support pagination?
  - Should there be a configurable max page size?

- **Course URL uniqueness**
  - Should URL slugs be enforced as unique at database level?
  - How to handle URL conflicts?

- **Soft deletes**
  - Should courses/lessons be soft-deleted instead of hard-deleted?
  - Audit trail requirements?

- **File uploads**
  - Future support for course icons/thumbnails upload?
  - Video lesson content?

- **Rate limiting**
  - Should API endpoints have rate limiting?
  - Different limits for authenticated vs anonymous?

---

## 10. Deliverables

- **Backend API**
  - Complete REST API implementation in TypeScript/Express
  - TypeORM entities and database migrations
  - JWT authentication with role-based access control
  - Comprehensive error handling

- **Testing**
  - Jest unit tests for all route handlers
  - Integration tests with test database
  - Test coverage reporting

- **Documentation**
  - This specification document
  - README with setup instructions
  - API endpoint documentation

- **Infrastructure**
  - Docker and Docker Compose configuration
  - Environment configuration templates
  - Database seeding scripts

---

## 11. Change Log

- **v1.0** - January 2026
  - Initial specification document
  - Documented all existing API endpoints
  - Database schema documentation
  - System architecture overview
  - Authentication and authorization flow
  - Test account information

