# Inventra

Inventra is a full-stack inventory and order management application built for tracking products, managing stock levels, processing orders, and keeping restock work visible from one dashboard.

## Features

- User signup and login
- Protected dashboard for authenticated users
- Category management
- Product management with stock and minimum threshold tracking
- Order management with status updates
- Restock queue for low-stock products
- Activity log for operational events
- Dashboard insights for orders, inventory pressure, and revenue
- Light and dark theme support

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- Zod validation

## Project Structure

```text
Inventra/
|-- frontend/
|-- backend/
`-- README.md
```

## Prerequisites

Before starting, make sure you have installed:

- Node.js
- npm
- A MongoDB database connection string

## Environment Variables

### Frontend

Create a file inside `frontend` named `.env.local` or `.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

### Backend

Create a file inside `backend` named `.env`:

```env
PORT=5000
DB_URL=your_mongodb_connection_string
NODE_ENV=development
JWT_SECRET=your_super_secret_key
```

## Backend Setup

1. Open a terminal in the `backend` directory.
2. Install dependencies:

```bash
npm install
```

3. Add the `.env` file with the required values.
4. Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000` by default.

## Frontend Setup

1. Open a terminal in the `frontend` directory.
2. Install dependencies:

```bash
npm install
```

3. Add the frontend environment file.
4. Start the frontend app:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000` by default.

## Running The Project Locally

Run both applications in separate terminals:

1. Start the backend from `backend/`
2. Start the frontend from `frontend/`
3. Open `http://localhost:3000`

Make sure the frontend points to the backend API using:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

## Available Scripts

### Frontend

- `npm run dev` - Start the development server
- `npm run build` - Create a production build
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run format` - Format TypeScript files with Prettier

### Backend

- `npm run dev` - Start the backend in watch mode
- `npm run lint` - Run ESLint

## Application Modules

The application currently includes these main areas:

- Landing page
- Login page
- Signup page
- Dashboard overview
- Categories
- Products
- Orders
- Restock queue
- Activity log

## API Base Path

All backend routes are served under:

```text
/api/v1
```

Main route groups include:

- `/auth`
- `/categories`
- `/dashboard`
- `/products`
- `/orders`
- `/restock-queue`
- `/activity-logs`

## Notes

- The backend currently allows frontend requests from `http://localhost:3000`.
- Authentication uses JWT-based login on the backend.
- The frontend stores the authenticated session in the browser.
