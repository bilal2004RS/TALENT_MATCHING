import { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Button, Grid,
  Card, CardContent, CircularProgress, Alert,
  Tabs, Tab, Chip, InputAdornment,
  Table, TableBody, TableCell,
  TableHead, TableRow, MenuItem
} from "@mui/material";
import SearchIcon     from "@mui/icons-material/Search";
import AddCircleIcon  from "@mui/icons-material/AddCircle";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  matchOffreToCVs, semanticSearch,
  publierOffre, getDashboardStats
} from "../api/client";
import MatchCard from "../components/MatchCard";

export default function Dashboard() {
  const [tab, setTab]         = useState(0);
  const [stats, setStats]     = useState(null);
  const [jobId, setJobId]     = useState("");
  const [query, setQuery]     = useState("");
  const [filtre, setFiltre]   = useState({ niveau: "", localisation: "" });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const [offre, setOffre] = useState({
    titrePoste: "", secteur: "", localisation: "",
    niveaurequis: "", competencesRequises: "",
    salaireEstime: "", description: ""
  });

  const nom = localStorage.getItem("nom") || "Recruteur";

  // Charger stats au démarrage
  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  const handleMatchOffre = async () => {
    if (!jobId) return;
    setLoading(true); setError("");
    try {
      const res = await matchOffreToCVs(parseInt(jobId), 10);
      let data  = res.data;
      if (filtre.niveau)
        data = data.filter(r => r.niveau === filtre.niveau);
      if (filtre.localisation)
        data = data.filter(r =>
          r.localisation?.toLowerCase()
           .includes(filtre.localisation.toLowerCase()));
      setResults(data);
    } catch { setError("Offre non trouvée"); }
    finally  { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true); setError("");
    try {
      const res = await semanticSearch(query, 10);
      setResults(res.data);
    } catch { setError("Erreur recherche"); }
    finally  { setLoading(false); }
  };

  const handlePublier = async () => {
    if (!offre.titrePoste || !offre.secteur) {
      setError("Titre et secteur obligatoires"); return;
    }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await publierOffre({
        ...offre,
        salaireEstime: parseInt(offre.salaireEstime) || 0
      });
      setSuccess(`✅ Offre publiée ! Job ID: ${res.data.job_id}`);
      setOffre({ titrePoste: "", secteur: "", localisation: "",
                 niveaurequis: "", competencesRequises: "",
                 salaireEstime: "", description: "" });
      // Refresh stats
      getDashboardStats().then(r => setStats(r.data)).catch(() => {});
    } catch { setError("Erreur publication offre"); }
    finally  { setLoading(false); }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1050, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="#0F1E3D">
          👋 Bonjour, {nom}
        </Typography>
        <Typography color="text.secondary">
          Dashboard Recruteur — Gérez vos offres et trouvez les meilleurs talents
        </Typography>
      </Box>

      {/* Stats dynamiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "CVs disponibles",    value: stats?.total_cvs?.toLocaleString()      || "...", color: "#0D9488", icon: "👤" },
          { label: "Offres actives",     value: stats?.total_offres?.toLocaleString()   || "...", color: "#8B5CF6", icon: "💼" },
          { label: "Score moyen CV",     value: stats ? `${stats.score_moyen_cv}/5`     : "...",  color: "#F59E0B", icon: "⭐" },
          { label: "Salaire moyen offre",value: stats ? `${stats.salaire_moyen_offre?.toLocaleString()} DH` : "...", color: "#10B981", icon: "💰" },
        ].map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${s.color}30` }}>
              <CardContent sx={{ py: 2 }}>
                <Typography fontSize={28}>{s.icon}</Typography>
                <Typography variant="h5" fontWeight="bold" color={s.color}>
                  {s.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setResults([]); setError(""); setSuccess(""); }}
        sx={{ mb: 3, borderBottom: "2px solid #E2E8F0" }}>
        <Tab label="🔍 Matching"          />
        <Tab label="🔎 Recherche"         />
        <Tab label="📋 Publier une Offre" />
      </Tabs>

      {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* ── TAB 0 : Matching ── */}
      {tab === 0 && (
        <Box>
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <TextField label="Job ID" type="number" size="small"
              value={jobId} onChange={(e) => setJobId(e.target.value)}
              sx={{ width: 150 }} />
            <TextField label="Niveau" size="small" select
              value={filtre.niveau}
              onChange={(e) => setFiltre({ ...filtre, niveau: e.target.value })}
              sx={{ width: 150 }}>
              {["", "Junior", "Confirmé", "Senior"].map(v => (
                <MenuItem key={v} value={v}>{v || "Tous"}</MenuItem>
              ))}
            </TextField>
            <TextField label="Ville" size="small"
              value={filtre.localisation}
              onChange={(e) => setFiltre({ ...filtre, localisation: e.target.value })}
              sx={{ width: 180 }}
              InputProps={{ startAdornment:
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }} />
            <Button variant="contained" onClick={handleMatchOffre}
              startIcon={<SearchIcon />} disabled={loading}
              sx={{ background: "#0D9488", "&:hover": { background: "#0F766E" } }}>
              Trouver candidats
            </Button>
          </Box>

          {loading
            ? <Box sx={{ textAlign: "center", mt: 4 }}>
                <CircularProgress sx={{ color: "#0D9488" }} />
              </Box>
            : results.length > 0 && (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", mb: 2 }}>
                  <Typography fontWeight="bold">
                    {results.length} candidats trouvés
                  </Typography>
                  <Chip label={`Score moyen: ${
                    Math.round(results.reduce(
                      (a, r) => a + r.talent_score, 0) / results.length)
                  }%`} sx={{ background: "#0D9488", color: "#fff" }} />
                </Box>
                {results.map((r, i) =>
                  <MatchCard key={i} result={r} mode="offre" />)}
              </>
            )
          }
        </Box>
      )}

      {/* ── TAB 1 : Recherche Sémantique ── */}
      {tab === 1 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            💡 Ex: "data scientist NLP senior Casablanca"
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <TextField fullWidth size="small"
              placeholder="Décrivez le profil recherché..."
              value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              InputProps={{ startAdornment:
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              }} />
            <Button variant="contained" onClick={handleSearch}
              disabled={loading}
              sx={{ background: "#0D9488",
                "&:hover": { background: "#0F766E" },
                whiteSpace: "nowrap" }}>
              Rechercher
            </Button>
          </Box>
          {loading
            ? <Box sx={{ textAlign: "center" }}>
                <CircularProgress sx={{ color: "#0D9488" }} />
              </Box>
            : results.map((r, i) =>
                <MatchCard key={i} result={r} mode="cv" />)
          }
        </Box>
      )}

      {/* ── TAB 2 : Publier Offre ── */}
      {tab === 2 && (
        <Card sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📋 Nouvelle Offre d'Emploi
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: "Titre du poste",   field: "titrePoste",         md: 6 },
                { label: "Secteur",          field: "secteur",            md: 6 },
                { label: "Localisation",     field: "localisation",       md: 6 },
                { label: "Salaire (DH)",     field: "salaireEstime",      md: 6, type: "number" },
                { label: "Compétences (séparées par virgule)",
                                             field: "competencesRequises",md: 12 },
                { label: "Description",      field: "description",        md: 12 },
              ].map((f) => (
                <Grid item xs={12} md={f.md} key={f.field}>
                  <TextField fullWidth label={f.label} size="small"
                    type={f.type || "text"}
                    value={offre[f.field]}
                    onChange={(e) =>
                      setOffre({ ...offre, [f.field]: e.target.value })} />
                </Grid>
              ))}

              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Niveau requis" size="small" select
                  value={offre.niveaurequis}
                  onChange={(e) =>
                    setOffre({ ...offre, niveaurequis: e.target.value })}>
                  {["Junior", "Confirmé", "Senior", "Expert"].map(v => (
                    <MenuItem key={v} value={v}>{v}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" onClick={handlePublier}
                  disabled={loading}
                  startIcon={loading
                    ? <CircularProgress size={18} color="inherit" />
                    : <AddCircleIcon />}
                  sx={{ background: "#0D9488",
                    "&:hover": { background: "#0F766E" } }}>
                  Publier + Générer Embedding
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}