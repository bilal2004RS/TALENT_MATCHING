import { useState } from "react";
import {
  Box, Typography, Card, CardContent, Button,
  CircularProgress, Alert, Tabs, Tab,
  LinearProgress, Grid, Divider, Chip
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import WorkIcon        from "@mui/icons-material/Work";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  uploadCV, getTalentScoreCV,
  getOffresFromCV, getOrientationFromCV
} from "../api/client";
import MatchCard  from "../components/MatchCard";
import SkillBadge from "../components/SkillBadge";
import ScoreBar   from "../components/ScoreBar";

export default function CandidatSpace() {
  const [tab, setTab]         = useState(0);
  const [file, setFile]       = useState(null);     // CV file saved
  const [cvFile, setCvFile]   = useState(null);     // CV confirmé après upload
  const [analyse, setAnalyse] = useState(null);
  const [score, setScore]     = useState(null);
  const [offres, setOffres]   = useState([]);
  const [orient, setOrient]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const nom    = localStorage.getItem("nom")    || "Candidat";
  const userId = parseInt(localStorage.getItem("userId")) || 1;

  // ── Tab 0 : Upload + Analyse CV ───────────
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const res = await uploadCV(userId, file);
      setAnalyse(res.data);
      setCvFile(file);      // ← save CV bach ytskhdm f tabs okhra
      // Reset tabs data bach ytrecharge b CV jdid
      setScore(null);
      setOffres([]);
      setOrient([]);
    } catch {
      setError("Erreur lors de l'analyse du CV");
    } finally { setLoading(false); }
  };

  // ── Tab 1 : Talent Score men CV réel ──────
  const handleLoadScore = async () => {
    if (!cvFile) {
      setError("Uploadez votre CV d'abord (Tab Mon CV)");
      setTab(0); return;
    }
    setLoading(true); setError("");
    try {
      const res = await getTalentScoreCV(cvFile);
      setScore(res.data);
    } catch {
      setError("Erreur chargement score");
    } finally { setLoading(false); }
  };

  // ── Tab 2 : Offres men CV réel ─────────────
  const handleLoadOffres = async () => {
    if (!cvFile) {
      setError("Uploadez votre CV d'abord (Tab Mon CV)");
      setTab(0); return;
    }
    setLoading(true); setError("");
    try {
      const res = await getOffresFromCV(cvFile, 5);
      const data = Array.isArray(res.data[0]) ? res.data[0] : res.data;
      setOffres(data);
    } catch {
      setError("Erreur chargement offres");
    } finally { setLoading(false); }
  };

  // ── Tab 3 : Orientation men CV réel ────────
  const handleLoadOrientation = async () => {
    if (!cvFile) {
      setError("Uploadez votre CV d'abord (Tab Mon CV)");
      setTab(0); return;
    }
    setLoading(true); setError("");
    try {
      const res = await getOrientationFromCV(cvFile);
      const data = Array.isArray(res.data[0]) ? res.data[0] : res.data;
      setOrient(data);
    } catch {
      setError("Erreur chargement orientation");
    } finally { setLoading(false); }
  };

  const handleTabChange = (_, v) => {
    setTab(v); setError("");
    if (v === 1 && !score)          handleLoadScore();
    if (v === 2 && !offres.length)  handleLoadOffres();
    if (v === 3 && !orient.length)  handleLoadOrientation();
  };

  return (
    <Box sx={{ p: 4, maxWidth: 950, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ mb: 3, display: "flex",
        justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#0F1E3D">
            👋 Bonjour, {nom}
          </Typography>
          <Typography color="text.secondary">
            Espace Talent — Gérez votre profil et vos opportunités
          </Typography>
        </Box>
        {/* Badge CV uploadé */}
        {cvFile && (
          <Chip
            icon={<CheckCircleIcon />}
            label={`CV: ${cvFile.name}`}
            sx={{ background: "#D1FAE5", color: "#065F46",
              fontWeight: "bold" }}
          />
        )}
      </Box>

      <Tabs value={tab} onChange={handleTabChange}
        sx={{ mb: 3, borderBottom: "2px solid #E2E8F0" }}>
        <Tab label="📄 Mon CV"               />
        <Tab label="🎯 Talent Score"
          disabled={!cvFile}  />
        <Tab label="💼 Offres Recommandées"
          disabled={!cvFile}  />
        <Tab label="🧭 Orientation Carrière"
          disabled={!cvFile}  />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}
          onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── TAB 0 : Upload CV ── */}
      {tab === 0 && (
        <Box>
          <Card sx={{ borderRadius: 3,
            border: `2px dashed ${cvFile ? "#10B981" : "#0D9488"}`,
            background: cvFile ? "#F0FDF4" : "#F0FDF9", mb: 3 }}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <CloudUploadIcon sx={{
                fontSize: 60,
                color: cvFile ? "#10B981" : "#0D9488",
                mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" color="#0F1E3D">
                {cvFile ? "✅ CV Analysé avec succès" : "Uploadez votre CV"}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {cvFile
                  ? "Vous pouvez accéder aux autres onglets ou recharger un nouveau CV"
                  : "Formats acceptés : PDF, DOCX — L'analyse est basée sur vos compétences réelles"}
              </Typography>
              <input type="file" accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: "none" }} id="cv-upload" />
              <label htmlFor="cv-upload">
                <Button variant="outlined" component="span"
                  sx={{ borderColor: "#0D9488", color: "#0D9488", mr: 2 }}>
                  {cvFile ? "Changer de CV" : "Choisir fichier"}
                </Button>
              </label>
              {file && (
                <Button variant="contained" onClick={handleUpload}
                  disabled={loading}
                  sx={{ background: "#0D9488",
                    "&:hover": { background: "#0F766E" } }}>
                  {loading
                    ? <CircularProgress size={20} color="inherit" />
                    : "Analyser mon CV"}
                </Button>
              )}
              {file && (
                <Typography variant="body2"
                  color="text.secondary" sx={{ mt: 1 }}>
                  📎 {file.name}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Résultat analyse */}
          {analyse && (
            <Card sx={{ borderRadius: 3,
              border: "1px solid #D1FAE5" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  ✅ Analyse de votre CV
                </Typography>
                <ScoreBar score={analyse.score_cv * 20} />
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      🎓 Niveau : <strong>{analyse.niveau}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📅 Expérience : <strong>{analyse.annees_experience} ans</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📍 Localisation : <strong>{analyse.localisation}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"
                      color="#10B981" fontWeight="bold">
                      ✅ {analyse.points_forts}
                    </Typography>
                    <Typography variant="body2"
                      color="#F59E0B" fontWeight="bold">
                      ⚠️ {analyse.points_ameliorer}
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2"
                  color="text.secondary" gutterBottom>
                  💻 Compétences détectées ({analyse.competences?.length}) :
                </Typography>
                <Box>
                  {analyse.competences?.map(s =>
                    <SkillBadge key={s} skill={s} type="match" />)}
                </Box>
                {analyse.soft_skills?.length > 0 && (
                  <>
                    <Typography variant="body2"
                      color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                      🤝 Soft Skills :
                    </Typography>
                    <Box>
                      {analyse.soft_skills?.map(s =>
                        <SkillBadge key={s} skill={s} type="bonus" />)}
                    </Box>
                  </>
                )}
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" size="small"
                    onClick={() => { setTab(1); handleLoadScore(); }}
                    sx={{ background: "#0D9488", mr: 1 }}>
                    Voir Talent Score →
                  </Button>
                  <Button variant="outlined" size="small"
                    onClick={() => { setTab(2); handleLoadOffres(); }}
                    sx={{ borderColor: "#0D9488", color: "#0D9488" }}>
                    Voir Offres →
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* ── TAB 1 : Talent Score ── */}
      {tab === 1 && (
        <Box>
          {loading && (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <CircularProgress sx={{ color: "#0D9488" }} />
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Calcul du score basé sur votre CV...
              </Typography>
            </Box>
          )}
          {score && !loading && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3, textAlign: "center",
                  border: "2px solid #0D9488" }}>
                  <CardContent sx={{ py: 3 }}>
                    <Typography variant="h2" fontWeight="bold"
                      color="#0D9488">
                      {score.score_global}%
                    </Typography>
                    <Typography color="text.secondary">Score Global</Typography>
                    {score.percentile && (
                      <Chip label={`Top ${100 - score.percentile}%`}
                        size="small"
                        sx={{ mt: 1, background: "#0D9488",
                          color: "#fff" }} />
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2">
                      🎓 <strong>{score.niveau}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📅 {score.annees_experience} ans d'expérience
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📍 {score.localisation}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card sx={{ borderRadius: 3, height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      📊 Détail de votre profil
                    </Typography>
                    {[
                      { label: "Compétences Techniques",
                        value: score.score_skills },
                      { label: "Expérience",
                        value: score.score_experience },
                      { label: "Niveau",
                        value: score.score_niveau },
                      { label: "Attractivité Marché",
                        value: score.score_marche },
                    ].map((item) => (
                      <Box key={item.label} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: "flex",
                          justifyContent: "space-between" }}>
                          <Typography variant="body2">
                            {item.label}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {item.value}%
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate"
                          value={item.value}
                          sx={{ height: 8, borderRadius: 4,
                            "& .MuiLinearProgress-bar": {
                              background: item.value >= 70 ? "#10B981"
                                : item.value >= 50 ? "#F59E0B" : "#EF4444"
                            }
                          }} />
                      </Box>
                    ))}

                    {/* Skills détectés */}
                    {score.competences?.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body2"
                          color="text.secondary" gutterBottom>
                          💻 Compétences reconnues :
                        </Typography>
                        <Box>
                          {score.competences.map(s =>
                            <SkillBadge key={s} skill={s} type="match" />)}
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      {/* ── TAB 2 : Offres ── */}
      {tab === 2 && (
        <Box>
          {loading && (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <CircularProgress sx={{ color: "#0D9488" }} />
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Recherche des meilleures offres pour votre profil...
              </Typography>
            </Box>
          )}
          {!loading && offres.length === 0 && !error && (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <WorkIcon sx={{ fontSize: 60, color: "#CBD5E1" }} />
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Aucune offre trouvée
              </Typography>
              <Button variant="contained" onClick={handleLoadOffres}
                sx={{ mt: 2, background: "#0D9488" }}>
                Réessayer
              </Button>
            </Box>
          )}
          {!loading && offres.length > 0 && (
            <>
              <Box sx={{ display: "flex",
                justifyContent: "space-between",
                alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  🎯 {offres.length} offres recommandées
                </Typography>
                <Chip
                  label={`Score moyen: ${Math.round(
                    offres.reduce((a, r) =>
                      a + (r.talent_score || 0), 0) / offres.length
                  )}%`}
                  sx={{ background: "#0D9488", color: "#fff" }} />
              </Box>
              {offres.map((r, i) =>
                <MatchCard key={i} result={r} mode="cv" />)}
            </>
          )}
        </Box>
      )}

      {/* ── TAB 3 : Orientation ── */}
      {tab === 3 && (
        <Box>
          {loading && (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <CircularProgress sx={{ color: "#0D9488" }} />
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Analyse de votre orientation carrière...
              </Typography>
            </Box>
          )}
          {!loading && orient.length > 0 && (
            <Grid container spacing={3}>
              {orient.map((item, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Card sx={{
                    borderRadius: 3,
                    border: `2px solid ${
                      item.compatibilite >= 75 ? "#10B981"
                      : item.compatibilite >= 50 ? "#F59E0B" : "#94A3B8"
                    }`,
                    "&:hover": { transform: "translateY(-4px)" },
                    transition: "transform 0.2s"
                  }}>
                    <CardContent sx={{ textAlign: "center", py: 3 }}>
                      <Typography fontSize={40}>{item.icon}</Typography>
                      <Typography variant="h6" fontWeight="bold"
                        color="#0F1E3D">
                        {item.titre}
                      </Typography>
                      <Typography variant="body2"
                        color="text.secondary" sx={{ mb: 2 }}>
                        {item.description}
                      </Typography>
                      <LinearProgress variant="determinate"
                        value={item.compatibilite}
                        sx={{ height: 10, borderRadius: 5, mb: 1,
                          "& .MuiLinearProgress-bar": {
                            background: item.compatibilite >= 75
                              ? "#10B981"
                              : item.compatibilite >= 50
                              ? "#F59E0B" : "#94A3B8"
                          }
                        }} />
                      <Typography fontWeight="bold" sx={{
                        color: item.compatibilite >= 75 ? "#10B981"
                          : item.compatibilite >= 50 ? "#F59E0B" : "#94A3B8"
                      }}>
                        {item.compatibilite}% compatibilité
                      </Typography>
                      <Typography variant="body2"
                        color="text.secondary" sx={{ mt: 1 }}>
                        💰 {item.salaire_moyen?.toLocaleString()} DH/mois
                      </Typography>

                      {/* Skills matches */}
                      {item.skills_matches?.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption"
                            color="#10B981" fontWeight="bold">
                            ✅ Maîtrisés :
                          </Typography>
                          <Box>
                            {item.skills_matches.map(s =>
                              <SkillBadge key={s} skill={s}
                                type="match" />)}
                          </Box>
                        </Box>
                      )}

                      {/* Skills manquants */}
                      {item.skills_manquants?.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption"
                            color="#F59E0B" fontWeight="bold">
                            📚 À acquérir :
                          </Typography>
                          <Box>
                            {item.skills_manquants.map(s =>
                              <SkillBadge key={s} skill={s}
                                type="missing" />)}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
}