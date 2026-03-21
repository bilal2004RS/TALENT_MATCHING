import pandas as pd
import pickle
import os

# src/api/core/state.py
# __file__ = talent_matching/src/api/core/state.py
# dirname x1 = talent_matching/src/api/core/
# dirname x2 = talent_matching/src/api/
# dirname x3 = talent_matching/src/
# dirname x4 = talent_matching/        ← c'est ça qu'on veut

BASE_DIR = os.path.dirname(   # talent_matching/
               os.path.dirname(   # src/
                   os.path.dirname(   # api/
                       os.path.dirname(   # core/
                           os.path.abspath(__file__)
                       )
                   )
               )
           )

PROCESSED_PATH = os.path.join(BASE_DIR, "data", "processed") + os.sep
MODELS_PATH    = os.path.join(BASE_DIR, "models") + os.sep

class AppState:
    df_cv         = None
    df_offre      = None
    df_marche     = None
    cv_vectors    = None
    offre_vectors = None
    vectorizer    = None

app_state = AppState()

def load_all():
    print("⏳ Chargement des données en mémoire...")
    print(f"  📁 Base dir  : {BASE_DIR}")
    print(f"  📁 Processed : {PROCESSED_PATH}")

    app_state.df_cv     = pd.read_csv(PROCESSED_PATH + "cv_features.csv")
    app_state.df_offre  = pd.read_csv(PROCESSED_PATH + "offre_features.csv")
    app_state.df_marche = pd.read_csv(PROCESSED_PATH + "marche_clean.csv")

    with open(MODELS_PATH + "tfidf_vectorizer.pkl", "rb") as f:
        app_state.vectorizer = pickle.load(f)

    app_state.cv_vectors = app_state.vectorizer.transform(
        app_state.df_cv["all_skills_text"].fillna("")
    )
    app_state.offre_vectors = app_state.vectorizer.transform(
        app_state.df_offre["competences_text"].fillna("")
    )

    print(f"  ✅ CVs      : {len(app_state.df_cv)}")
    print(f"  ✅ Offres   : {len(app_state.df_offre)}")
    print("✅ Données chargées!")