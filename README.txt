# 📖 Let Me Tell You (Backend)
**An AI-powered biography assistant for capturing life's most precious memories.**

This is the core engine of the "Let Me Tell You" application. It handles voice processing, AI-driven storytelling, and secure memory storage.

---

## 🚀 Features (Phase 1)
* **🎙️ Voice-to-Story Pipeline:** Upload audio files (`.m4a`, `.mp3`) and receive a polished, first-person memoir.
* **🧠 AI Ghostwriter:** Uses **Gemini 2.5 Flash** to remove stutters, filler words, and self-corrections from raw speech.
* **💾 Triple-Format Storage:** Saves the original audio, the refined text, and the AI-narrated version (future-ready) to **Supabase**.
* **✍️ Manual Mode:** Option to type stories directly and have the AI "polish" them into memoirs.

---

## 🛠️ The Tech Stack
* **Framework:** FastAPI (Python)
* **AI Brain:** Google Gemini 2.5 Flash (Multimodal)
* **Database & Storage:** Supabase (PostgreSQL + S3 Buckets)
* **Containerization:** Docker & Docker Compose

---

## 🏁 Getting Started

### 1. Local Development (Standard)
1. Activate your environment: `.\venv\Scripts\activate`
2. Install dependencies: `pip install -r requirements.txt`
3. Start the server: `uvicorn app.main:app --reload`
4. Access API Docs: `http://127.0.0.1:8000/docs`

### 2. Docker Development (Mentor-Ready)
To run the entire environment in a container:
```bash
docker-compose up --build