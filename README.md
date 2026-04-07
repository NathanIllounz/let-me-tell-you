# 📖 Let Me Tell You

**An AI-powered biography assistant for capturing life's most precious memories.**

This is a monorepo containing the frontend interface and the core backend engine. Designed for easy scalability, the codebase is split into distinct directories to pave the way for future microservices.

---

## 📁 Repository Structure

```
├── backend/                  # Python FastAPI application
│   ├── app/                  # Application source code
│   ├── .env.example          # Template for backend environment variables
│   ├── Dockerfile            # Container definition for the backend
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React + Vite frontend application
│   ├── src/                  # React source code
│   ├── .env.example          # Template for frontend environment variables
│   ├── Dockerfile            # Container definition for the frontend
│   └── package.json          # Node dependencies
└── docker-compose.yml        # Unified service orchestrator
```

---

## 🏁 Quick Start (Docker - Recommended for Beginners)

The easiest way to run the entire stack is using Docker Compose. This ensures you don't have to fiddle with Python versions, Node versions, or operating system quirks.

1. **Setup Environment Variables**:
   * Navigate to the `backend/` folder and copy `.env.example` to `.env`. Fill in your API keys (e.g., Gemini, Supabase).
   * Navigate to the `frontend/` folder and copy `.env.example` to `.env`. Fill in your Supabase variables.
2. **Start the Stack**:
   * Open your terminal in the **root** folder (where this `README` is).
   * Run the following command:
     ```bash
     docker-compose up --build
     ```
3. **Access the App**:
   * Frontend: `http://localhost:5173`
   * Backend API / Swagger Docs: `http://localhost:8000/docs`

---

## 💻 Manual Setup (For Active Development)

If you need to work closely on the code and prefer a hot-reloading development environment, follow these steps.

### 1. Backend Setup

The backend handles the Gemini AI voice processing pipeline and database interactions.

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a pristine virtual environment:
   ```bash
   # On Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # On Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create the `.env` file! Look at `backend/.env.example` to see which keys you require.
5. Run the server in watch mode:
   ```bash
   uvicorn app.main:app --reload
   ```

### 2. Frontend Setup

The frontend is a beautifully designed React application styled with Tailwind CSS v4.

1. Open a **second** terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Create the `.env` file! Look at `frontend/.env.example` to find the required Supabase configuration.
4. Run the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🔑 Environment Variables Guide

To make the application function correctly, both the frontend and backend must securely connect to a shared data store and AI provider.

### Backend Requirements (`backend/.env`)
* `GEMINI_API_KEY`: Used by `app/services/ai_service.py` to refine raw voice transcripts into beautiful stories.
* `SUPABASE_URL`: The entry point for your Supabase project (looks like `https://xyz.supabase.co`).
* `SUPABASE_ANON_KEY`: Standard client-safe access key.
* `SUPABASE_SERVICE_ROLE_KEY`: Elevated privilege key used securely on the backend to bypass RLS limits when writing audio files and saving stories for users.

### Frontend Requirements (`frontend/.env`)
* `VITE_SUPABASE_URL`: Same as the backend Supabase URL.
* `VITE_SUPABASE_ANON_KEY`: Same as the backend Supabase Anon Key.

---

*For detailed architectural patterns or adding additional microservices, refer to the individual component `/app` or `/src` directories.*
