import { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import {
  uploadCV, getTalentScoreCV,
  getOffresFromCV, getOrientationFromCV
} from "../api/client";
import axios from "axios";

export default function CandidatSpace() {
  const handleApply = async (offreId) => {
    try {
      const userId = localStorage.getItem("userId"); 
      console.log("USER ID:", userId);
      const res = await axios.post("http://localhost:8080/applications", {
        userId: userId,
        offreId: offreId
      });

      console.log("SUCCESS", res);
      alert("Postulation envoyée ✅");

    } catch (err) {
      console.error("ERROR", err);
      alert("Erreur ❌");
    }
  };

  const [tab, setTab]         = useState("profile");
  const [file, setFile]       = useState(null);
  const [cvFile, setCvFile]   = useState(null);
  const [analyse, setAnalyse] = useState(null);
  const [score, setScore]     = useState(null);
  const [offres, setOffres]   = useState([]);
  const [orient, setOrient]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  const nom    = localStorage.getItem("nom")    || "Candidat";
  const userId = parseInt(localStorage.getItem("userId")) || 1;
  const initials = nom.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:8080/api/candidat/profile/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (data.score_cv) {
        setAnalyse({
          score_cv          : data.score_cv,
          niveau            : data.niveau,
          annees_experience : data.annees_experience,
          localisation      : data.localisation     || "Non spécifiée",
          competences       : data.competences      || [],
          soft_skills       : data.soft_skills      || [],
          points_forts      : data.points_forts     || "",
          points_ameliorer  : data.points_ameliorer || "",
        });
        setProfileLoaded(true);
      }
    })
    .catch(() => {});
  }, [userId]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const res = await uploadCV(userId, file);
      setAnalyse(res.data);
      setCvFile(file);
      setProfileLoaded(true);
      setScore(null); setOffres([]); setOrient([]);
    } catch { setError("Erreur lors de l'analyse du CV"); }
    finally  { setLoading(false); }
  };

  const handleTabChange = async (newTab) => {
    setTab(newTab); setError("");
    if (newTab === "matches" && !offres.length && cvFile) {
      setLoading(true);
      try {
        const res  = await getOffresFromCV(cvFile, 5);
        const data = Array.isArray(res.data[0]) ? res.data[0] : res.data;
        setOffres(data);
      } catch { setError("Erreur chargement offres"); }
      finally  { setLoading(false); }
    }
    if (newTab === "career" && !orient.length && cvFile) {
      setLoading(true);
      try {
        const res  = await getOrientationFromCV(cvFile);
        const data = Array.isArray(res.data[0]) ? res.data[0] : res.data;
        setOrient(data);
      } catch { setError("Erreur chargement orientation"); }
      finally  { setLoading(false); }
    }
    if (newTab === "analytics" && !score && cvFile) {
      setLoading(true);
      try {
        const res = await getTalentScoreCV(cvFile);
        setScore(res.data);
      } catch { setError("Erreur chargement score"); }
      finally  { setLoading(false); }
    }
  };

  const scoreColor = (v) =>
    v >= 70 ? "#16a34a" : v >= 50 ? "#d97706" : "#dc2626";

  const tabs = [
    { key: "profile",   label: "Profil" },
    { key: "matches",   label: "Recommandations" },
    { key: "career",    label: "Orientation carrière" },
    { key: "analytics", label: "Analytics" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .cs2 * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .cs2 { background: #f3f4f6; min-height: 100vh; padding: 32px; }
        .cs2-title { font-size: 1.875rem; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .cs2-sub { color: #6b7280; font-size: 0.875rem; margin: 0 0 24px; }

        /* Tabs */
        .cs2-tabs { display: grid; grid-template-columns: repeat(4, 1fr); background: #fff; border-radius: 8px; padding: 4px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .cs2-tab { padding: 8px 12px; border: none; background: transparent; border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: #6b7280; cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif; }
        .cs2-tab.active { background: #0D9488; color: #fff; font-weight: 600; }
        .cs2-tab:hover:not(.active) { background: #f9fafb; color: #374151; }

        /* Cards */
        .cs2-card { background: #fff; border-radius: 10px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 16px; }
        .cs2-card-title { font-size: 1rem; font-weight: 600; color: #111827; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }

        /* Upload zone */
        .cs2-upload { border: 2px dashed #d1d5db; border-radius: 8px; padding: 48px 24px; text-align: center; cursor: pointer; transition: all 0.2s; background: #fafafa; }
        .cs2-upload:hover { border-color: #0D9488; background: #f0fdf9; }
        .cs2-upload.has-file { border-color: #0D9488; background: #f0fdf9; }

        /* CV uploaded */
        .cs2-cv-uploaded { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin-bottom: 16px; }

        /* Stats grid */
        .cs2-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
        .cs2-stat { padding: 16px; border-radius: 8px; }
        .cs2-stat-label { font-size: 0.75rem; color: #6b7280; margin-bottom: 4px; }
        .cs2-stat-value { font-size: 1.5rem; font-weight: 700; }

        /* Talent score circle */
        .cs2-score-wrap { display: flex; align-items: center; gap: 32px; }
        .cs2-score-circle { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .cs2-score-inner { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .cs2-score-num { font-size: 2rem; font-weight: 700; }

        /* Progress bars */
        .cs2-bar-wrap { margin-bottom: 10px; }
        .cs2-bar-header { display: flex; justify-content: space-between; font-size: 0.825rem; margin-bottom: 4px; }
        .cs2-bar-track { background: #e5e7eb; border-radius: 9999px; height: 8px; }
        .cs2-bar-fill { height: 8px; border-radius: 9999px; transition: width 0.3s; }

        /* Job cards */
        .cs2-job { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; transition: box-shadow 0.15s; background: #fff; }
        .cs2-job:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .cs2-job-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .cs2-job-title { font-size: 1.05rem; font-weight: 600; color: #111827; margin: 0 0 2px; }
        .cs2-job-company { font-size: 0.875rem; color: #6b7280; margin: 0; }
        .cs2-match-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; background: #dbeafe; color: #1d4ed8; border-radius: 9999px; font-size: 0.82rem; font-weight: 600; }
        .cs2-job-meta { display: flex; gap: 16px; font-size: 0.8rem; color: #6b7280; margin-bottom: 10px; }
        .cs2-job-meta span { display: flex; align-items: center; gap: 4px; }
        .cs2-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .cs2-chip { padding: 3px 10px; background: #f3f4f6; border-radius: 9999px; font-size: 0.78rem; color: #374151; }
        .cs2-chip.blue { background: #eff6ff; color: #1d4ed8; }
        .cs2-chip.green { background: #f0fdf4; color: #15803d; }
        .cs2-chip.red { background: #fff7ed; color: #c2410c; }
        .cs2-job-btns { display: flex; gap: 8px; }

        /* Career cards */
        .cs2-career { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
        .cs2-career-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }

        /* Buttons */
        .cs2-btn { padding: 8px 16px; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; font-family: 'Inter', sans-serif; }
        .cs2-btn-primary { background: #0D9488; color: #fff; }
        .cs2-btn-primary:hover { background: #0f766e; }
        .cs2-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .cs2-btn-outline { background: #fff; color: #374151; border: 1px solid #d1d5db; }
        .cs2-btn-outline:hover { background: #f9fafb; }

        /* Analytics */
        .cs2-analytics { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cs2-activity { padding: 16px; border-radius: 8px; }
        .cs2-activity-label { font-size: 0.78rem; color: #6b7280; margin-bottom: 4px; }
        .cs2-activity-num { font-size: 1.875rem; font-weight: 700; }
        .cs2-activity-sub { font-size: 0.75rem; color: #6b7280; margin-top: 4px; }

        @media (max-width: 768px) {
          .cs2 { padding: 16px; }
          .cs2-tabs { grid-template-columns: repeat(2, 1fr); }
          .cs2-score-wrap { flex-direction: column; }
          .cs2-stats { grid-template-columns: 1fr; }
          .cs2-analytics { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cs2">
        <h1 className="cs2-title">Espace Candidat</h1>
        <p className="cs2-sub">Gérez votre profil et découvrez des opportunités</p>

        {/* Tabs */}
        <div className="cs2-tabs">
          {tabs.map(t => (
            <button key={t.key}
              className={`cs2-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => handleTabChange(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 8, padding: "12px 16px", marginBottom: 16,
            color: "#dc2626", fontSize: "0.875rem" }}>
            {error}
            <button onClick={() => setError("")}
              style={{ float: "right", background: "none", border: "none",
                cursor: "pointer", color: "#dc2626" }}>×</button>
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <>
            {/* CV Upload */}
            <div className="cs2-card">
              <h3 className="cs2-card-title">
                <svg width="20" height="20" fill="none" stroke="currentColor"
                  strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Mon CV
              </h3>

              {!analyse ? (
                <>
                  <div className={`cs2-upload ${file ? "has-file" : ""}`}
                    onClick={() => document.getElementById("cv-up").click()}>
                    <svg width="48" height="48" fill="none" stroke="#9ca3af"
                      strokeWidth="1.5" viewBox="0 0 24 24"
                      style={{ margin: "0 auto 16px" }}>
                      <polyline points="16 16 12 12 8 16"/>
                      <line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                    </svg>
                    <p style={{ fontSize: "1rem", fontWeight: 500,
                      color: "#111827", marginBottom: 6 }}>
                      {file ? file.name : "Glissez-déposez votre CV ou cliquez pour télécharger"}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "#9ca3af",
                      marginBottom: 16 }}>
                      PDF, DOCX (max 5MB)
                    </p>
                    <button className="cs2-btn cs2-btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (file) handleUpload();
                        else document.getElementById("cv-up").click();
                      }}
                      disabled={loading}>
                      {loading
                        ? <CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />
                        : null}
                      {file ? "Analyser mon CV" : "Télécharger mon CV"}
                    </button>
                  </div>
                  <input id="cv-up" type="file" accept=".pdf,.docx"
                    style={{ display: "none" }}
                    onChange={(e) => setFile(e.target.files[0])} />
                </>
              ) : (
                <>
                  <div className="cs2-cv-uploaded">
                    <div style={{ display: "flex", alignItems: "center",
                      gap: 12 }}>
                      <svg width="32" height="32" fill="none"
                        stroke="#16a34a" strokeWidth="2"
                        viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div>
                        <p style={{ fontWeight: 600, margin: 0,
                          fontSize: "0.9rem" }}>
                          {cvFile?.name || "CV analysé"}
                        </p>
                        <p style={{ fontSize: "0.78rem", color: "#6b7280",
                          margin: 0 }}>
                          Analysé — {new Date().toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <label htmlFor="cv-up2">
                      <button className="cs2-btn cs2-btn-outline"
                        onClick={() => document.getElementById("cv-up2").click()}>
                        Modifier
                      </button>
                    </label>
                    <input id="cv-up2" type="file" accept=".pdf,.docx"
                      style={{ display: "none" }}
                      onChange={(e) => { setFile(e.target.files[0]); setCvFile(null); setAnalyse(null); }} />
                  </div>

                  <div className="cs2-stats">
                    <div className="cs2-stat" style={{ background: "#eff6ff" }}>
                      <p className="cs2-stat-label">Compétences détectées</p>
                      <p className="cs2-stat-value" style={{ color: "#2563eb" }}>
                        {analyse.competences?.length || 0}
                      </p>
                    </div>
                    <div className="cs2-stat" style={{ background: "#f5f3ff" }}>
                      <p className="cs2-stat-label">Expérience totale</p>
                      <p className="cs2-stat-value" style={{ color: "#7c3aed" }}>
                        {analyse.annees_experience} ans
                      </p>
                    </div>
                    <div className="cs2-stat" style={{ background: "#f0fdf4" }}>
                      <p className="cs2-stat-label">Niveau</p>
                      <p className="cs2-stat-value" style={{ color: "#15803d" }}>
                        {analyse.niveau}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Talent Score preview */}
            {analyse && (
              <div className="cs2-card">
                <h3 className="cs2-card-title">
                  <svg width="20" height="20" fill="none" stroke="currentColor"
                    strokeWidth="2" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  Aperçu du profil
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6,
                  marginBottom: 12 }}>
                  {analyse.competences?.slice(0,8).map(s => (
                    <span key={s} className="cs2-chip blue">{s}</span>
                  ))}
                  {analyse.competences?.length > 8 && (
                    <span className="cs2-chip">
                      +{analyse.competences.length - 8}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.8rem", color: "#15803d",
                    background: "#f0fdf4", padding: "2px 10px",
                    borderRadius: 20, fontWeight: 500 }}>
                    {analyse.points_forts}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#92400e",
                    background: "#fffbeb", padding: "2px 10px",
                    borderRadius: 20, fontWeight: 500 }}>
                    {analyse.points_ameliorer}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── RECOMMENDATIONS ── */}
        {tab === "matches" && (
          <div className="cs2-card">
            <h3 className="cs2-card-title">
              Offres recommandées pour vous
            </h3>
            {loading ? (
              <div style={{ textAlign: "center", padding: "32px" }}>
                <CircularProgress sx={{ color: "#0D9488" }} />
              </div>
            ) : !cvFile ? (
              <p style={{ color: "#9ca3af", textAlign: "center",
                padding: "32px", fontSize: "0.875rem" }}>
                Uploadez votre CV pour voir les recommandations
              </p>
            ) : offres.length === 0 ? (
              <p style={{ color: "#9ca3af", textAlign: "center",
                padding: "32px", fontSize: "0.875rem" }}>
                Aucune offre trouvée
              </p>
            ) : (
              <div>
                {offres.map((job, i) => (
                  <div key={i} className="cs2-job">
                    <div className="cs2-job-header">
                      <div>
                        <p className="cs2-job-title">
                          {job.titre_poste}
                        </p>
                        <p className="cs2-job-company">{job.secteur}</p>
                      </div>
                      <div className="cs2-match-badge">
                        <svg width="14" height="14" fill="none"
                          stroke="currentColor" strokeWidth="2"
                          viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="22" y1="12" x2="18" y2="12"/>
                          <line x1="6" y1="12" x2="2" y2="12"/>
                          <line x1="12" y1="6" x2="12" y2="2"/>
                          <line x1="12" y1="22" x2="12" y2="18"/>
                        </svg>
                        {Math.round(job.talent_score)}% match
                      </div>
                    </div>
                    <div className="cs2-job-meta">
                      <span>
                        <svg width="14" height="14" fill="none"
                          stroke="currentColor" strokeWidth="2"
                          viewBox="0 0 24 24">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {job.localisation}
                      </span>
                      <span>
                        <svg width="14" height="14" fill="none"
                          stroke="currentColor" strokeWidth="2"
                          viewBox="0 0 24 24">
                          <rect x="2" y="7" width="20" height="14"
                            rx="2" ry="2"/>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                        {job.niveau_requis}
                      </span>
                      <span>
                        {job.salaire_estime?.toLocaleString()} DH/mois
                      </span>
                    </div>
                    {job.skills_matches?.length > 0 && (
                      <div className="cs2-chips">
                        {job.skills_matches.slice(0,4).map(s => (
                          <span key={s} className="cs2-chip">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="cs2-job-btns">
                      <button 
                        className="cs2-btn cs2-btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => handleApply(job.job_id)}
                      >
                        postuler
                      </button>
                      <button className="cs2-btn cs2-btn-outline">
                        Plus de détails
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CAREER ── */}
        {tab === "career" && (
          <div className="cs2-card">
            <h3 className="cs2-card-title">
              <svg width="20" height="20" fill="none" stroke="currentColor"
                strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
              Parcours de carrière suggérés
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#6b7280",
              marginBottom: 20 }}>
              Basé sur votre profil et les tendances du marché
            </p>
            {loading ? (
              <div style={{ textAlign: "center", padding: "32px" }}>
                <CircularProgress sx={{ color: "#0D9488" }} />
              </div>
            ) : !cvFile ? (
              <p style={{ color: "#9ca3af", textAlign: "center",
                padding: "32px", fontSize: "0.875rem" }}>
                Uploadez votre CV pour voir votre orientation
              </p>
            ) : orient.map((item, i) => (
              <div key={i} className="cs2-career">
                <div className="cs2-career-header">
                  <div style={{ display: "flex", alignItems: "center",
                    gap: 10 }}>
                    <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "1rem",
                        margin: 0, color: "#111827" }}>
                        {item.titre}
                      </p>
                      <p style={{ fontSize: "0.78rem", color: "#6b7280",
                        margin: 0 }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.75rem", color: "#6b7280",
                      margin: "0 0 2px" }}>
                      Compatibilité
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700,
                      color: scoreColor(item.compatibilite), margin: 0 }}>
                      {item.compatibilite}%
                    </p>
                  </div>
                </div>

                <div className="cs2-bar-track" style={{ marginBottom: 12 }}>
                  <div className="cs2-bar-fill" style={{
                    width: `${item.compatibilite}%`,
                    background: scoreColor(item.compatibilite)
                  }} />
                </div>

                <p style={{ fontSize: "0.82rem", fontWeight: 600,
                  color: "#0D9488", marginBottom: 8 }}>
                  {item.salaire_moyen?.toLocaleString()} DH / mois
                </p>

                {item.skills_matches?.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <p style={{ fontSize: "0.78rem", fontWeight: 600,
                      marginBottom: 4, color: "#374151" }}>
                      Compétences maitrisées :
                    </p>
                    <div className="cs2-chips">
                      {item.skills_matches.map(s => (
                        <span key={s} className="cs2-chip green">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {item.skills_manquants?.length > 0 && (
                  <div>
                    <p style={{ fontSize: "0.78rem", fontWeight: 600,
                      marginBottom: 4, color: "#374151" }}>
                      A acquérir :
                    </p>
                    <div className="cs2-chips">
                      {item.skills_manquants.map(s => (
                        <span key={s} className="cs2-chip red">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === "analytics" && (
          <div className="cs2-analytics">
            {/* Skills */}
            <div className="cs2-card" style={{ margin: 0 }}>
              <h3 className="cs2-card-title">Profil de compétences</h3>
              {loading ? (
                <div style={{ textAlign: "center", padding: "24px" }}>
                  <CircularProgress sx={{ color: "#0D9488" }} size={32} />
                </div>
              ) : score ? (
                <div>
                  {[
                    { label: "Compétences techniques",
                      value: score.score_skills, color: "#3b82f6" },
                    { label: "Expérience professionnelle",
                      value: score.score_experience, color: "#10b981" },
                    { label: "Niveau",
                      value: score.score_niveau, color: "#8b5cf6" },
                    { label: "Attractivité marché",
                      value: score.score_marche, color: "#f59e0b" },
                  ].map((item) => (
                    <div key={item.label} className="cs2-bar-wrap">
                      <div className="cs2-bar-header">
                        <span style={{ color: "#374151" }}>{item.label}</span>
                        <span style={{ fontWeight: 600 }}>{item.value}%</span>
                      </div>
                      <div className="cs2-bar-track">
                        <div className="cs2-bar-fill" style={{
                          width: `${item.value}%`,
                          background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`
                        }} />
                      </div>
                    </div>
                  ))}

                  {/* Score global */}
                  <div style={{ marginTop: 16, padding: "12px 16px",
                    background: "#f0fdf9", borderRadius: 8,
                    textAlign: "center" }}>
                    <p style={{ fontSize: "0.78rem", color: "#6b7280",
                      margin: "0 0 4px" }}>
                      Score global
                    </p>
                    <p style={{ fontSize: "2rem", fontWeight: 800,
                      color: "#0D9488", margin: 0 }}>
                      {score.score_global}
                      <span style={{ fontSize: "1rem",
                        color: "#9ca3af" }}>/100</span>
                    </p>
                    {score.percentile && (
                      <p style={{ fontSize: "0.78rem",
                        color: "#0D9488", margin: "4px 0 0",
                        fontWeight: 600 }}>
                        Meilleur que {score.percentile}% des candidats
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ color: "#9ca3af", textAlign: "center",
                  padding: "24px", fontSize: "0.875rem" }}>
                  Uploadez votre CV pour voir l'analyse
                </p>
              )}
            </div>

            {/* Activity */}
            <div className="cs2-card" style={{ margin: 0 }}>
              <h3 className="cs2-card-title">Informations du profil</h3>
              {analyse ? (
                <div style={{ display: "flex", flexDirection: "column",
                  gap: 12 }}>
                  <div className="cs2-activity"
                    style={{ background: "#eff6ff" }}>
                    <p className="cs2-activity-label">Compétences détectées</p>
                    <p className="cs2-activity-num"
                      style={{ color: "#2563eb" }}>
                      {analyse.competences?.length || 0}
                    </p>
                    <p className="cs2-activity-sub">
                      {analyse.competences?.slice(0,3).join(", ")}...
                    </p>
                  </div>
                  <div className="cs2-activity"
                    style={{ background: "#f0fdf4" }}>
                    <p className="cs2-activity-label">Expérience</p>
                    <p className="cs2-activity-num"
                      style={{ color: "#16a34a" }}>
                      {analyse.annees_experience} ans
                    </p>
                    <p className="cs2-activity-sub">
                      Niveau: {analyse.niveau}
                    </p>
                  </div>
                  <div className="cs2-activity"
                    style={{ background: "#f5f3ff" }}>
                    <p className="cs2-activity-label">Localisation</p>
                    <p className="cs2-activity-num"
                      style={{ color: "#7c3aed", fontSize: "1.2rem" }}>
                      {analyse.localisation}
                    </p>
                    <p className="cs2-activity-sub">
                      {analyse.points_forts}
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ color: "#9ca3af", textAlign: "center",
                  padding: "24px", fontSize: "0.875rem" }}>
                  Uploadez votre CV pour voir vos informations
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}