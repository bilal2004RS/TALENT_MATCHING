import { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent,
  Tabs, Tab, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableHead,
  TableRow, Chip, LinearProgress, MenuItem,
  Select, FormControl, IconButton, Tooltip
} from "@mui/material";
import DeleteIcon  from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  getAdminUsers, updateUserRole,
  deleteUser, getMonitoring,
  getMonitoringML, getDrift
} from "../api/client";

export default function AdminSpace() {
  const [tab, setTab]           = useState(0);
  const [users, setUsers]       = useState([]);
  const [monitoring, setMonitoring] = useState(null);
  const [monitoringML, setMonitoringML] = useState(null);
  const [drift, setDrift]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const loadData = async (t = tab) => {
    setLoading(true); setError("");
    try {
      if (t === 0) {
        const res = await getAdminUsers();
        setUsers(res.data);
      } else if (t === 1) {
        const [m, ml] = await Promise.all([
          getMonitoring(), getMonitoringML()
        ]);
        setMonitoring(m.data);
        setMonitoringML(ml.data);
      } else if (t === 2) {
        const res = await getDrift();
        setDrift(res.data);
      }
    } catch { setError("Erreur chargement données"); }
    finally  { setLoading(false); }
  };

  useEffect(() => { loadData(0); }, []);

  const handleTabChange = (_, v) => {
    setTab(v); setError(""); setSuccess("");
    loadData(v);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: newRole } : u));
      setSuccess("Role mis à jour ✅");
      setTimeout(() => setSuccess(""), 2000);
    } catch { setError("Erreur mise à jour role"); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setSuccess("Utilisateur supprimé ✅");
      setTimeout(() => setSuccess(""), 2000);
    } catch { setError("Erreur suppression"); }
  };

  const roleColors = {
    ADMIN    : "#EF4444",
    RECRUTEUR: "#0D9488",
    CANDIDAT : "#8B5CF6",
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1100, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ mb: 3, display: "flex",
        justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#0F1E3D">
            ⚙️ Back Office Admin
          </Typography>
          <Typography color="text.secondary">
            Gestion utilisateurs, monitoring et détection de drift
          </Typography>
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton onClick={() => loadData(tab)}
            sx={{ color: "#0D9488" }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Tabs value={tab} onChange={handleTabChange}
        sx={{ mb: 3, borderBottom: "2px solid #E2E8F0" }}>
        <Tab label="👥 Gérer Utilisateurs"  />
        <Tab label="📡 Monitoring Système"  />
        <Tab label="🔬 Data Drift"          />
      </Tabs>

      {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <CircularProgress sx={{ color: "#0D9488" }} />
        </Box>
      )}

      {/* ── TAB 0 : Utilisateurs ── */}
      {tab === 0 && !loading && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              👥 Utilisateurs ({users.length})
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#F8FAFC" }}>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Nom</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}
                    sx={{ "&:hover": { background: "#F8FAFC" } }}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell><strong>{u.nom}</strong></TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <FormControl size="small">
                        <Select value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value)}
                          sx={{ fontSize: "0.8rem",
                            color: roleColors[u.role] || "#333",
                            fontWeight: "bold" }}>
                          {["ADMIN","RECRUTEUR","CANDIDAT"].map(r => (
                            <MenuItem key={r} value={r}
                              sx={{ color: roleColors[r], fontWeight: "bold" }}>
                              {r}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Supprimer">
                        <IconButton size="small"
                          onClick={() => handleDelete(u.id)}
                          sx={{ color: "#EF4444" }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 1 : Monitoring ── */}
      {tab === 1 && !loading && monitoring && (
        <Grid container spacing={3}>
          {/* Système */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  💻 Monitoring Système
                </Typography>
                {[
                  { label: "CPU",  value: monitoring.cpu_percent },
                  { label: "RAM",  value: monitoring.ram_percent },
                  { label: "Disk", value: monitoring.disk_percent },
                ].map((item) => (
                  <Box key={item.label} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex",
                      justifyContent: "space-between" }}>
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="body2" fontWeight="bold"
                        color={item.value > 80 ? "#EF4444"
                          : item.value > 60 ? "#F59E0B" : "#10B981"}>
                        {item.value}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate"
                      value={item.value}
                      sx={{ height: 10, borderRadius: 4,
                        "& .MuiLinearProgress-bar": {
                          background: item.value > 80 ? "#EF4444"
                            : item.value > 60 ? "#F59E0B" : "#10B981"
                        }
                      }} />
                  </Box>
                ))}
                <Typography variant="caption" color="text.secondary">
                  RAM: {monitoring.ram_used_gb} GB /
                  {monitoring.ram_total_gb} GB
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Modèles ML */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  🤖 Monitoring Modèles ML
                </Typography>
                {monitoringML && [
                  { label: "TF-IDF Vectorizer",
                    status: monitoringML.tfidf_vectorizer?.status,
                    detail: `Vocabulaire: ${monitoringML.tfidf_vectorizer?.vocabulaire}` },
                  { label: "CV Vectors",
                    status: monitoringML.cv_vectors?.status,
                    detail: `${monitoringML.cv_vectors?.nb_cvs} CVs vectorisés` },
                  { label: "Offre Vectors",
                    status: monitoringML.offre_vectors?.status,
                    detail: `${monitoringML.offre_vectors?.nb_offres} offres vectorisées` },
                ].map((item) => (
                  <Box key={item.label} sx={{ mb: 2, p: 1.5,
                    borderRadius: 2, border: "1px solid #E2E8F0" }}>
                    <Box sx={{ display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center" }}>
                      <Typography variant="body2" fontWeight="bold">
                        {item.label}
                      </Typography>
                      <Chip label={item.status} size="small"
                        sx={{ background: "#D1FAE5",
                          color: "#065F46", fontSize: "0.7rem" }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.detail}
                    </Typography>
                  </Box>
                ))}
                <Typography variant="caption" color="text.secondary">
                  Mise à jour: {monitoringML?.derniere_mise_a_jour
                    ? new Date(monitoringML.derniere_mise_a_jour)
                        .toLocaleTimeString() : ""}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── TAB 2 : Data Drift ── */}
      {tab === 2 && !loading && drift && (
        <Box>
          <Alert severity={
            drift.statut_global?.includes("⚠️") ? "warning" : "success"}
            sx={{ mb: 3 }}>
            {drift.statut_global}
          </Alert>
          <Grid container spacing={3}>
            {Object.entries(drift)
              .filter(([k]) => k !== "statut_global")
              .map(([key, val]) => (
              <Grid item xs={12} md={4} key={key}>
                <Card sx={{ borderRadius: 3,
                  border: `2px solid ${val.drift ? "#FEE2E2" : "#D1FAE5"}` }}>
                  <CardContent>
                    <Box sx={{ display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center", mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {key.replace(/_/g, " ").toUpperCase()}
                      </Typography>
                      <Chip
                        label={val.drift ? "⚠️ Drift" : "✅ OK"}
                        size="small"
                        sx={{
                          background: val.drift ? "#FEE2E2" : "#D1FAE5",
                          color: val.drift ? "#991B1B" : "#065F46",
                          fontWeight: "bold"
                        }} />
                    </Box>
                    <Box sx={{ display: "flex",
                      justifyContent: "space-between" }}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h5" fontWeight="bold"
                          color="#64748B">
                          {val.mean_ancien}
                        </Typography>
                        <Typography variant="caption"
                          color="text.secondary">
                          Données anciennes
                        </Typography>
                      </Box>
                      <Typography variant="h5" color="#CBD5E1">→</Typography>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h5" fontWeight="bold"
                          color={val.drift ? "#EF4444" : "#10B981"}>
                          {val.mean_recent}
                        </Typography>
                        <Typography variant="caption"
                          color="text.secondary">
                          Données récentes
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}