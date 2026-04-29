from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.stories import router as stories_router
from app.api.routes.groups import router as groups_router
from app.api.routes.tasks import router as tasks_router
from app.api.routes.friends import router as friends_router
from app.api.routes.usage import router as usage_router


app = FastAPI(title="LetMeTellYou API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
