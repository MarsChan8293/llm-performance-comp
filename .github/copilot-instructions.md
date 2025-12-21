# GitHub Copilot Instructions for LLM Performance Comp

You are an expert AI programming assistant helping with the "LLM Performance Comp" project. This project is a benchmarking platform for Large Language Models.

## Project Overview
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI.
- **Backend**: Node.js, Express, SQLite (using `sqlite3` library).
- **Data Flow**: Frontend communicates with the backend via RESTful API (`/api/v1/...`).
- **Key Features**: CSV import, manual benchmark entry, side-by-side comparison, message board, and saved reports.

## Coding Standards

### Frontend
- Use functional components with TypeScript.
- Use Shadcn UI components located in `src/components/ui/`.
- Use Lucide React or Phosphor Icons for iconography.
- Use React Query for data fetching and mutations (hooks are in `src/hooks/`).
- Follow the existing theme and styling patterns in `src/styles/theme.css` and `tailwind.config.js`.
- Keep components modular and reusable.

### Backend
- Express server is located in `server/index.js`.
- Use SQLite for persistence. Database initialization and schema are in `server/index.js`.
- API versioning: All endpoints should start with `/api/v1/`.
- Use Joi for request body validation.
- Handle errors gracefully and return appropriate HTTP status codes.

### General
- Maintain the distinction between frontend (`src/`) and backend (`server/`).
- Follow the PRD (available in `PRD.md` and `PRD-zh.md`) for feature requirements.
- Use descriptive variable and function names.
- Add comments for complex logic.

## Project Structure
- `src/components/`: React components.
- `src/hooks/`: Custom React hooks for API interaction.
- `src/lib/`: Utility functions and shared types.
- `server/`: Backend server code and database.
- `src/assets/documents/`: Sample CSV files for benchmarking.
