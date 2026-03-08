# FUPMS — Factory Utility & Production Management System

A full-stack web application for managing factory utilities (electricity, water), production targets, work schedules, and generating comprehensive reports with PDF/Excel export.

![Node.js](https://img.shields.io/badge/Node.js-20-green) ![React](https://img.shields.io/badge/React-18-blue) ![MySQL](https://img.shields.io/badge/MySQL-8.0-orange) ![Docker](https://img.shields.io/badge/Docker-Ready-blue)

---

## Features

- **Dashboard** — KPI cards, Recharts-powered trend charts, real-time alerts
- **Electricity Management** — CRUD for daily electricity consumption data
- **Water Management** — CRUD for daily water meter readings
- **Work Schedule** — Shifts, attendance tracking, holidays, overtime
- **Production Targets** — Target vs actual, efficiency %, defects, downtime
- **Reports** — Download PDF & Excel for all data types with date range filtering
- **User Management** — Role-based access (Admin, Manager, Data Entry)
- **Settings** — Dark/Light theme toggle, password change
- **Responsive Design** — Mobile-friendly sidebar with drawer navigation
- **Animations** — Smooth transitions with Framer Motion

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite 5 | Build tool & dev server |
| TailwindCSS 3 | Utility-first CSS |
| ShadCN UI (Radix) | Accessible UI components |
| Recharts | Dashboard charts |
| Framer Motion | Animations |
| React Hook Form + Zod | Forms & validation |
| Axios | HTTP client |
| React Router v6 | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MySQL 8 (mysql2) | Database |
| JWT + bcryptjs | Authentication |
| PDFKit | PDF report generation |
| ExcelJS | Excel report generation |
| Winston + Morgan | Logging |
| Helmet + CORS | Security |
| Zod | Request validation |

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── middlewares/       # Auth, audit, validation
│   │   ├── models/            # DB connection, schema
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic (repository pattern)
│   │   ├── utils/             # Logger, seed script
│   │   └── index.js           # Express entry point
│   ├── .env                   # Environment variables
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ui/     # ShadCN UI components
│   │   ├── hooks/             # Auth & Theme contexts
│   │   ├── lib/               # Utilities
│   │   ├── models/            # TypeScript types
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service layer
│   │   ├── App.tsx            # Router setup
│   │   └── main.tsx           # React entry
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **MySQL** 8.0 (or use Docker)
- **npm** >= 9

### 1. Clone & Install

```bash
git clone <repo-url>
cd jkchinthaka-Factory-Resource-Management-System

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Database Setup

Create a MySQL database and run the schema:

```bash
mysql -u root -p < backend/src/models/schema.sql
```

Or use Docker (recommended):

```bash
docker-compose up mysql -d
```

### 3. Configure Environment

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=fupms_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 4. Seed Test Data

```bash
cd backend
npm run seed
```

This creates:
- 6 assets (generators, transformers, boiler)
- 3 users (admin, manager, operator)
- Full year 2025 of electricity, water, schedule, and production data

### 5. Start Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### 6. Login

| Role | Email | Password |
|---|---|---|
| Admin | admin@fupms.com | Admin@123 |
| Manager | manager@fupms.com | Manager@123 |
| Operator | operator@fupms.com | Operator@123 |

---

## Docker Deployment

```bash
# Build and start all services
docker-compose up --build -d

# Access the app
open http://localhost
```

Services:
- **MySQL** — port 3306
- **Backend API** — port 5000
- **Frontend** — port 80

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register (Admin only) |
| PUT | `/api/auth/change-password` | Change password |

### Electricity
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/electricity` | List (paginated) |
| GET | `/api/electricity/:id` | Get by ID |
| POST | `/api/electricity` | Create |
| PUT | `/api/electricity/:id` | Update |
| DELETE | `/api/electricity/:id` | Delete |
| GET | `/api/electricity/trend/:year` | Monthly trend |

### Water
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/water` | List (paginated) |
| POST | `/api/water` | Create |
| PUT | `/api/water/:id` | Update |
| DELETE | `/api/water/:id` | Delete |
| GET | `/api/water/trend/:year` | Monthly trend |

### Schedule
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/schedule` | List (paginated) |
| POST | `/api/schedule` | Create |
| PUT | `/api/schedule/:id` | Update |
| DELETE | `/api/schedule/:id` | Delete |

### Production
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/production` | List (paginated) |
| POST | `/api/production` | Create |
| PUT | `/api/production/:id` | Update |
| DELETE | `/api/production/:id` | Delete |
| GET | `/api/production/achievement/:year` | Monthly achievement |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/electricity/pdf` | Electricity PDF |
| GET | `/api/reports/electricity/excel` | Electricity Excel |
| GET | `/api/reports/water/pdf` | Water PDF |
| GET | `/api/reports/water/excel` | Water Excel |
| GET | `/api/reports/production/pdf` | Production PDF |
| GET | `/api/reports/production/excel` | Production Excel |
| GET | `/api/reports/schedule/pdf` | Schedule PDF |
| GET | `/api/reports/schedule/excel` | Schedule Excel |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/dashboard/:year` | KPIs & summary |
| GET | `/api/analytics/alerts` | Active threshold alerts |

### Users (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Assets
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assets` | List all assets |
| POST | `/api/assets` | Create asset |
| PUT | `/api/assets/:id` | Update asset |
| DELETE | `/api/assets/:id` | Delete asset |

---

## Role-Based Access

| Feature | Admin | Manager | Data Entry |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Electricity CRUD | ✅ | ✅ | ✅ |
| Water CRUD | ✅ | ✅ | ✅ |
| Schedule CRUD | ✅ | ✅ | ✅ |
| Production CRUD | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ❌ |
| Settings | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ❌ |

---

## License

MIT
