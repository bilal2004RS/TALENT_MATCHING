from pydantic import BaseModel
from typing import List, Optional

# ── REQUEST SCHEMAS ──────────────────────

class MatchCVRequest(BaseModel):
    candidate_id: int
    top_n: Optional[int] = 5

class MatchOffreRequest(BaseModel):
    job_id: int
    top_n: Optional[int] = 5

class SearchRequest(BaseModel):
    query: str          # ex: "développeur python avec expérience cloud"
    top_n: Optional[int] = 5

# ── RESPONSE SCHEMAS ─────────────────────

class Explication(BaseModel):
    skills_matchés:   List[str]
    skills_manquants: List[str]
    skills_bonus:     List[str]
    sim_skills_pct:   float

class MatchOffreResult(BaseModel):
    job_id:          int
    titre_poste:     str
    secteur:         str
    localisation:    str
    salaire_estime:  float
    talent_score:    float
    explication:     Explication

class MatchCVResult(BaseModel):
    candidate_id:  int
    localisation:  str
    niveau:        str
    annees_exp:    int
    score_cv:      float
    talent_score:  float
    explication:   Explication

class SkillGapResult(BaseModel):
    skill:            str
    dispo_pct:        float
    demande_pct:      float
    gap_pct:          float
    tendance_marche:  str
    statut:           str

class MarketSkillResult(BaseModel):
    skill:              str
    demande_marche_pct: float
    croissance_pct:     float
    salaire_moyen:      float
    score_opportunite:  float