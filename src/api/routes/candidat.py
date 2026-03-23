from fastapi import APIRouter, UploadFile, File, HTTPException
from api.core.state import app_state
from matching_engine import match_cv_to_offres
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import io, re, ast

router = APIRouter(prefix="/candidat", tags=["Candidat"])


def parse_cv_text(content: bytes, filename: str) -> dict:
    extracted_text = ""

    # ── Extraction ──────────────────
    if filename.endswith(".pdf"):
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    extracted_text += page.extract_text() or ""
        except:
            pass

    elif filename.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            extracted_text = " ".join([p.text for p in doc.paragraphs])
        except:
            pass

    text_lower = extracted_text.lower()

    # ── Skills ──────────────────────
    all_skills = ["python","java","javascript","react","sql","docker","kubernetes",
                  "machine learning","deep learning","fastapi","spring boot",
                  "tensorflow","pytorch","aws","azure","mongodb","postgresql",
                  "git","linux","spark","hadoop","scala","r","tableau","powerbi",
                  "excel","nlp","node.js","angular","vue.js","django","flask",
                  "pandas","numpy","scikit-learn","airflow","kafka","redis",
                  "data science","big data","devops","agile","scrum","c++",
                  "c#","kotlin","swift","matlab","elasticsearch"]

    soft_skills_list = ["leadership","communication","teamwork","problem solving",
                        "creativity","time management","adaptability","critical thinking",
                        "autonomie","rigueur","organisation"]

    detected_skills = [s for s in all_skills if s in text_lower]
    detected_soft   = [s for s in soft_skills_list if s in text_lower]

    # ── Experience (dynamique) ─────────────────
    exp_patterns = [
        r'(?:exp[ée]rience|exp)[^\d]{0,20}(\d+)\s*(?:ans?|years?)',
        r'(\d+)\s*(?:ans?|years?)\s*(?:d[\' ]?exp[ée]rience)',
        r'(\d+)\s*(?:ans?|years?)\s*(?:experience)',
    ]

    annees_exp = 0

    for pattern in exp_patterns:
        for match in re.finditer(pattern, text_lower):
            val = int(match.group(1))

            start = max(0, match.start() - 40)
            end   = match.end() + 40
            context = text_lower[start:end]

            if any(w in context for w in ["age","né","birth"]):
                continue

            if any(w in context for w in ["exp","experience","professionnel"]):
                if 0 <= val <= 40:
                    annees_exp = val
                    break
        if annees_exp:
            break

    # ── fallback intelligent ─────────────────
    if annees_exp == 0:

        extra_patterns = [
            r'(\d+)\+?\s*(years?|ans?)',
            r'over\s*(\d+)\s*(years?)',
            r'more than\s*(\d+)\s*(years?)',
        ]

    for pattern in extra_patterns:
        for match in re.finditer(pattern, text_lower):
            val = int(match.group(1))

            # context
            start = max(0, match.start() - 40)
            end   = match.end() + 40
            context = text_lower[start:end]

            # ❌ ignore age
            if any(w in context for w in ["age", "né", "birth"]):
                continue

            # ✅ خاص يكون مرتبط بخدمة
            if any(w in context for w in ["exp", "experience", "work", "developer", "engineer"]):
                if 0 <= val <= 40:
                    annees_exp = val
                    break
        if annees_exp:
            break

    # estimation ضعيفة فقط
    if annees_exp == 0:
        if "stage" in text_lower or "intern" in text_lower:
            annees_exp = 0
        elif "junior" in text_lower:
            annees_exp = 1
        elif "confirmé" in text_lower or "mid-level" in text_lower:
            annees_exp = 2
        elif "senior" in text_lower or "expert" in text_lower:
            annees_exp = 4

    # ── Score ─────────────────
    score_cv = round(min(1.5 + len(detected_skills) * 0.2, 5.0), 2)

    # ── Niveau ───────────────
    if annees_exp >= 7:
        niveau, niveau_enc = "Senior", 2
    elif annees_exp >= 3:
        niveau, niveau_enc = "Confirmé", 1
    else:
        niveau, niveau_enc = "Junior", 0

    # ── Localisation ─────────
    villes = ["casablanca","rabat","marrakech","fes","tanger",
              "agadir","paris","lyon","toulouse","montreal","tunis"]

    localisation = "Non spécifiée"
    for v in villes:
        if v in text_lower:
            localisation = v.capitalize()
            break

    return {
        "text_lower": text_lower,
        "skills": detected_skills,
        "soft_skills": detected_soft,
        "score_cv": score_cv,
        "niveau": niveau,
        "niveau_enc": niveau_enc,
        "annees_exp": annees_exp,
        "localisation": localisation,
        "has_text": len(text_lower) > 100,
    }
# 1. UPLOAD + ANALYSE CV
# ─────────────────────────────────────────
@router.post("/upload-cv/{user_id}")
async def upload_cv(user_id: int, file: UploadFile = File(...)):
    content = await file.read()
    cv_data = parse_cv_text(content, file.filename.lower())

    if cv_data["score_cv"] >= 4.0:
        points_forts     = "Excellente maîtrise technique"
        points_ameliorer = "Développer les compétences Cloud"
    elif cv_data["score_cv"] >= 3.0:
        points_forts     = "Bon profil technique équilibré"
        points_ameliorer = "Renforcer les compétences avancées"
    else:
        points_forts     = "Profil en développement"
        points_ameliorer = "Acquérir plus d'expérience pratique"

    return {
        "user_id"          : user_id,
        "filename"         : file.filename,
        "score_cv"         : cv_data["score_cv"],
        "niveau"           : cv_data["niveau"],
        "annees_experience": cv_data["annees_exp"],
        "competences"      : cv_data["skills"][:8],
        "soft_skills"      : cv_data["soft_skills"][:5],
        "points_forts"     : points_forts,
        "points_ameliorer" : points_ameliorer,
        "localisation"     : cv_data["localisation"],
        "text_extracted"   : cv_data["has_text"],
    }


# ─────────────────────────────────────────
# 2. TALENT SCORE — basé sur CV réel
# ─────────────────────────────────────────
@router.post("/talent-score-cv")
async def get_talent_score_cv(file: UploadFile = File(...)):
    content = await file.read()
    cv_data = parse_cv_text(content, file.filename.lower())

    score_skills     = round(min(cv_data["score_cv"] / 5.0 * 100, 100), 1)
    score_experience = round(min(cv_data["annees_exp"] / 10.0 * 100, 100), 1)
    score_niveau     = round(cv_data["niveau_enc"] / 3.0 * 100, 1)

    # Market score men dataset marché réel
    market_score = 65.0
    if app_state.df_marche is not None and cv_data["skills"]:
        df_m = app_state.df_marche.copy()
        df_m["skill_lower"] = df_m["skill"].str.lower()
        mask = df_m["skill_lower"].isin(set(cv_data["skills"]))
        if mask.any():
            market_score = float(df_m[mask]["demande_marche_%"].mean())

    score_global = round(
        score_skills * 0.35 +
        score_experience * 0.25 +
        score_niveau * 0.20 +
        market_score * 0.20, 1
    )

    # Percentile men 350K CVs
    percentile = 50
    if app_state.df_cv is not None:
        all_scores = app_state.df_cv["score_cv"].values
        percentile = int(
            np.sum(all_scores < cv_data["score_cv"]) / len(all_scores) * 100
        )

    return {
        "score_global"    : score_global,
        "score_skills"    : score_skills,
        "score_experience": score_experience,
        "score_niveau"    : score_niveau,
        "score_marche"    : round(market_score, 1),
        "niveau"          : cv_data["niveau"],
        "annees_experience": cv_data["annees_exp"],
        "localisation"    : cv_data["localisation"],
        "competences"     : cv_data["skills"][:8],
        "percentile"      : percentile,
    }


# ─────────────────────────────────────────
# 3. OFFRES — matching réel avec dataset
# ─────────────────────────────────────────
@router.post("/offres-cv")
async def get_offres_from_cv(
    file: UploadFile = File(...),
    top_n: int = 5
):
    content = await file.read()
    cv_data = parse_cv_text(content, file.filename.lower())

    if not cv_data["skills"]:
        raise HTTPException(400, "Aucune compétence détectée dans le CV")

    skills_text = " ".join(cv_data["skills"])
    cv_vector   = app_state.vectorizer.transform([skills_text])

    similarities = cosine_similarity(
        cv_vector, app_state.offre_vectors
    ).flatten()

    niveau_map    = {"Junior": 0, "Confirmé": 1, "Senior": 2, "Expert": 3}
    cv_niveau_enc = cv_data["niveau_enc"]
    top_indices   = similarities.argsort()[::-1][:top_n * 3]
    results       = []

    for idx in top_indices:
        if len(results) >= top_n:
            break

        offre         = app_state.df_offre.iloc[idx]
        sim           = float(similarities[idx])
        niveau_requis = str(offre.get("niveau_requis", "Junior"))

        if niveau_map.get(niveau_requis, 0) > cv_niveau_enc + 1:
            continue

        comp_req      = str(offre.get("competences_requises", ""))
        offre_skills  = set(re.sub(r"['\[\]]", "", comp_req)
                           .lower().replace(",", " ").split())
        cv_skills_set = set(cv_data["skills"])
        matched       = list(cv_skills_set & offre_skills)
        missing       = list(offre_skills - cv_skills_set)[:3]

        niveau_score = 1.0 if cv_niveau_enc >= niveau_map.get(niveau_requis, 0) else 0.6
        exp_score    = min(cv_data["annees_exp"] / 10.0, 1.0)
        talent_score = min(round(sim * 60 + niveau_score * 20 + exp_score * 15 + 5, 1), 99)

        results.append({
            "job_id"              : int(offre.get("job_id", idx)),
            "titre_poste"         : str(offre.get("titre_poste", "")),
            "secteur"             : str(offre.get("secteur", "")),
            "localisation"        : str(offre.get("localisation", "")),
            "niveau_requis"       : niveau_requis,
            "salaire_estime"      : int(offre.get("salaire_estime", 0)),
            "talent_score"        : talent_score,
            "similarity"          : round(sim * 100, 1),
            "skills_matches"      : matched[:5],
            "skills_manquants"    : missing,
            "competences_requises": comp_req,
        })

    return results


# ─────────────────────────────────────────
# 4. ORIENTATION — basée sur dataset marché
# ─────────────────────────────────────────
@router.post("/orientation-cv")
async def get_orientation_from_cv(file: UploadFile = File(...)):
    content = await file.read()
    cv_data = parse_cv_text(content, file.filename.lower())

    skills     = set(cv_data["skills"])
    annees_exp = cv_data["annees_exp"]

    metiers = [
        {"titre":"Data Engineer",  "icon":"🚀",
         "skills_requis":{"python","sql","spark","airflow","docker"},
         "description":"Construire et maintenir les pipelines de données"},
        {"titre":"ML Engineer",    "icon":"🤖",
         "skills_requis":{"python","tensorflow","pytorch","docker","kubernetes"},
         "description":"Déployer et optimiser les modèles en production"},
        {"titre":"Data Scientist", "icon":"📊",
         "skills_requis":{"python","machine learning","sql","pandas","numpy"},
         "description":"Analyser les données et construire des modèles prédictifs"},
        {"titre":"Data Analyst",   "icon":"📈",
         "skills_requis":{"sql","python","powerbi","excel","tableau"},
         "description":"Analyser et visualiser les données métier"},
        {"titre":"DevOps / MLOps", "icon":"⚙️",
         "skills_requis":{"docker","kubernetes","linux","git","airflow"},
         "description":"Automatiser le déploiement et la maintenance"},
        {"titre":"Full Stack Dev", "icon":"💻",
         "skills_requis":{"javascript","react","node.js","sql","git"},
         "description":"Développer des applications web complètes"},
    ]

    results = []
    for m in metiers:
        requis        = m["skills_requis"]
        match_count   = len(skills & requis)
        total         = len(requis)
        compatibilite = round((match_count / total) * 100, 1) if total > 0 else 0
        exp_bonus     = min(annees_exp * 2, 20)
        compatibilite = min(compatibilite + exp_bonus, 99)

        # Salaire men dataset marché réel
        salaire_moyen = 18000
        if app_state.df_marche is not None:
            df_m = app_state.df_marche.copy()
            df_m["skill_lower"] = df_m["skill"].str.lower()
            mask = df_m["skill_lower"].isin(requis)
            if mask.any():
                salaire_moyen = int(df_m[mask]["salaire_moyen"].mean())

        results.append({
            "titre"           : m["titre"],
            "icon"            : m["icon"],
            "compatibilite"   : compatibilite,
            "salaire_moyen"   : salaire_moyen,
            "description"     : m["description"],
            "skills_manquants": list(requis - skills)[:3],
            "skills_matches"  : list(skills & requis),
        })

    results.sort(key=lambda x: x["compatibilite"], reverse=True)
    return results