import { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent,
  CircularProgress, Tabs, Tab, Chip, Alert
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, Cell, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ScatterChart, Scatter, ZAxis
} from "recharts";
import { getSkillGap, getMarketSkills, getCartographie } from "../api/client";

const TEAL    = "#0D9488";
const COLORS  = ["#0D9488","#6C5CE7","#F59E0B","#EF4444","#10B981",
                  "#3B82F6","#EC4899","#8B5CF6","#F97316","#14B8A6"];

export default function Analytics() {
  const [tab, setTab]           = useState(0);
  const [skillGap, setSkillGap] = useState([]);
  const [market, setMarket]     = useState([]);
  const [carto, setCarto]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError("");
      try {
        const [g, m, c] = await Promise.all([
          getSkillGap(15, "penurie"),
          getMarketSkills(12),
          getCartographie(15),
        ]);
        setSkillGap(Array.isArray(g.data) ? g.data : []);
        setMarket(Array.isArray(m.data)   ? m.data : []);
        setCarto(Array.isArray(c.data)    ? c.data : []);
      } catch {
        setError("Erreur chargement analytics — vérifiez FastAPI");
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center",
      alignItems: "center", mt: 10, flexDirection: "column", gap: 2 }}>
      <CircularProgress sx={{ color: TEAL }} size={48} />
      <Typography color="text.secondary">Chargement des analytics...</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 4, maxWidth: 1150, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="#0F1E3D">
          📊 Workforce Analytics
        </Typography>
        <Typography color="text.secondary">
          Analyse en temps réel — 350K CVs · 200K Offres · 200K Skills marché
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Skills analysés",    value: carto.length > 0 ? `${carto.reduce((a,s) => a + (s.count||0), 0).toLocaleString()}` : "...", icon: "🧠", color: "#0D9488" },
          { label: "Skills en pénurie",  value: skillGap.filter(s => (s.gap_pct||0) > 20).length, icon: "⚠️", color: "#EF4444" },
          { label: "Top skill marché",   value: market[0]?.skill || "...", icon: "🚀", color: "#6C5CE7" },
          { label: "Croissance moyenne", value: market.length > 0 ? `${(market.reduce((a,s) => a + (s.croissance_pct||0), 0) / market.length).toFixed(1)}%` : "...", icon: "📈", color: "#F59E0B" },
        ].map((k, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${k.color}20` }}>
              <CardContent sx={{ py: 2 }}>
                <Typography fontSize={28}>{k.icon}</Typography>
                <Typography variant="h5" fontWeight="bold" color={k.color}>
                  {k.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {k.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: "2px solid #E2E8F0" }}>
        <Tab label="🔴 Skill Gap"        />
        <Tab label="📈 Marché Skills"    />
        <Tab label="🗺️ Cartographie"    />
      </Tabs>

      {/* ── TAB 0 : SKILL GAP ── */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🔴 Skills en Pénurie — Gap Demande vs Disponibilité
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Plus le gap est élevé, plus le skill est rare dans le marché
              </Typography>
              {skillGap.length > 0 ? (
                <ResponsiveContainer width="100%" height={420}>
                  <BarChart data={skillGap} layout="vertical"
                    margin={{ left: 100, right: 40 }}>
                    <XAxis type="number" unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="skill" width={100}
                      tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(v, n) => [`${v}%`, n]}
                      contentStyle={{ borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="gap_pct" name="Gap %" radius={[0,4,4,0]}>
                      {skillGap.map((entry, i) => (
                        <Cell key={i}
                          fill={(entry.gap_pct||0) > 40 ? "#EF4444"
                            : (entry.gap_pct||0) > 20 ? "#F97316" : "#F59E0B"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                  Aucune donnée disponible
                </Typography>
              )}
            </Card>
          </Grid>

          {/* Top 3 skills critiques */}
          {skillGap.slice(0, 3).map((s, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Card sx={{ borderRadius: 3,
                border: `2px solid ${i===0?"#EF4444":i===1?"#F97316":"#F59E0B"}` }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    {["🥇","🥈","🥉"][i]} {s.skill}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gap critique: <strong style={{
                      color: i===0?"#EF4444":i===1?"#F97316":"#F59E0B"
                    }}>{s.gap_pct}%</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Demande: {s.demande_pct || s.demande_marche_pct || "N/A"}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── TAB 1 : MARCHÉ ── */}
      {tab === 1 && (
        <Grid container spacing={3}>

          {/* Bar chart salaires */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                💰 Salaire Moyen par Skill
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={market} margin={{ left: 10, bottom: 40 }}>
                  <XAxis dataKey="skill" angle={-35} textAnchor="end"
                    height={70} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`${v?.toLocaleString()} DH`, "Salaire"]}
                    contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="salaire_moyen" name="Salaire (DH)"
                    radius={[4,4,0,0]}>
                    {market.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* Line chart croissance */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📈 Croissance Annuelle (%)
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={market} layout="vertical"
                  margin={{ left: 80 }}>
                  <XAxis type="number" unit="%" />
                  <YAxis type="category" dataKey="skill"
                    tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v) => [`${v}%`, "Croissance"]}
                    contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="croissance_pct" name="Croissance %"
                    radius={[0,4,4,0]} fill="#6C5CE7" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* Cards skills */}
          {market.map((item, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ borderRadius: 3,
                border: "1px solid #E2E8F0",
                "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  transform: "translateY(-2px)" },
                transition: "all 0.2s" }}>
                <CardContent>
                  <Box sx={{ display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center", mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold" color="#0F1E3D">
                      {item.skill}
                    </Typography>
                    <Chip label={item.tendance || "📈"}
                      size="small"
                      sx={{ background: "#F0FDF9", color: TEAL,
                        fontWeight: "bold" }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    📈 Demande: <strong>{item.demande_marche_pct}%</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    🚀 Croissance: <strong>{item.croissance_pct}%/an</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    💰 Salaire: <strong>
                      {item.salaire_moyen?.toLocaleString()} DH
                    </strong>
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={`Opportunité: ${item.score_opportunite}`}
                      size="small"
                      sx={{ background: TEAL, color: "#fff",
                        fontWeight: "bold" }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── TAB 2 : CARTOGRAPHIE ── */}
      {tab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, p: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🗺️ Top 15 Skills — Pool de 350K Candidats
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Compétences les plus présentes dans les CVs analysés
              </Typography>
              {carto.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={carto}
                    margin={{ left: 20, bottom: 40 }}>
                    <XAxis dataKey="skill" angle={-35}
                      textAnchor="end" height={70}
                      tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) =>
                      v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip
                      formatter={(v) => [v?.toLocaleString(), "Candidats"]}
                      contentStyle={{ borderRadius: 8 }} />
                    <Bar dataKey="count" name="Candidats"
                      radius={[4,4,0,0]}>
                      {carto.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary"
                  sx={{ textAlign: "center", py: 4 }}>
                  Aucune donnée disponible
                </Typography>
              )}
            </Card>
          </Grid>

          {/* Top skills cards */}
          {carto.slice(0, 6).map((s, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ borderRadius: 3,
                border: `1px solid ${COLORS[i % COLORS.length]}30` }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center" }}>
                    <Typography fontWeight="bold" color="#0F1E3D">
                      {s.skill}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold"
                      color={COLORS[i % COLORS.length]}>
                      {s.count?.toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    candidats maîtrisent ce skill
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}