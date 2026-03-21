from fastapi import APIRouter, UploadFile, File, HTTPException
from api.core.state import app_state
from matching_engine import match_cv_to_offres
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import pickle
import os

router = APIRouter(prefix="/candidat", tags=["Candidat"])

# ─────────────────────────────────────────
# 1. UPLOAD + ANALYSE CV
# ─────────────────────────────────────────
@router.post("/upload-cv/{candidate_id}")
async def upload_cv(candidate_id: int, file: UploadFile = File(...)):
    
    content = await file.read()
    filename = file.filename.lower()
    
    # Parse CV content
    extracted_text = ""
    
    if filename.endswith(".pdf"):
        try:
            import io
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    extracted_text += page.extract_text() or ""
        except:
            extracted_text = ""
    
    elif filename.endswith(".docx"):
        try:
            import io
            import docx
            doc = docx.Document(io.BytesIO(content))
            extracted_text = " ".join([p.text for p in doc.paragraphs])
        except:
            extracted_text = ""
    
    # Extract skills from CV text
    all_skills = [
        "python", "java", "javascript", "react", "sql", "docker",
        "kubernetes", "machine learning", "deep learning", "fastapi",
        "spring boot", "tensorflow", "pytorch", "aws", "azure",
        "mongodb", "postgresql", "git", "linux", "spark", "hadoop",
        "scala", "r", "tableau", "powerbi", "excel", "nlp", "cv",
        "node.js", "angular", "vue.js", "django", "flask", "pandas",
        "numpy", "scikit-learn", "airflow", "kafka", "redis"
    ]
    
    soft_skills_list = [
        "leadership", "communication", "teamwork", "problem solving",
        "creativity", "time management", "adaptability", "critical thinking"
    ]
    
    text_lower = extracted_text.lower()
    
    # Ila CV text kayen — extract real skills
    if len(text_lower) > 100:
        detected_skills = [s for s in all_skills if s in text_lower]
        detected_soft   = [s for s in soft_skills_list if s in text_lower]
        
        # Detect experience years
        import re
        exp_matches = re.findall(r'(\d+)\s*(?:ans?|years?)', text_lower)
        annees_exp  = int(exp_matches[0]) if exp_matches else 3
        
        # Score based on skills count
        score_cv = min(1.0 + len(detected_skills) * 0.15, 5.0)
        
        # Detect niveau
        if "senior" in text_lower or annees_exp >= 7:
            niveau = "Senior"
        elif "confirmé" in text_lower or annees_exp >= 3:
            niveau = "Confirmé"
        else:
            niveau = "Junior"
            
    else:
        # Fallback — prendre données du candidat existant
        row = app_state.df_cv[app_state.df_cv["candidate_id"] == candidate_id]
        if row.empty:
            raise HTTPException(404, f"Candidat {candidate_id} non trouvé")
        row = row.iloc[0]
        
        import ast
        def parse_skills(val):
            try:
                parsed = ast.literal_eval(str(val))
                if isinstance(parsed, list):
                    return [s.strip() for s in parsed]
            except:
                pass
            return [s.strip() for s in str(val).split(",")]
        
        detected_skills = parse_skills(row.get("competences_techniques", ""))
        detected_soft   = parse_skills(row.get("soft_skills", ""))
        score_cv        = float(row.get("score_cv", 3.5))
        niveau          = str(row.get("niveau_experience", "Junior"))
        annees_exp      = int(row.get("annees_experience", 0))
    
    # Points forts / améliorer
    if score_cv >= 4.0:
        points_forts     = "Excellente maîtrise technique"
        points_ameliorer = "Continuer à développer les compétences Cloud"
    elif score_cv >= 3.0:
        points_forts     = "Bon profil technique équilibré"
        points_ameliorer = "Renforcer les compétences avancées"
    else:
        points_forts     = "Profil en développement"
        points_ameliorer = "Acquérir plus d'expérience pratique"
    
    return {
        "candidate_id"     : candidate_id,
        "filename"         : file.filename,
        "score_cv"         : round(score_cv, 2),
        "niveau"           : niveau,
        "annees_experience": annees_exp,
        "competences"      : detected_skills[:8],
        "soft_skills"      : detected_soft[:5],
        "points_forts"     : points_forts,
        "points_ameliorer" : points_ameliorer,
        "text_extracted"   : len(text_lower) > 100  # True = CV lu réellement
    }


# ─────────────────────────────────────────
# 2. TALENT SCORE DÉTAILLÉ
# ─────────────────────────────────────────
@router.get("/talent-score/{candidate_id}")
def get_talent_score(candidate_id: int):
    """Retourne le score détaillé d'un candidat"""

    row = app_state.df_cv[app_state.df_cv["candidate_id"] == candidate_id]
    if row.empty:
        raise HTTPException(404, f"Candidat {candidate_id} non trouvé")

    row = row.iloc[0]

    score_cv    = float(row.get("score_cv", 3.5))
    annees_exp  = int(row.get("annees_experience", 0))
    niveau_enc  = int(row.get("niveau_encode", 0))

    # Calcul scores par dimension
    score_skills     = round(min(score_cv / 5.0 * 100, 100), 1)
    score_experience = round(min(annees_exp / 10.0 * 100, 100), 1)
    score_niveau     = round(niveau_enc / 3.0 * 100, 1)
    score_marche     = round(float(row.get("market_score", 60)) \
                       if "market_score" in row.index else 65.0, 1)
    score_global     = round(
        score_skills * 0.35 +
        score_experience * 0.25 +
        score_niveau * 0.20 +
        score_marche * 0.20, 1
    )

    niveau_map = {0: "Junior", 1: "Confirmé", 2: "Senior", 3: "Expert"}

    return {
        "candidate_id"    : candidate_id,
        "score_global"    : score_global,
        "score_skills"    : score_skills,
        "score_experience": score_experience,
        "score_niveau"    : score_niveau,
        "score_marche"    : score_marche,
        "niveau"          : niveau_map.get(niveau_enc, "Junior"),
        "annees_experience": annees_exp,
        "localisation"    : str(row.get("localisation", "")),
    }


# ─────────────────────────────────────────
# 3. OFFRES RECOMMANDÉES
# ─────────────────────────────────────────
@router.get("/offres/{candidate_id}")
def get_offres_recommandees(candidate_id: int, top_n: int = 5):
    """Top N offres recommandées pour un candidat"""

    results = match_cv_to_offres(
        candidate_id  = candidate_id,
        df_cv         = app_state.df_cv,
        df_offre      = app_state.df_offre,
        cv_vectors    = app_state.cv_vectors,
        offre_vectors = app_state.offre_vectors,
        vectorizer    = app_state.vectorizer,
        top_n         = top_n
    )
    if results is None:
        raise HTTPException(404, f"Candidat {candidate_id} non trouvé")
    return results


# ─────────────────────────────────────────
# 4. ORIENTATION CARRIÈRE
# ─────────────────────────────────────────
@router.get("/orientation/{candidate_id}")
def get_orientation(candidate_id: int):
    """Recommandations d'orientation carrière"""

    row = app_state.df_cv[app_state.df_cv["candidate_id"] == candidate_id]
    if row.empty:
        raise HTTPException(404, f"Candidat {candidate_id} non trouvé")

    row = row.iloc[0]

    import ast
    def parse_skills(val):
        try:
            parsed = ast.literal_eval(str(val))
            if isinstance(parsed, list):
                return [s.strip().lower() for s in parsed]
        except:
            pass
        return [s.strip().lower() for s in str(val).split(",")]

    skills      = set(parse_skills(row.get("competences_techniques", "")))
    annees_exp  = int(row.get("annees_experience", 0))
    score_cv    = float(row.get("score_cv", 3.0))

    # Métiers et leurs skills requis
    metiers = [
        {
            "titre"          : "Data Engineer",
            "icon"           : "🚀",
            "skills_requis"  : {"python", "sql", "spark", "airflow", "docker"},
            "salaire_moyen"  : 22000,
            "description"    : "Construire et maintenir les pipelines de données",
        },
        {
            "titre"          : "ML Engineer",
            "icon"           : "🤖",
            "skills_requis"  : {"python", "tensorflow", "pytorch", "docker", "kubernetes"},
            "salaire_moyen"  : 25000,
            "description"    : "Déployer et optimiser les modèles en production",
        },
        {
            "titre"          : "Data Scientist",
            "icon"           : "📊",
            "skills_requis"  : {"python", "machine learning", "sql", "statistics"},
            "salaire_moyen"  : 21000,
            "description"    : "Analyser les données et construire des modèles prédictifs",
        },
        {
            "titre"          : "Data Analyst",
            "icon"           : "📈",
            "skills_requis"  : {"sql", "python", "powerbi", "excel"},
            "salaire_moyen"  : 16000,
            "description"    : "Analyser et visualiser les données métier",
        },
        {
            "titre"          : "DevOps / MLOps",
            "icon"           : "⚙️",
            "skills_requis"  : {"docker", "kubernetes", "ci/cd", "linux"},
            "salaire_moyen"  : 23000,
            "description"    : "Automatiser le déploiement et la maintenance",
        },
    ]

    recommendations = []
    for m in metiers:
        requis      = m["skills_requis"]
        match_count = len(skills & requis)
        total       = len(requis)
        compatibilite = round((match_count / total) * 100, 1) if total > 0 else 0

        # Bonus expérience
        exp_bonus = min(annees_exp * 2, 20)
        compatibilite = min(compatibilite + exp_bonus, 99)

        skills_manquants = list(requis - skills)

        recommendations.append({
            "titre"           : m["titre"],
            "icon"            : m["icon"],
            "compatibilite"   : compatibilite,
            "salaire_moyen"   : m["salaire_moyen"],
            "description"     : m["description"],
            "skills_manquants": skills_manquants[:3],
        })

    recommendations.sort(key=lambda x: x["compatibilite"], reverse=True)
    return recommendations