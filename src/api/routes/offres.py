from fastapi import APIRouter, HTTPException
from api.core.state import app_state
from pydantic import BaseModel
from typing import Optional
import pandas as pd

router = APIRouter(prefix="/offres", tags=["Offres"])

class OffreCreate(BaseModel):
    titre_poste         : str
    secteur             : str
    localisation        : str
    niveau_requis       : str
    competences_requises: str
    salaire_estime      : int
    description         : Optional[str] = ""

# ─────────────────────────────────────────
# 1. PUBLIER OFFRE
# ─────────────────────────────────────────
@router.post("/")
def publier_offre(offre: OffreCreate):
    """Publier une nouvelle offre + générer embedding"""

    # Nouveau job_id
    new_id = int(app_state.df_offre["job_id"].max()) + 1

    level_map = {"Junior": 0, "Confirmé": 1, "Senior": 2, "Expert": 3}

    new_row = {
        "job_id"              : new_id,
        "titre_poste"         : offre.titre_poste,
        "secteur"             : offre.secteur,
        "localisation"        : offre.localisation,
        "niveau_requis"       : offre.niveau_requis,
        "competences_requises": offre.competences_requises,
        "salaire_estime"      : offre.salaire_estime,
        "description"         : offre.description,
        "competences_text"    : offre.competences_requises.lower(),
        "niveau_encode"       : level_map.get(offre.niveau_requis, 0),
        "salaire_norm"        : offre.salaire_estime / 25000,
    }

    # Ajouter au dataframe en mémoire
    app_state.df_offre = pd.concat(
        [app_state.df_offre, pd.DataFrame([new_row])],
        ignore_index=True
    )

    # Recalculer le vecteur
    from scipy.sparse import vstack
    new_vec = app_state.vectorizer.transform(
        [offre.competences_requises.lower()]
    )
    from scipy.sparse import vstack
    app_state.offre_vectors = vstack([app_state.offre_vectors, new_vec])

    return {
        "message"  : "✅ Offre publiée et embedding généré",
        "job_id"   : new_id,
        "titre"    : offre.titre_poste,
    }


# ─────────────────────────────────────────
# 2. LISTE OFFRES
# ─────────────────────────────────────────
@router.get("/")
def get_offres(
    page       : int = 1,
    limit      : int = 10,
    secteur    : str = "",
    localisation: str = "",
    niveau     : str = ""
):
    df = app_state.df_offre.copy()

    if secteur:
        df = df[df["secteur"].str.contains(secteur, case=False, na=False)]
    if localisation:
        df = df[df["localisation"].str.contains(localisation, case=False, na=False)]
    if niveau:
        df = df[df["niveau_requis"] == niveau]

    total  = len(df)
    start  = (page - 1) * limit
    end    = start + limit
    df_page = df.iloc[start:end]

    return {
        "total"  : total,
        "page"   : page,
        "pages"  : (total // limit) + 1,
        "offres" : df_page[[
            "job_id", "titre_poste", "secteur",
            "localisation", "niveau_requis",
            "competences_requises", "salaire_estime"
        ]].to_dict(orient="records")
    }


# ─────────────────────────────────────────
# 3. STATS DASHBOARD
# ─────────────────────────────────────────
@router.get("/stats")
def get_stats():
    """Statistiques globales pour le dashboard RH"""
    df_cv    = app_state.df_cv
    df_offre = app_state.df_offre

    return {
        "total_cvs"          : len(df_cv),
        "total_offres"       : len(df_offre),
        "score_moyen_cv"     : round(float(df_cv["score_cv"].mean()), 2),
        "salaire_moyen_offre": int(df_offre["salaire_estime"].mean()),
        "niveaux": df_cv["niveau_experience"].value_counts().to_dict(),
        "top_secteurs": df_offre["secteur"].value_counts().head(5).to_dict(),
        "top_localisations": df_cv["localisation"].value_counts().head(5).to_dict(),
    }