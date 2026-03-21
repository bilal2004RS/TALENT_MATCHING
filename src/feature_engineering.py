import pandas as pd
import numpy as np
import ast
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
import pickle
import os

PROCESSED_PATH = "data/processed/"
MODELS_PATH    = "models/"

# ─────────────────────────────────────────
# 1. NETTOYAGE DES COLONNES SKILLS
# ─────────────────────────────────────────

def clean_skills_column(series):
    """
    Convertit une colonne skills en liste propre.
    Gère les formats: "['Python','SQL']" ou "Python, SQL"
    """
    def parse_skill(val):
        val = str(val).strip()
        # Format liste Python stringifiée
        try:
            parsed = ast.literal_eval(val)
            if isinstance(parsed, list):
                return [s.strip().lower() for s in parsed]
        except:
            pass
        # Format string séparé par virgule
        return [s.strip().lower() for s in val.split(",")]

    return series.apply(parse_skill)


def skills_to_text(skills_list):
    """Convertit une liste de skills en texte pour TF-IDF"""
    if isinstance(skills_list, list):
        return " ".join(skills_list)
    return str(skills_list)


# ─────────────────────────────────────────
# 2. FEATURE ENGINEERING — CV
# ─────────────────────────────────────────

def engineer_cv_features(df_cv, df_marche):
    print("⚙️  Feature Engineering — CVs...")
    df = df_cv.copy()

    # Nettoyer skills
    df["competences_list"]  = clean_skills_column(df["competences_techniques"])
    df["soft_skills_list"]  = clean_skills_column(df["soft_skills"])
    df["all_skills_text"]   = df["competences_list"].apply(skills_to_text)

    # Encoder niveau_experience
    level_map = {"Junior": 0, "Confirmé": 1, "Senior": 2, "Expert": 3}
    df["niveau_encode"] = df["niveau_experience"].map(level_map).fillna(0).astype(int)

    # Normaliser annees_experience et score_cv
    scaler = MinMaxScaler()
    df[["exp_norm", "score_norm"]] = scaler.fit_transform(
        df[["annees_experience", "score_cv"]]
    )

    # Enrichir avec la demande marché moyenne de ses skills
    skill_demand = df_marche.set_index("skill")["demande_marche_%"].to_dict()
    df["market_score"] = df["competences_list"].apply(
        lambda skills: np.mean([skill_demand.get(s, 50) for s in skills])
    )

    print(f"  ✅ {df.shape[0]} CVs traités — {df.shape[1]} features")
    return df


# ─────────────────────────────────────────
# 3. FEATURE ENGINEERING — OFFRES
# ─────────────────────────────────────────

def engineer_offre_features(df_offre, df_marche):
    print("⚙️  Feature Engineering — Offres...")
    df = df_offre.copy()

    # Nettoyer compétences requises
    df["competences_list"]   = clean_skills_column(df["competences_requises"])
    df["competences_text"]   = df["competences_list"].apply(skills_to_text)

    # Encoder niveau requis
    level_map = {"Junior": 0, "Confirmé": 1, "Senior": 2, "Expert": 3}
    df["niveau_encode"] = df["niveau_requis"].map(level_map).fillna(0).astype(int)

    # Normaliser salaire
    scaler = MinMaxScaler()
    df[["salaire_norm"]] = scaler.fit_transform(df[["salaire_estime"]])

    # Market demand pour les compétences de l'offre
    skill_demand = df_marche.set_index("skill")["demande_marche_%"].to_dict()
    df["market_score"] = df["competences_list"].apply(
        lambda skills: np.mean([skill_demand.get(s, 50) for s in skills])
    )

    print(f"  ✅ {df.shape[0]} Offres traitées — {df.shape[1]} features")
    return df


# ─────────────────────────────────────────
# 4. VECTORISATION TF-IDF (baseline)
# ─────────────────────────────────────────

def vectorize_tfidf(df_cv, df_offre):
    print("📐 Vectorisation TF-IDF...")

    # Combiner les deux corpus pour fitter le vectorizer
    corpus_cv    = df_cv["all_skills_text"].tolist()
    corpus_offre = df_offre["competences_text"].tolist()
    corpus_total = corpus_cv + corpus_offre

    vectorizer = TfidfVectorizer(
        max_features=500,
        ngram_range=(1, 2),   # unigrams + bigrams
        min_df=5,
        max_df=0.95
    )
    vectorizer.fit(corpus_total)

    # Transformer CV et offres séparément
    cv_vectors    = vectorizer.transform(corpus_cv)
    offre_vectors = vectorizer.transform(corpus_offre)

    print(f"  ✅ Vecteurs CV    : {cv_vectors.shape}")
    print(f"  ✅ Vecteurs Offre : {offre_vectors.shape}")

    # Sauvegarder le vectorizer
    os.makedirs(MODELS_PATH, exist_ok=True)
    with open(MODELS_PATH + "tfidf_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    print("  💾 Vectorizer sauvegardé → models/tfidf_vectorizer.pkl")

    return cv_vectors, offre_vectors, vectorizer


# ─────────────────────────────────────────
# 5. MAIN
# ─────────────────────────────────────────

if __name__ == "__main__":
    # Charger les données processées
    df_cv     = pd.read_csv(PROCESSED_PATH + "cv_clean.csv")
    df_offre  = pd.read_csv(PROCESSED_PATH + "offre_clean.csv")
    df_marche = pd.read_csv(PROCESSED_PATH + "marche_clean.csv")

    # Feature engineering
    df_cv_feat    = engineer_cv_features(df_cv, df_marche)
    df_offre_feat = engineer_offre_features(df_offre, df_marche)

    # Vectorisation TF-IDF
    cv_vectors, offre_vectors, vectorizer = vectorize_tfidf(df_cv_feat, df_offre_feat)

    # Sauvegarder les features enrichies
    df_cv_feat.to_csv(PROCESSED_PATH + "cv_features.csv", index=False)
    df_offre_feat.to_csv(PROCESSED_PATH + "offre_features.csv", index=False)

    print("\n✅ Étape 2 terminée — Features prêtes pour le Matching !")
    print("   → data/processed/cv_features.csv")
    print("   → data/processed/offre_features.csv")
    print("   → models/tfidf_vectorizer.pkl")