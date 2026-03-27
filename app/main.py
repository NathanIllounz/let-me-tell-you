from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.stories import router as stories_router


app = FastAPI(title="LetMeTellYou API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(stories_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
