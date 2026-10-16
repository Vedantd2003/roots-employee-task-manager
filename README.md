# Roots Employee & Task Management System

A full-stack MERN application for managing employees and tasks, built for the Roots Media Marketing MERN Stack Developer Intern assignment.

## Features

- **Employee Management** — CRUD with department/role/skills, status tracking (Active, Inactive, On Leave), leave period management
- **Task Management** — CRUD with priority levels, status workflow, assignment to employees
- **Business Rules Enforced on Backend** — assignment eligibility, capacity limits (max 3 active tasks/employee), status transition graph, overdue detection
- **Dashboard** — server-computed metrics, employee workload
- **CSV Export** — all records matching current filters
- **URL-persisted filters** — search, sort, filters, and page survive refresh and copy-paste
- **Responsive Design** — desktop, tablet, and mobile

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript |
| Routing | React Router v6 |
| State/Data | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Notifications | Sonner |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas + Mongoose |
| Validation | Zod |
| Testing | Jest + Supertest + mongodb-memory-server |

## Architecture Overview

```
roots-employee-task-manager/
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose schemas
│   │   ├── validators/      # Zod request schemas
│   │   ├── services/        # Business logic layer
│   │   ├── controllers/     # HTTP handlers
│   │   ├── routes/          # Express routers
│   │   ├── middleware/      # Error handler, validation
│   │   ├── utils/           # taskCounter, overdue helper
│   │   └── index.ts         # Entry point
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── hooks/           # TanStack Query hooks
│       ├── pages/           # Route-level page components
│       ├── types/           # TypeScript interfaces
│       └── lib/             # Axios instance
├── render.yaml              # Render deployment config
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas account (free tier works)

## Installation

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Environment Variables

Create `backend/.env`:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/roots-tasks
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

See `.env.example` at the root for reference.

## Local Development

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api

## Production Build

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Testing

```bash
cd backend
npm test          # runs all 55 tests with mongodb-memory-server
npm run typecheck # TypeScript check
```

## API Endpoints

### Employees
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/employees | List with pagination, search, filters |
| POST | /api/employees | Create employee |
| GET | /api/employees/:id | Get employee |
| PUT | /api/employees/:id | Update employee |
| DELETE | /api/employees/:id | Delete (blocked if active tasks) |

**Query params**: `page`, `limit`, `search`, `department`, `status`, `sortBy`, `sortOrder`

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks | List with filters |
| POST | /api/tasks | Create task |
| GET | /api/tasks/export.csv | Export filtered tasks as CSV |
| GET | /api/tasks/:id | Get task |
| PUT | /api/tasks/:id | Update task (not status) |
| DELETE | /api/tasks/:id | Delete (Completed/Cancelled only) |
| PUT | /api/tasks/:id/status | Change status only |

**Query params**: `page`, `limit`, `search`, `department`, `priority`, `status`, `dueDateFrom`, `dueDateTo`, `sortBy`, `sortOrder`

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/dashboard | All metrics + workload |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |

## Schemas

### Employee
```typescript
{
  employeeId: string        // unique, e.g. "EMP-001"
  fullName: string
  email: string             // unique, normalized lowercase
  phone: string
  department: 'Development'|'Design'|'QA'|'HR'|'Sales'
  role: string
  joiningDate: Date
  status: 'Active'|'Inactive'|'On Leave'
  skills: string[]
  leaveStartDate?: Date     // required when On Leave
  leaveEndDate?: Date       // required when On Leave
  activeTasks: number       // 0–3, maintained by backend
}
```

### Task
```typescript
{
  taskId: string            // auto: "TSK-001", "TSK-002", ...
  title: string
  description?: string
  assignedEmployee: ObjectId | null   // null if employee deleted
  employeeSnapshot: {       // copied at assignment time
    employeeId: string
    fullName: string
    department: string
  }
  department: 'Development'|'Design'|'QA'|'HR'|'Sales'
  priority: 'Low'|'Medium'|'High'|'Critical'
  status: 'Todo'|'In Progress'|'Completed'|'Cancelled'
  startDate: Date
  dueDate: Date
  createdDate: Date         // set by backend
  completedDate?: Date      // set by backend when Completed
  isOverdue: boolean        // computed field in responses
}
```

## Employee → Task Relationship

Tasks store both a Mongoose reference (`assignedEmployee: ObjectId`) and a **snapshot** (`employeeSnapshot: { employeeId, fullName, department }`) copied at the time of assignment.

- The reference is used to populate live employee details when the employee exists.
- The snapshot is used as fallback when the employee has been deleted.
- This ensures task history is always meaningful even after employee deletion.

## Employee Deletion Strategy

Employee deletion is blocked if the employee has any **Todo** or **In Progress** tasks.

When deletion is permitted (only Completed/Cancelled tasks remain):
1. The employee document is removed from MongoDB.
2. `assignedEmployee` on historical tasks is set to `null`.
3. `employeeSnapshot` on those tasks retains the employee's ID, name, and department.
4. The frontend renders snapshot data with a "Employee deleted" note when `assignedEmployee` is null.

## Pagination, Filtering, and Sorting

All done server-side. Example:

```
GET /api/tasks?search=fix&status=In Progress&priority=High&department=Development&sortBy=dueDate&sortOrder=asc&page=2&limit=10
```

URL state is mirrored in the browser address bar so links are shareable and refresh-safe.

## CSV Export

```
GET /api/tasks/export.csv?status=In Progress&priority=High
```

Applies the same filter logic as the list endpoint but removes pagination, returning all matching rows. The frontend passes the current active filters to this endpoint when the user clicks "Export To CSV".

## Render Deployment

Backend (Web Service):
- Build: `npm install && npm run build`
- Start: `npm start`
- Root dir: `backend`
- Env vars: `MONGODB_URI`, `CLIENT_URL`, `PORT`, `NODE_ENV=production`

Frontend (Static Site):
- Build: `npm install && npm run build`
- Publish dir: `dist`
- Root dir: `frontend`
- Env var: `VITE_API_URL=https://YOUR-BACKEND.onrender.com/api`
- SPA rewrite: `/* → /index.html`

## Live URLs

- **Frontend**: https://roots-frontend-6ibf.onrender.com
- **Backend**: https://roots-backend-vz1g.onrender.com
- **GitHub**: https://github.com/Vedantd2003/roots-employee-task-manager

---

## Assignment Questions

### Q1. Where do you validate status transitions and why?

Status transitions are validated **exclusively in the backend** `task.service.ts`, enforced via the dedicated `PUT /api/tasks/:id/status` endpoint. The regular `PUT /api/tasks/:id` update endpoint explicitly rejects any `status` field in the request body.

The backend is the only authoritative enforcement point because:
- Any client (browser, curl, Postman) can bypass frontend validation.
- The status transition graph (`Todo→InProgress`, `InProgress→Completed/Cancelled`) is a business rule, not a UI concern.
- Frontend validation is supplementary UX only (showing only valid next statuses in the dropdown).

### Q2. Why does Completed Date come from the backend?

`completedDate` is set by the server the moment the status transition to `Completed` is confirmed in the database — never accepted from the frontend.

Reasons:
- **Trust**: The client clock can be manipulated or wrong.
- **Consistency**: All completed dates are in the same timezone reference (server/UTC).
- **Immutability**: A frontend-supplied timestamp could be set to any arbitrary value, including the past or future.
- **Auditability**: The completion timestamp reliably reflects when the system recorded the completion, not when the user submitted the form.

### Q3. How do you block inactive and on-leave assignment?

On every task creation or employee reassignment, the backend:
1. Fetches the target employee from MongoDB by their current database state (never trusts frontend payload).
2. Rejects immediately if `status === 'Inactive'`.
3. If `status === 'On Leave'`, compares the task's `startDate` (midnight-normalized) against the inclusive leave window `[leaveStartDate, leaveEndDate]`. Rejects only if the start date falls within that range.
4. This check happens inside the same service call as the capacity check, before any write occurs.

The frontend dropdown filters to Active employees as a UX aid, but the backend re-validates regardless.

### Q4. Why are filtering and pagination on the backend?

- **Efficiency**: MongoDB indexes filter millions of rows before sending a single byte to the client.
- **Correct totals**: Client-side filtering after loading all records gives the wrong total count for pagination.
- **Scalability**: Sending all records to the browser would be O(n) bandwidth and memory regardless of what the user wants to see.
- **Security**: Whitelisting server-side filter fields prevents injection of arbitrary query operators.

### Q5. Why do filters live in the URL?

- **Shareability**: Copying the URL gives a colleague the exact same filtered view.
- **Refresh persistence**: The page reloads to the same state without requiring server-side session storage.
- **Browser navigation**: Back/forward buttons correctly move between filter states.
- **Reproducibility**: Automated tests and support tickets can reference a specific filter state by URL.
- **Bookmarkability**: Users can bookmark frequently used filtered views.

### Q6. What can go wrong if two requests assign a fourth active task simultaneously?

With a naive read-then-write approach:
1. Request A reads the employee's `activeTasks` counter → 2 (under limit).
2. Request B reads the same counter → 2 (under limit).
3. Request A increments to 3 and creates its task.
4. Request B increments to 3 and creates its task.
5. The employee now has 4 active tasks — the capacity rule is violated.

**This implementation uses an atomic MongoDB `findOneAndUpdate` with a conditional filter:**
```js
Employee.findOneAndUpdate(
  { _id: employeeId, activeTasks: { $lt: 3 } },
  { $inc: { activeTasks: 1 } },
  { new: true }
)
```

MongoDB processes this as a single atomic document operation. If two concurrent requests race, only one will match the `activeTasks < 3` condition after the first one increments it; the second returns `null` and is rejected with a 400 error. This prevents capacity violations without requiring multi-document transactions.

**Remaining limitation**: If the MongoDB deployment does not support atomic single-document updates (which is always guaranteed in MongoDB for single-document operations), this approach is safe. Full ACID multi-document transactions (across employee + task documents atomically) would require a replica set or MongoDB Atlas, which is recommended for production.
