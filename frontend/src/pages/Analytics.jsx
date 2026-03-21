import { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent,
  CircularProgress, Tabs, Tab, Chip
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ScatterChart,
  Scatter, ZAxis
} from "recharts";
import { getSkillGap, getMarketSkills, getCartographie } from "../api/client";

const TEAL = "#0D9488";

export default function Analytics() {
  const [tab, setTab]           = useState(0);
  const [skillGap, setSkillGap] = useState([]);
  const [market, setMarket]     = useState([]);
  const [carto, setCarto]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [g, m, c] = await Promise.all([
          getSkillGap(15, "penurie"),
          getMarketSkills(10),
          getCartographie(15),
        ]);
        setSkillGap(g.data);
        setMarket(m.data);
        setCarto(c.data);
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <CircularProgress sx={{ color: TEAL }} />
    </Box>
  );

  return (
    <Box sx={{ p: 4, maxWidth: 1100, mx: "auto" }}>
      <Typography variant="h4" fontWeight="bold" color="#0F1E3D" gutterBottom>
        📊 Workforce Analytics
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Skill Gap" />
        <Tab label="Marché" />
        <Tab label="Cartographie" />
      </Tabs>

      {/* SKILL GAP */}
      {tab === 0 && (
        <Card sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            🔴 Skills en Pénurie (Demande &gt; Disponibilité)
          </Typography>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={skillGap} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" unit="%" />
              <YAxis type="category" dataKey="skill" width={80} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="gap_pct" name="Gap %" radius={[0, 4, 4, 0]}>
                {skillGap.map((_, i) => (
                  <Cell key={i} fill={i < 5 ? "#EF4444" : "#F97316"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* MARCHE */}
      {tab === 1 && (
        <Grid container spacing={3}>
          {market.map((item, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ borderRadius: 3, border: "1px solid #E2E8F0",
                "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)" } }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" color="#0F1E3D">
                    {item.skill}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📈 Demande: <strong>{item.demande_marche_pct}%</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    🚀 Croissance: <strong>{item.croissance_pct}%/an</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    💰 Salaire moy: <strong>{item.salaire_moyen?.toLocaleString()} DH</strong>
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={`Score: ${item.score_opportunite}`}
                      size="small"
                      sx={{ background: TEAL, color: "#fff", fontWeight: "bold" }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* CARTOGRAPHIE */}
      {tab === 2 && (
        <Card sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            🗺️ Top 15 Skills — Pool Candidats
          </Typography>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={carto} margin={{ left: 20 }}>
              <XAxis dataKey="skill" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" name="Candidats" radius={[4, 4, 0, 0]} fill={TEAL} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </Box>
  );
}