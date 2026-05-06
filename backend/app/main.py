import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.stories import router as stories_router
from app.api.routes.groups import router as groups_router
from app.api.routes.tasks import router as tasks_router
from app.api.routes.friends import router as friends_router
from app.api.routes.usage import router as usage_router
from app.workers.narrator_worker import narrator_daemon_loop
from app.workers.artist_worker import artist_daemon_loop

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background workers as tasks
    print("Starting consolidated background workers (Free Tier Mode)...")
    asyncio.create_task(narrator_daemon_loop())
    asyncio.create_task(artist_daemon_loop())
    yield
    print("Shutting down API...")

app = FastAPI(title="LetMeTellYou API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for easier deployment on Vercel/Render
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(stories_router)
app.include_router(groups_router)
app.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])
app.include_router(friends_router, prefix="/friends", tags=["Friends"])
app.include_router(usage_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
