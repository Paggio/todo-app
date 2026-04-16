from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.errors import install_exception_handlers
from app.routers import auth as auth_router
from app.routers import categories as categories_router
from app.routers import todos as todos_router


app = FastAPI(title="Todo API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

install_exception_handlers(app)

app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(categories_router.router, prefix="/api/categories", tags=["categories"])
app.include_router(todos_router.router, prefix="/api/todos", tags=["todos"])


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok"}
