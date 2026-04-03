# Let Me Tell You

A storytelling and memory-capturing platform designed to preserve personal histories through voice and text. 

## Project Structure

This is a monorepo consisting of:
- **Backend**: FastAPI & Supabase (Python) 
- **Frontend**: React, Tailwind CSS v4, & Vite

## Getting Started

### Prerequisites
- Node.js
- Python
- A Supabase project with a `stories` table.

### 1. Backend Setup

Open a terminal and navigate to the project root:

```bash
# Activate your virtual environment
.venv\Scripts\activate

# Install dependencies if you haven't already
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --reload
```
*The backend connects to Supabase and runs on `http://localhost:8000`.*

### 2. Frontend Setup

Open a second terminal and navigate to the `frontend` folder:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

## Environment Variables

Make sure you configure your `.env` files correctly. (Note: These stay tightly secured on your local machine and are ignored by Git).

**Root directory (`/.env`)**:
```env
GEMINI_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Frontend (`/frontend/.env`)**:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
