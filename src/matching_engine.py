import pandas as pd
import numpy as np
import pickle
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import load_npz, save_npz
import os

PROCESSED_PATH = "data/processed/"
MODELS_PATH    = "models/"

# ─────────────────────────────────────────
# 1. CHARGER LES VECTEURS + DONNÉES
# ─────────────────────────────────────────

def load_data():
    print("📂 Chargement des données...")

    df_cv    = pd.read_csv(PROCESSED_PATH + "cv_features.csv")
    df_offre = pd.read_csv(PROCESSED_PATH + "offre_features.csv")

    with open(MODELS_PATH + "tfidf_vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)

    # Re-vectoriser depuis les colonnes texte
    cv_vectors    = vectorizer.transform(df_cv["all_skills_text"].fillna(""))
    offre_vectors = vectorizer.transform(df_offre["competences_text"].fillna(""))

    print(f"  ✅ CVs    : {df_cv.shape[0]} | Offres : {df_offre.shape[0]}")
    return df_cv, df_offre, cv_vectors, offre_vectors, vectorizer


# ─────────────────────────────────────────
# 2. CALCUL DU TALENT SCORE
# ─────────────────────────────────────────

def compute_talent_score(cv_vec, offre_vec, cv_row, offre_row):
    """
    Score final = combinaison pondérée de :
      - similarité sémantique skills (60%)
      - compatibilité niveau expérience (25%)
      - localisation matching (15%)
    """
    # 60% — Similarité cosinus sur les skills
    sim_skills = cosine_similarity(cv_vec, offre_vec)[0][0]

    # 25% — Niveau expérience compatible
    niveau_cv    = int(cv_row.get("niveau_encode", 0))
    niveau_offre = int(offre_row.get("niveau_encode", 0))
    diff_niveau  = abs(niveau_cv - niveau_offre)
    sim_niveau   = max(0, 1 - diff_niveau * 0.33)

    # 15% — Localisation
    loc_cv    = str(cv_row.get("localisation", "")).strip().lower()
    loc_offre = str(offre_row.get("localisation", "")).strip().lower()
    sim_local = 1.0 if loc_cv == loc_offre else 0.3

    # Score final pondéré
    score = (0.60 * sim_skills) + (0.25 * sim_niveau) + (0.15 * sim_local)
    score_pct = round(score * 100, 1)

    return score_pct, sim_skills, sim_niveau, sim_local


# ─────────────────────────────────────────
# 3. EXPLICATION DU SCORE (XAI)
# ─────────────────────────────────────────

def explain_match(cv_row, offre_row, sim_skills, vectorizer):
    """Génère une explication textuelle du matching"""

    import ast

    def parse_skills(val):
        try:
            parsed = ast.literal_eval(str(val))
            if isinstance(parsed, list):
                return set(s.strip().lower() for s in parsed)
        except:
            pass
        return set(s.strip().lower() for s in str(val).split(","))

    skills_cv    = parse_skills(cv_row.get("competences_techniques", ""))
    skills_offre = parse_skills(offre_row.get("competences_requises", ""))

    matched  = skills_cv & skills_offre
    missing  = skills_offre - skills_cv
    extra    = skills_cv - skills_offre

    explanation = {
        "skills_matchés" : list(matched)[:5],
        "skills_manquants": list(missing)[:5],
        "skills_bonus"   : list(extra)[:3],
        "sim_skills_pct" : round(sim_skills * 100, 1),
    }
    return explanation


# ─────────────────────────────────────────
# 4. TOP-N MATCHING : CV → Offres
# ─────────────────────────────────────────

def match_cv_to_offres(candidate_id, df_cv, df_offre,
                        cv_vectors, offre_vectors,
                        vectorizer, top_n=5):
    """
    Pour un candidat donné → retourne les top N offres les mieux matchées
    """
    idx = df_cv[df_cv["candidate_id"] == candidate_id].index
    if len(idx) == 0:
        print(f"❌ Candidat {candidate_id} non trouvé")
        return None

    idx      = idx[0]
    cv_vec   = cv_vectors[idx]
    cv_row   = df_cv.iloc[idx]

    results = []
    # Calcul cosinus batch (rapide)
    sims = cosine_similarity(cv_vec, offre_vectors).flatten()
    top_indices = np.argsort(sims)[::-1][:top_n * 3]  # marge pour filtrage

    for i in top_indices:
        offre_row = df_offre.iloc[i]
        offre_vec = offre_vectors[i]

        score, sim_s, sim_n, sim_l = compute_talent_score(
            cv_vec, offre_vec, cv_row, offre_row
        )
        explanation = explain_match(cv_row, offre_row, sim_s, vectorizer)

        results.append({
            "job_id"         : offre_row.get("job_id"),
            "titre_poste"    : offre_row.get("titre_poste"),
            "secteur"        : offre_row.get("secteur"),
            "localisation"   : offre_row.get("localisation"),
            "salaire_estime" : offre_row.get("salaire_estime"),
            "talent_score"   : score,
            "explication"    : explanation,
        })

    # Trier par talent score final
    results = sorted(results, key=lambda x: x["talent_score"], reverse=True)[:top_n]
    return results


# ─────────────────────────────────────────
# 5. TOP-N MATCHING : Offre → Candidats
# ─────────────────────────────────────────

def match_offre_to_cvs(job_id, df_cv, df_offre,
                        cv_vectors, offre_vectors,
                        vectorizer, top_n=5):
    """
    Pour une offre donnée → retourne les top N candidats les mieux matchés
    """
    idx = df_offre[df_offre["job_id"] == job_id].index
    if len(idx) == 0:
        print(f"❌ Offre {job_id} non trouvée")
        return None

    idx       = idx[0]
    offre_vec = offre_vectors[idx]
    offre_row = df_offre.iloc[idx]

    sims        = cosine_similarity(offre_vec, cv_vectors).flatten()
    top_indices = np.argsort(sims)[::-1][:top_n * 3]

    results = []
    for i in top_indices:
        cv_row = df_cv.iloc[i]
        cv_vec = cv_vectors[i]

        score, sim_s, sim_n, sim_l = compute_talent_score(
            cv_vec, offre_vec, cv_row, offre_row
        )
        explanation = explain_match(cv_row, offre_row, sim_s, vectorizer)

        results.append({
            "candidate_id"   : cv_row.get("candidate_id"),
            "localisation"   : cv_row.get("localisation"),
            "niveau"         : cv_row.get("niveau_experience"),
            "annees_exp"     : cv_row.get("annees_experience"),
            "score_cv"       : cv_row.get("score_cv"),
            "talent_score"   : score,
            "explication"    : explanation,
        })

    results = sorted(results, key=lambda x: x["talent_score"], reverse=True)[:top_n]
    return results


# ─────────────────────────────────────────
# 6. AFFICHAGE RÉSULTATS
# ─────────────────────────────────────────

def print_results(results, mode="cv"):
    if not results:
        return
    print("\n" + "="*55)
    for i, r in enumerate(results, 1):
        print(f"\n🏆 #{i} — Talent Score: {r['talent_score']}%")
        if mode == "cv":
            print(f"   📌 Poste      : {r['titre_poste']}")
            print(f"   🏢 Secteur    : {r['secteur']}")
            print(f"   📍 Lieu       : {r['localisation']}")
            print(f"   💰 Salaire    : {r['salaire_estime']} DH")
        else:
            print(f"   👤 Candidat   : {r['candidate_id']}")
            print(f"   📍 Lieu       : {r['localisation']}")
            print(f"   🎓 Niveau     : {r['niveau']} ({r['annees_exp']} ans)")
            print(f"   ⭐ Score CV   : {r['score_cv']}")

        exp = r["explication"]
        print(f"   ✅ Skills OK  : {', '.join(exp['skills_matchés']) or 'aucun'}")
        print(f"   ❌ Manquants  : {', '.join(exp['skills_manquants']) or 'aucun'}")
        print(f"   🎁 Bonus      : {', '.join(exp['skills_bonus']) or 'aucun'}")
    print("="*55)


# ─────────────────────────────────────────
# 7. MAIN — TEST
# ─────────────────────────────────────────

if __name__ == "__main__":
    df_cv, df_offre, cv_vectors, offre_vectors, vectorizer = load_data()

    # Test 1 : CV → Top 5 offres
    print("\n🔍 Test : Candidat 1 → Top 5 offres")
    results_cv = match_cv_to_offres(
        candidate_id=1,
        df_cv=df_cv, df_offre=df_offre,
        cv_vectors=cv_vectors, offre_vectors=offre_vectors,
        vectorizer=vectorizer, top_n=5
    )
    print_results(results_cv, mode="cv")

    # Test 2 : Offre → Top 5 candidats
    print("\n🔍 Test : Offre 1 → Top 5 candidats")
    results_offre = match_offre_to_cvs(
        job_id=1,
        df_cv=df_cv, df_offre=df_offre,
        cv_vectors=cv_vectors, offre_vectors=offre_vectors,
        vectorizer=vectorizer, top_n=5
    )
    print_results(results_offre, mode="offre")