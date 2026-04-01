import {
  Card, CardContent, Typography, Box, Divider, Chip
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessIcon   from "@mui/icons-material/Business";
import EuroIcon       from "@mui/icons-material/Euro";
import ScoreBar  from "./ScoreBar";
import SkillBadge from "./SkillBadge";

export default function MatchCard({ result, mode = "cv" }) {
  const exp = result.explication || {};

  return (
    <Card sx={{
      mb: 2, borderRadius: 3,
      border: "1px solid #E2E8F0",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.13)" },
      transition: "box-shadow 0.2s"
    }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            {mode === "cv" ? (
              <>
                <Typography variant="h6" fontWeight="bold" color="#0F1E3D">
                  {result.titre_poste}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mt: 0.5, flexWrap: "wrap" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                    <BusinessIcon fontSize="small" /> {result.secteur}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                    <LocationOnIcon fontSize="small" /> {result.localisation}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                    <EuroIcon fontSize="small" /> {result.salaire_estime?.toLocaleString()} DH
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="h6" fontWeight="bold" color="#0F1E3D">
                  Candidat #{result.candidate_id}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {result.localisation}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {result.niveau} — {result.annees_exp} ans exp
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Score CV: {result.score_cv}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Score bar */}
        <ScoreBar score={result.talent_score} />

        <Divider sx={{ my: 1.5 }} />

        {/* Skills explication */}
        <Box>
          {exp.skills_matchés?.length > 0 && (
            <Box sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Matchés</Typography>
              <Box>{exp.skills_matchés.map(s => <SkillBadge key={s} skill={s} type="match" />)}</Box>
            </Box>
          )}
          {exp.skills_manquants?.length > 0 && (
            <Box sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Manquants</Typography>
              <Box>{exp.skills_manquants.map(s => <SkillBadge key={s} skill={s} type="missing" />)}</Box>
            </Box>
          )}
          {exp.skills_bonus?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">Bonus</Typography>
              <Box>{exp.skills_bonus.map(s => <SkillBadge key={s} skill={s} type="bonus" />)}</Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}