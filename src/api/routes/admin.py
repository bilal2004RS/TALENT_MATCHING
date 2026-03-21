from fastapi import APIRouter, HTTPException
from api.core.state import app_state
from pydantic import BaseModel
import psutil, os, datetime

router = APIRouter(prefix="/admin", tags=["Admin"])

class RoleUpdate(BaseModel):
    role: str

# ─────────────────────────────────────────
# 1. MONITORING SYSTÈME
# ─────────────────────────────────────────
@router.get("/monitoring")
def get_monitoring():
    """Stats système en temps réel"""
    return {
        "cpu_percent"   : psutil.cpu_percent(interval=1),
        "ram_percent"   : psutil.virtual_memory().percent,
        "ram_used_gb"   : round(psutil.virtual_memory().used / 1e9, 2),
        "ram_total_gb"  : round(psutil.virtual_memory().total / 1e9, 2),
        "disk_percent"  : psutil.disk_usage("/").percent,
        "timestamp"     : datetime.datetime.now().isoformat(),
        "models_loaded" : {
            "tfidf"     : app_state.vectorizer is not None,
            "cv_vectors": app_state.cv_vectors is not None,
            "offre_vectors": app_state.offre_vectors is not None,
        }
    }


# ─────────────────────────────────────────
# 2. MONITORING MODÈLES ML
# ─────────────────────────────────────────
@router.get("/monitoring-ml")
def get_monitoring_ml():
    """Stats des modèles ML"""
    cv_shape    = app_state.cv_vectors.shape \
                  if app_state.cv_vectors is not None else (0, 0)
    offre_shape = app_state.offre_vectors.shape \
                  if app_state.offre_vectors is not None else (0, 0)

    return {
        "tfidf_vectorizer": {
            "status"      : "✅ Chargé",
            "vocabulaire" : len(app_state.vectorizer.vocabulary_) \
                            if app_state.vectorizer else 0,
        },
        "cv_vectors": {
            "status"  : "✅ Chargé",
            "shape"   : list(cv_shape),
            "nb_cvs"  : cv_shape[0],
        },
        "offre_vectors": {
            "status"  : "✅ Chargé",
            "shape"   : list(offre_shape),
            "nb_offres": offre_shape[0],
        },
        "derniere_mise_a_jour": datetime.datetime.now().isoformat(),
    }


# ─────────────────────────────────────────
# 3. DATA DRIFT DETECTION
# ─────────────────────────────────────────
@router.get("/drift")
def get_drift():
    """Détection de data drift sur les CVs récents"""
    df = app_state.df_cv

    # Comparer première moitié vs deuxième moitié
    mid   = len(df) // 2
    df1   = df.iloc[:mid]
    df2   = df.iloc[mid:]

    drift_report = {
        "age": {
            "mean_ancien" : round(float(df1["age"].mean()), 2),
            "mean_recent" : round(float(df2["age"].mean()), 2),
            "drift"       : abs(float(df1["age"].mean()) - float(df2["age"].mean())) > 2,
        },
        "annees_experience": {
            "mean_ancien" : round(float(df1["annees_experience"].mean()), 2),
            "mean_recent" : round(float(df2["annees_experience"].mean()), 2),
            "drift"       : abs(float(df1["annees_experience"].mean()) -
                                float(df2["annees_experience"].mean())) > 1,
        },
        "score_cv": {
            "mean_ancien" : round(float(df1["score_cv"].mean()), 3),
            "mean_recent" : round(float(df2["score_cv"].mean()), 3),
            "drift"       : abs(float(df1["score_cv"].mean()) -
                                float(df2["score_cv"].mean())) > 0.2,
        },
        "statut_global": "⚠️ Drift détecté" \
            if any([
                abs(float(df1["age"].mean()) - float(df2["age"].mean())) > 2,
                abs(float(df1["score_cv"].mean()) - float(df2["score_cv"].mean())) > 0.2,
            ]) else "✅ Pas de drift significatif"
    }
    return drift_report