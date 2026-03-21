import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from api.routes.matching  import router as matching_router
from api.routes.analytics import router as analytics_router
from api.routes.candidat  import router as candidat_router   # ← nouveau
from api.routes.offres    import router as offres_router     # ← nouveau
from api.routes.admin     import router as admin_router
from api.core.state import load_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Chargement au démarrage
    load_all()
    yield
    # Nettoyage à l'arrêt
    print("👋 API arrêtée")


app = FastAPI(
    title="🧠 Talent Matching API",
    description="API de matching intelligent CV ↔ Offres + Workforce Analytics",
    version="1.0.0",
    lifespan=lifespan
)

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --------------------------------------

app.include_router(matching_router)
app.include_router(analytics_router)
app.include_router(candidat_router)   # ← nouveau
app.include_router(offres_router)     # ← nouveau
app.include_router(admin_router) 


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "✅ API opérationnelle",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
def health():
    from api.core.state import app_state
    return {
        "cvs_chargés": len(app_state.df_cv) if app_state.df_cv is not None else 0,
        "offres_chargées": len(app_state.df_offre) if app_state.df_offre is not None else 0,
        "status": "ok"
    }