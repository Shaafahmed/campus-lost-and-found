# Campus Lost & Found Portal

A full stack (MERN) web application built as a Full Stack Development Lab project.
Students report lost or found items on campus, search everything that has been posted, get automatic match suggestions,
and recover items through a claim-and-approve workflow. An admin panel lets the college monitor and moderate the portal.

**Tech stack:** React 18 + Vite (frontend) · Node.js + Express (backend) · MongoDB + Mongoose (database) · JWT auth · Multer uploads

---

## Folder structure

```
FSD_Project/
├── client/                 React frontend (Vite)
│   └── src/
│       ├── pages/          Home, Browse, ItemDetail, PostItem, Login, Register, Dashboard, Admin
│       ├── components/     Navbar, Footer, ItemCard, ProtectedRoute
│       ├── context/        AuthContext (login state)
│       └── api/            Axios client (adds JWT to requests)
└── server/                 Express backend
    ├── src/
    │   ├── config/db.js    MongoDB connection (bundled MongoDB or your own MONGO_URI)
    │   ├── models/         User, Item, Claim (Mongoose schemas)
    │   ├── routes/         auth, items, claims, admin
    │   ├── middleware/     JWT auth, image upload
    │   ├── seed.js         demo data
    │   └── index.js        server entry point
    ├── uploads/            uploaded item photos
    └── data/               database files (created automatically)
```

## How to run

You need **Node.js 18 or newer**. You do **not** need to install MongoDB: the server starts a bundled MongoDB
automatically and stores data in `server/data/`. The first `npm install` in `server/` downloads that MongoDB
(about 600 MB, one time only).

### Option A: one server (simplest, good for demo)

```bash
cd server
npm install
cd ../client
npm install
npm run build
cd ../server
npm start
```

Open **http://localhost:5000**. The Express server serves both the API and the built React app.

### Option B: development mode (live reload while editing)

Terminal 1:
```bash
cd server
npm run dev
```

Terminal 2:
```bash
cd client
npm run dev
```

Open **http://localhost:5173**. Vite forwards `/api` and `/uploads` requests to the Express server on port 5000.

## Demo accounts

On the first start the database is empty, so demo users, 13 items and some claim requests are loaded automatically.

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@lostfound.edu    | admin123   |
| Student | ananya@student.edu     | student123 |
| Student | rahul@student.edu      | student123 |
| Student | sneha@student.edu      | student123 |
| Student | karthik@student.edu    | student123 |
| Student | meera@student.edu      | student123 |

To reset the demo data: stop the server, then run `npm run seed` inside `server/`.

## Configuration (`server/.env`)

| Variable     | Meaning                                                                 |
|--------------|-------------------------------------------------------------------------|
| `PORT`       | API port (default 5000)                                                 |
| `MONGO_URI`  | Leave empty for the bundled MongoDB, or set a local / MongoDB Atlas URI |
| `JWT_SECRET` | Secret used to sign login tokens; change it for real use                |
| `CLIENT_URL` | Frontend URL allowed by CORS (dev: http://localhost:5173)               |

## Main features

- Register / login with hashed passwords (bcrypt) and JWT sessions; student and admin roles
- Report lost or found items with category, location, date, description, contact info and photo
- Browse with keyword search, Lost/Found tabs, category and status filters, sorting and pagination
- Smart match suggestions between lost and found reports (same category, shared keywords, close dates)
- Claim requests with proof: the poster approves or rejects; contact details are shared only after approval
- Dashboard: my reports, requests received, requests sent, profile
- Admin panel: statistics, category chart, item moderation, block/unblock users
- Responsive design for mobile phones

## Notes

- On Windows with **Smart App Control** turned on, Rollup's native module is blocked. The client is already set up
  to use Rollup's WebAssembly build instead (see `overrides` in `client/package.json`), so no settings need to change.
- Before zipping the project for submission, leave out `node_modules/` and `server/data/`. They are recreated by
  `npm install` and by starting the server.
