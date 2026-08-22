# CivicConnect 📍
### Crowdsourced Civic Issue Reporting and Resolution System

CivicConnect is a production-quality, portfolio-grade Full Stack MERN application designed to bridge the communication gap between citizens and municipal departments. The platform enables citizens to report local infrastructure issues (e.g., potholes, broken streetlights, water leaks) with precise GPS coordinates and photos, while empowering authorities to manage, assign, and resolve complaints systematically.

---

## Key Features

### 👤 Citizen Capabilities
*   **Geolocated Reporting**: Interactive map interface (Leaflet & OpenStreetMap) allowing users to place pins on exact issue locations.
*   **Reverse Address Lookup**: Automated physical address parsing from map coordinates using OpenStreetMap's Nominatim API.
*   **Geospatial Duplicate Prevention**: Native MongoDB `$nearSphere` searches scan for unresolved issues within a **50-meter radius** of new pins. Alerts users to upvote existing issues instead of filing duplicates.
*   **Engagement & Discussion**: Citizens can upvote issues to increase visibility and post comments on tickets to communicate with resolving officers.
*   **Lifecycle Notifications**: Unread counter badge and in-app bell notification stream tracking real-time status transitions.

### 👮 Officer Console
*   **Department Queue**: Automatic routing of issues to corresponding departments (e.g., Water Board, Sanitation).
*   **Status Management**: Move tickets through lifecycle states: `submitted` ➔ `assigned` ➔ `in-progress` ➔ `resolved` / `rejected`.
*   **Verification Uploads**: Require resolution notes and upload of completion photographs to mark tickets as `resolved`.

### 🛡️ Admin Supervision
*   **Overview Dashboard**: Centralized view of all city issues with status filter tools.
*   **Ticket Assignment**: Route unassigned reports to specific departments or assign individual officers.
*   **High-Fidelity SVG Analytics**: Dynamic custom SVG donut charts, horizontal performance bars, and trend graphs built natively in React (no bloated charting libraries) to track KPIs and resolution speed.

---

## Security Implementations
*   **Input Schema Validation**: All incoming requests (registration, login, reporting) are sanitized using `zod` validator schemas.
*   **Role-Based Access Control (RBAC)**: Secure route protection guards on both frontend layouts and backend controllers.
*   **Session Management**: Stateless JSON Web Tokens (JWT) signed and passed inside HttpOnly, Secure, and SameSite cookies.
*   **Database Defenses**: SQL/NoSQL injection prevention utilizing Mongoose parameters and `express-mongo-sanitize`.
*   **Rate Limiting**: Custom API request limits applied to prevent DDoS attacks on sensitive endpoints.

---

## Technical Stack

*   **Frontend**: React (Vite), Tailwind CSS v4, React Router, Axios, Leaflet Maps, React Hook Form
*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB Atlas, Mongoose (with `2dsphere` index)
*   **Image Storage**: Cloudinary (with local disk fallback for easy local testing)
*   **Deployment Mappings**: Vercel rewrite route configs, Render hosting scripts

---

## Getting Started (Local Run)

### 1. Prerequisite Configuration
Clone the repository, navigate to the `/backend` folder, copy `.env.example` to `.env` and fill out your credentials. 

By default, the project runs on local database:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/civic_issue_db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
COOKIE_EXPIRES_IN=7
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Dependency Setup
From the root workspace directory, run:
```bash
npm run install-all
```
This triggers nested dependency installations across root, `/backend`, and `/frontend`.

### 3. Seed Database Departments
Run the seed script to populate municipal departments and category mappings:
```bash
npm run seed --prefix backend
```

### 4. Create an Admin Account
Register a regular account in the UI at `http://localhost:3000/register`, then run this terminal script to elevate your role:
```bash
npm run make-admin --prefix backend your-email@example.com
```

### 5. Launch the Application
Run the concurrent dev command:
```bash
npm run dev
```
*   **Frontend**: `http://localhost:3000` (or proxy default `5173`)
*   **Backend Health Check**: `http://localhost:5000/api/v1/health`

*Demo video Link*:https://drive.google.com/file/d/1T3AmEA9qydTTzit7-8BcoHsuHbq-mG_0/view?usp=drive_link
