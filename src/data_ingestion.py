import pandas as pd
import numpy as np
import os

RAW_PATH = "data/raw/"
PROCESSED_PATH = "data/processed/"

def load_datasets():
    print("📂 Chargement des datasets...")

    df_cv     = pd.read_csv(RAW_PATH + "dataset_cv.csv")
    df_offre  = pd.read_csv(RAW_PATH + "dataset_offres.csv")
    df_marche = pd.read_csv(RAW_PATH + "dataset_marche.csv")

    print(f"✅ CVs     : {df_cv.shape}")
    print(f"✅ Offres  : {df_offre.shape}")
    print(f"✅ Marché  : {df_marche.shape}")

    return df_cv, df_offre, df_marche


def check_quality(df, name):
    print(f"\n🔍 Qualité — {name}")
    print(f"  Doublons    : {df.duplicated().sum()}")
    print(f"  Valeurs null:\n{df.isnull().sum()}")


def anonymize_cv(df_cv):
    """Supprimer les données sensibles (RGPD)"""
    df = df_cv.copy()
    df.drop(columns=["nom"], inplace=True)
    # Garder l'âge comme feature numérique seulement
    return df


def save_processed(df_cv, df_offre, df_marche):
    os.makedirs(PROCESSED_PATH, exist_ok=True)
    df_cv.to_csv(PROCESSED_PATH + "cv_clean.csv", index=False)
    df_offre.to_csv(PROCESSED_PATH + "offre_clean.csv", index=False)
    df_marche.to_csv(PROCESSED_PATH + "marche_clean.csv", index=False)
    print("\n💾 Datasets sauvegardés dans data/processed/")


if __name__ == "__main__":
    df_cv, df_offre, df_marche = load_datasets()

    check_quality(df_cv, "CV")
    check_quality(df_offre, "Offres")
    check_quality(df_marche, "Marché")

    df_cv_clean = anonymize_cv(df_cv)
    save_processed(df_cv_clean, df_offre, df_marche)