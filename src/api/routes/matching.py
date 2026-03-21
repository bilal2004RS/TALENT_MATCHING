from fastapi import APIRouter, HTTPException
from api.models import (
    MatchCVRequest, MatchOffreRequest, SearchRequest,
    MatchOffreResult, MatchCVResult
)
from matching_engine import (
    match_cv_to_offres,
    match_offre_to_cvs
)
from api.core.state import app_state

router = APIRouter(prefix="/matching", tags=["Matching"])


@router.post("/cv-to-offres", response_model=list[MatchOffreResult])
def match_cv(req: MatchCVRequest):
    """
    Pour un candidat → retourne les meilleures offres
    """
    results = match_cv_to_offres(
        candidate_id  = req.candidate_id,
        df_cv         = app_state.df_cv,
        df_offre      = app_state.df_offre,
        cv_vectors    = app_state.cv_vectors,
        offre_vectors = app_state.offre_vectors,
        vectorizer    = app_state.vectorizer,
        top_n         = req.top_n
    )
    if results is None:
        raise HTTPException(
            status_code=404,
            detail=f"Candidat {req.candidate_id} non trouvé"
        )
    return results


@router.post("/offre-to-cvs", response_model=list[MatchCVResult])
def match_offre(req: MatchOffreRequest):
    """
    Pour une offre → retourne les meilleurs candidats
    """
    results = match_offre_to_cvs(
        job_id        = req.job_id,
        df_cv         = app_state.df_cv,
        df_offre      = app_state.df_offre,
        cv_vectors    = app_state.cv_vectors,
        offre_vectors = app_state.offre_vectors,
        vectorizer    = app_state.vectorizer,
        top_n         = req.top_n
    )
    if results is None:
        raise HTTPException(
            status_code=404,
            detail=f"Offre {req.job_id} non trouvée"
        )
    return results


@router.post("/search")
def semantic_search(req: SearchRequest):
    """
    Recherche sémantique libre
    ex: 'développeur python cloud senior Casablanca'
    """
    query_vec = app_state.vectorizer.transform([req.query.lower()])
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np

    sims = cosine_similarity(query_vec, app_state.offre_vectors).flatten()
    top_idx = np.argsort(sims)[::-1][:req.top_n]

    results = []
    for i in top_idx:
        row = app_state.df_offre.iloc[i]
        results.append({
            "job_id"       : int(row["job_id"]),
            "titre_poste"  : row["titre_poste"],
            "secteur"      : row["secteur"],
            "localisation" : row["localisation"],
            "score"        : round(float(sims[i]) * 100, 1)
        })
    return results