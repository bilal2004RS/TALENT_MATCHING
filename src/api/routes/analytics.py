from fastapi import APIRouter
from api.models import SkillGapResult, MarketSkillResult
from workforce_analytics import (
    cartographie_competences,
    skill_gap_analysis,
    analyse_marche
)
from api.core.state import app_state

router = APIRouter(prefix="/analytics", tags=["Workforce Analytics"])


@router.get("/cartographie-skills")
def get_cartographie(top_n: int = 20):
    """
    Top N skills disponibles dans le pool candidats
    """
    df = cartographie_competences(app_state.df_cv)
    return df.head(top_n).to_dict(orient="records")


@router.get("/skill-gap", response_model=list[SkillGapResult])
def get_skill_gap(top_n: int = 20, filtre: str = "all"):
    """
    Analyse des gaps de compétences
    filtre: 'all' | 'penurie' | 'surplus' | 'equilibre'
    """
    df = skill_gap_analysis(
        app_state.df_cv,
        app_state.df_offre,
        app_state.df_marche
    )
    filtre_map = {
        "penurie"  : "🔴 Pénurie",
        "surplus"  : "🟢 Surplus",
        "equilibre": "🟡 Équilibré"
    }
    if filtre in filtre_map:
        df = df[df["statut"] == filtre_map[filtre]]

    return [
        {
            "skill"           : r["skill"],
            "dispo_pct"       : r["dispo_%"],
            "demande_pct"     : r["demande_%"],
            "gap_pct"         : r["gap_%"],
            "tendance_marche" : r["tendance_marche"],
            "statut"          : r["statut"],
        }
        for _, r in df.head(top_n).iterrows()
    ]


@router.get("/marche-skills", response_model=list[MarketSkillResult])
def get_marche_skills(top_n: int = 10):
    """
    Top skills selon opportunité marché (demande + croissance)
    """
    df = analyse_marche(app_state.df_marche)
    return [
        {
            "skill"              : r["skill"],
            "demande_marche_pct" : r["demande_marche_%"],
            "croissance_pct"     : r["croissance_annuelle_%"],
            "salaire_moyen"      : r["salaire_moyen"],
            "score_opportunite"  : r["score_opportunite"],
        }
        for _, r in df.head(top_n).iterrows()
    ]


@router.get("/turnover-risk/{candidate_id}")
def get_turnover_risk(candidate_id: int):
    """
    Prédire le risque de départ d'un candidat
    """
    import pickle, numpy as np
    with open("models/turnover_model.pkl", "rb") as f:
        model = pickle.load(f)

    row = app_state.df_cv[
        app_state.df_cv["candidate_id"] == candidate_id
    ]
    if row.empty:
        from fastapi import HTTPException
        raise HTTPException(404, f"Candidat {candidate_id} non trouvé")

    features = ["age", "annees_experience", "score_cv",
                "niveau_encode", "exp_norm", "score_norm"]
    features = [f for f in features if f in row.columns]
    X = row[features].fillna(0)

    proba    = model.predict_proba(X)[0][1]
    decision = "🔴 Risque élevé" if proba > 0.6 else (
               "🟡 Risque modéré" if proba > 0.35 else
               "🟢 Risque faible")

    return {
        "candidate_id"  : candidate_id,
        "probabilite"   : round(float(proba) * 100, 1),
        "decision"      : decision
    }