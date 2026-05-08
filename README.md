# 🎓 Student Organization Management System (SOMS)

> A full-stack web application for managing student organizations, events, memberships, and documents.

---

## 🌐 Live Links

| Service | URL |
|---------|-----|
| **Frontend** | `https://soms-app.vercel.app` |
| **Backend API** | `https://soms-api.onrender.com` |
| **API Docs** | `https://soms-api.onrender.com/api-docs` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 17 + Tailwind CSS + Vite |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth + JWT |
| **Storage** | Supabase Storage |
| **Deployment** | Vercel (Frontend) · Render (Backend) |

---

## 📁 Project Structure

```
soms/
├── client/           # Angular frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── pages/         # Route-level page components
│   │   │   ├── guards/        # Angular route guards
│   │   │   ├── services/      # HTTP & state services
│   │   │   └── models/        # TypeScript interfaces
│   │   ├── assets/
│   │   └── environments/
│   ├── angular.json
│   ├── tailwind.config.js
│   └── package.json
│
├── server/           # Node.js + Express API
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Helpers & utilities
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
│
├── screenshots/      # UI & API testing screenshots
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- npm v9+
- Supabase account

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Fill in your Supabase credentials in .env
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
# Update src/environments/environment.ts with your API URL
npm run dev      # Vite dev server
npm run build    # Production build
```

---

## 🔌 API Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login & get JWT |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/me` | Get current user |
| POST | `/auth/refresh` | Refresh token |

### Organizations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/organizations` | List all orgs (paginated) |
| POST | `/organizations` | Create org (Admin) |
| GET | `/organizations/:id` | Get org details |
| PUT | `/organizations/:id` | Update org (Admin) |
| DELETE | `/organizations/:id` | Delete org (Admin) |

### Memberships
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/memberships/join/:orgId` | Join organization |
| DELETE | `/memberships/leave/:orgId` | Leave organization |
| GET | `/memberships/my` | My memberships |
| PATCH | `/memberships/:id/approve` | Approve member (Admin) |
| PATCH | `/memberships/:id/reject` | Reject member (Admin) |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List events (paginated) |
| POST | `/events` | Create event (Admin) |
| GET | `/events/:id` | Get event details |
| PUT | `/events/:id` | Update event (Admin) |
| DELETE | `/events/:id` | Delete event (Admin) |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents` | List documents |
| POST | `/documents/upload` | Upload document |
| GET | `/documents/:id` | Get document |
| DELETE | `/documents/:id` | Delete document (Admin) |

---

## ✅ Features Implemented

- [x] User Registration & Login (JWT + Supabase Auth)
- [x] Role-based Access Control (Admin / Student)
- [x] Organization CRUD
- [x] Membership Management (Join / Leave / Approve / Reject)
- [x] Event Management
- [x] Document Upload via Supabase Storage
- [x] Search, Filtering & Pagination
- [x] Responsive UI with Tailwind CSS
- [x] Route Guards (Auth + Role)
- [x] Swagger API Documentation
- [x] Error Handling & Loading States
- [x] Input Validation & Sanitization

---

## 👥 Team

| Role | Responsibility |
|------|---------------|
| Frontend Developer | Angular components, routing, RxJS |
| Backend Developer | REST API, database, authentication |
| UI/UX + Repo Manager | Design system, README, deployment |

---

## 📸 Screenshots

See `/screenshots/` folder for UI and API testing screenshots.
