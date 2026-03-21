import pandas as pd
import numpy as np
import ast
import pickle
import os
from collections import Counter
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import matplotlib.pyplot as plt
import seaborn as sns

PROCESSED_PATH = "data/processed/"
MODELS_PATH    = "models/"
REPORTS_PATH   = "reports/"

os.makedirs(REPORTS_PATH, exist_ok=True)


# ─────────────────────────────────────────
# UTILS
# ─────────────────────────────────────────

def parse_skills(val):
    try:
        parsed = ast.literal_eval(str(val))
        if isinstance(parsed, list):
            return [s.strip().lower() for s in parsed]
    except:
        pass
    return [s.strip().lower() for s in str(val).split(",")]


# ─────────────────────────────────────────
# 1. CARTOGRAPHIE DES COMPÉTENCES
# ─────────────────────────────────────────

def cartographie_competences(df_cv):
    """
    Analyse la distribution des compétences
    disponibles dans l'entreprise/pool candidats
    """
    print("🗺️  Cartographie des compétences...")

    all_skills = []
    for val in df_cv["competences_techniques"]:
        all_skills.extend(parse_skills(val))

    skill_counts = Counter(all_skills)
    df_skills = pd.DataFrame(
        skill_counts.items(),
        columns=["skill", "count"]
    ).sort_values("count", ascending=False)

    df_skills["pourcentage"] = (
        df_skills["count"] / len(df_cv) * 100
    ).round(2)

    # Top 20 visualisation
    plt.figure(figsize=(12, 6))
    top20 = df_skills.head(20)
    sns.barplot(
    data=top20,
    x="count",
    y="skill",
    hue="skill",
    palette="Blues",
    legend=False
)
    plt.title("Top 20 Compétences — Pool Candidats", fontsize=14)
    plt.xlabel("Nombre de candidats")
    plt.tight_layout()
    plt.savefig(REPORTS_PATH + "cartographie_skills.png", dpi=150)
    plt.close()

    print(f"  ✅ {len(df_skills)} skills uniques détectés")
    print(f"  💾 Graphe → reports/cartographie_skills.png")
    return df_skills


# ─────────────────────────────────────────
# 2. SKILL GAP ANALYSIS
# ─────────────────────────────────────────

def skill_gap_analysis(df_cv, df_offre, df_marche):
    """
    Compare les skills disponibles (CVs)
    vs skills demandés (offres + marché)
    """
    print("\n📉 Skill Gap Analysis...")

    # Skills disponibles dans les CVs
    skills_dispo = Counter()
    for val in df_cv["competences_techniques"]:
        skills_dispo.update(parse_skills(val))

    # Skills demandés dans les offres
    skills_demandes = Counter()
    for val in df_offre["competences_requises"]:
        skills_demandes.update(parse_skills(val))

    # Construire le dataframe comparatif
    all_skills = set(skills_dispo.keys()) | set(skills_demandes.keys())
    total_cv    = len(df_cv)
    total_offre = len(df_offre)

    rows = []
    for skill in all_skills:
        dispo   = skills_dispo.get(skill, 0) / total_cv * 100
        demande = skills_demandes.get(skill, 0) / total_offre * 100
        gap     = demande - dispo  # positif = pénurie, négatif = surplus

        # Enrichir avec données marché
        marche_row = df_marche[df_marche["skill"] == skill]
        tendance   = marche_row["tendance"].values[0] if len(marche_row) > 0 else "inconnue"
        croissance = marche_row["croissance_annuelle_%"].values[0] if len(marche_row) > 0 else 0

        rows.append({
            "skill"           : skill,
            "dispo_%"         : round(dispo, 2),
            "demande_%"       : round(demande, 2),
            "gap_%"           : round(gap, 2),
            "tendance_marche" : tendance,
            "croissance_%"    : croissance,
        })

    df_gap = pd.DataFrame(rows).sort_values("gap_%", ascending=False)

    # Catégoriser
    df_gap["statut"] = df_gap["gap_%"].apply(
        lambda g: "🔴 Pénurie" if g > 10
             else ("🟢 Surplus" if g < -10
             else "🟡 Équilibré")
    )

    # Visualisation
    top_gap = df_gap[df_gap["gap_%"] > 0].head(15)
    plt.figure(figsize=(12, 6))
    sns.barplot(data=top_gap, x="gap_%", y="skill", palette="Reds_r")
    plt.title("Top 15 Skills en Pénurie (Demande > Disponibilité)", fontsize=14)
    plt.xlabel("Gap (%)")
    plt.tight_layout()
    plt.savefig(REPORTS_PATH + "skill_gap.png", dpi=150)
    plt.close()

    penuries = df_gap[df_gap["statut"] == "🔴 Pénurie"]
    print(f"  ✅ {len(penuries)} skills en pénurie détectés")
    print(f"  💾 Graphe → reports/skill_gap.png")
    return df_gap


# ─────────────────────────────────────────
# 3. ANALYSE MARCHÉ — SKILLS TENDANCE
# ─────────────────────────────────────────

def analyse_marche(df_marche):
    """
    Identifie les skills les plus porteurs
    selon la demande marché et croissance
    """
    print("\n📈 Analyse Marché...")

    df = df_marche.copy()

    # Score opportunité = demande * croissance normalisée
    df["score_opportunite"] = (
        df["demande_marche_%"] * 0.6 +
        df["croissance_annuelle_%"] * 0.4 * 4  # pondération croissance
    ).round(2)

    df_sorted = df.sort_values("score_opportunite", ascending=False)

    # Top skills à recommander pour formation
    top_skills = df_sorted.head(10)[
        ["skill", "demande_marche_%", "croissance_annuelle_%",
         "salaire_moyen", "tendance", "score_opportunite"]
    ]

    print("\n  🌟 Top 10 Skills à fort potentiel :")
    print(top_skills.to_string(index=False))

    # Visualisation
    plt.figure(figsize=(10, 6))
    sns.scatterplot(
        data=df.head(50),
        x="demande_marche_%",
        y="croissance_annuelle_%",
        size="salaire_moyen",
        hue="tendance",
        sizes=(50, 400),
        alpha=0.7
    )
    plt.title("Positionnement des Skills (Demande vs Croissance)", fontsize=13)
    plt.xlabel("Demande Marché (%)")
    plt.ylabel("Croissance Annuelle (%)")
    plt.tight_layout()
    plt.savefig(REPORTS_PATH + "marche_skills.png", dpi=150)
    plt.close()

    print(f"  💾 Graphe → reports/marche_skills.png")
    return df_sorted


# ─────────────────────────────────────────
# 4. PRÉDICTION TURNOVER (Random Forest)
# ─────────────────────────────────────────

def predict_turnover(df_cv):
    """
    Modèle de prédiction du risque de départ
    Features : age, exp, score_cv, niveau, nb_skills
    Target   : turnover simulé (à remplacer par vraies données RH)
    """
    print("\n🔮 Prédiction Turnover...")

    df = df_cv.copy()

    # Nombre de skills comme feature
    df["nb_skills"] = df["competences_techniques"].apply(
        lambda x: len(parse_skills(x))
    )

    # ⚠️ Target simulé — à remplacer par vraie colonne RH
    # Logique : jeune + peu exp + score faible = risque élevé
    np.random.seed(42)
    df["turnover_risk"] = (
        (df["age"] < 28).astype(int) * 0.3 +
        (df["annees_experience"] < 2).astype(int) * 0.4 +
        (df["score_cv"] < 3.0).astype(int) * 0.3 +
        np.random.normal(0, 0.1, len(df))
    )
    df["turnover"] = (df["turnover_risk"] > 0.5).astype(int)

    # Features et target
    features = ["age", "annees_experience", "score_cv",
                "niveau_encode", "nb_skills", "exp_norm", "score_norm"]

    # Garder seulement les colonnes disponibles
    features = [f for f in features if f in df.columns]
    X = df[features].fillna(0)
    y = df["turnover"]

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Entraîner Random Forest
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Évaluation
    y_pred = model.predict(X_test)
    print("\n  📊 Rapport de classification :")
    print(classification_report(y_test, y_pred,
          target_names=["Rester", "Partir"]))

    # Feature importance
    importances = pd.DataFrame({
        "feature"   : features,
        "importance": model.feature_importances_
    }).sort_values("importance", ascending=False)

    plt.figure(figsize=(8, 5))
    sns.barplot(data=importances, x="importance", y="feature", palette="Blues_r")
    plt.title("Feature Importance — Prédiction Turnover", fontsize=13)
    plt.tight_layout()
    plt.savefig(REPORTS_PATH + "turnover_importance.png", dpi=150)
    plt.close()

    # Sauvegarder modèle
    with open(MODELS_PATH + "turnover_model.pkl", "wb") as f:
        pickle.dump(model, f)

    print(f"  💾 Modèle → models/turnover_model.pkl")
    print(f"  💾 Graphe → reports/turnover_importance.png")
    return model, importances


# ─────────────────────────────────────────
# 5. RAPPORT FINAL
# ─────────────────────────────────────────

def generate_report(df_skills, df_gap, df_marche_sorted):
    print("\n📄 Génération du rapport...")

    report = []
    report.append("=" * 55)
    report.append("   RAPPORT WORKFORCE ANALYTICS")
    report.append("=" * 55)

    report.append(f"\n📌 Pool total skills uniques : {len(df_skills)}")
    report.append(f"📌 Top 5 skills disponibles :")
    for _, r in df_skills.head(5).iterrows():
        report.append(f"   • {r['skill']} ({r['pourcentage']}% des candidats)")

    penuries = df_gap[df_gap["statut"] == "🔴 Pénurie"].head(5)
    report.append(f"\n🔴 Top 5 skills en pénurie :")
    for _, r in penuries.iterrows():
        report.append(f"   • {r['skill']} (gap: +{r['gap_%']}%)")

    top_marche = df_marche_sorted.head(5)
    report.append(f"\n🌟 Top 5 skills à recommander (formation) :")
    for _, r in top_marche.iterrows():
        report.append(f"   • {r['skill']} — score opportunité: {r['score_opportunite']}")

    report.append("\n" + "=" * 55)
    report_text = "\n".join(report)

    with open(REPORTS_PATH + "workforce_report.txt", "w", encoding="utf-8") as f:
        f.write(report_text)

    print(report_text)
    print(f"\n  💾 Rapport → reports/workforce_report.txt")


# ─────────────────────────────────────────
# 6. MAIN
# ─────────────────────────────────────────

if __name__ == "__main__":
    df_cv     = pd.read_csv(PROCESSED_PATH + "cv_features.csv")
    df_offre  = pd.read_csv(PROCESSED_PATH + "offre_features.csv")
    df_marche = pd.read_csv(PROCESSED_PATH + "marche_clean.csv")

    df_skills       = cartographie_competences(df_cv)
    df_gap          = skill_gap_analysis(df_cv, df_offre, df_marche)
    df_marche_sorted = analyse_marche(df_marche)
    model, importance = predict_turnover(df_cv)

    generate_report(df_skills, df_gap, df_marche_sorted)

    print("\n✅ Étape 4 terminée!")
    print("   → reports/cartographie_skills.png")
    print("   → reports/skill_gap.png")
    print("   → reports/marche_skills.png")
    print("   → reports/turnover_importance.png")
    print("   → reports/workforce_report.txt")
    print("   → models/turnover_model.pkl")