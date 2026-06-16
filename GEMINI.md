# Sushi EJS Project

This project is a hybrid application featuring a Node.js/Express backend with EJS views and a modern React/TypeScript frontend.

## Architecture

- **Backend**: Node.js, Express (ESM), EJS for server-side rendering.
- **Frontend**: React, TypeScript, Vite, Tailwind CSS.
- **Database**: PostgreSQL (using `pg` pool).
- **Authentication**: Passport.js (Local and Google OAuth2).
- **Session Management**: `express-session` with `connect-pg-simple`.
- **File Uploads**: Cloudinary via Multer.

## Project Structure

- `index.js`: Main entry point for the Express server.
- `controllers/`: Backend logic and route handlers.
- `middleware/`: Express middleware (e.g., auth checks).
- `config/`: Configuration files (DB, Cloudinary, Passport).
- `views/`: EJS templates for the backend-rendered parts.
- `client/`: React/Vite frontend application.
  - `src/components/`: Reusable React components.
  - `src/pages/`: React page components.
  - `src/context/`: React context providers (Auth, Cart).
- `scripts/`: Utility scripts (DB import, testing).
- `public/`: Static assets for the Express server.

## Key Conventions

- **ESM**: Use ECMAScript Modules (`import`/`export`) throughout the backend.
- **Naming**: 
  - Backend: `camelCase` for variables and functions.
  - Frontend: `PascalCase` for components and pages, `camelCase` for hooks and utilities.
  - Database: `snake_case` for table and column names (e.g., `user_id`, `created_at`).
- **Styling**: Prefer Tailwind CSS for frontend styling.
- **State Management**: Use React Context for global state (Auth, Cart).
- **API**: The backend serves as an API for the React frontend (e.g., `/api/...`).

## Common Commands

### Root (Backend)
- `npm start`: Start the Express server.
- `npm run db:import`: Import the database schema from `scripts/importDb.js`.

### Client (Frontend)
- `cd client && npm run dev`: Start the Vite development server.
- `cd client && npm run build`: Build the frontend for production.

## Subdirectory Instructions
- [Client Source Instructions](./client/src/GEMINI.md)
