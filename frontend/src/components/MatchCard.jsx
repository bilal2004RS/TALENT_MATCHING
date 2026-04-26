import {
  Card, CardContent, Typography, Box, Divider, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessIcon   from "@mui/icons-material/Business";
import EuroIcon       from "@mui/icons-material/Euro";
import ScoreBar  from "./ScoreBar";
import SkillBadge from "./SkillBadge";
import { Button } from "@mui/material";
import { useState } from "react";


export default function MatchCard({ result, mode = "cv" }) {
  const [openDetails, setOpenDetails] = useState(false);
  const exp = result.explication || {};
  const handleApply = (candidateId) => {
  alert(`Offre envoyée au candidat #${candidateId} ! (fonctionnalité à implémenter)`);
  };
  const handleDetails = () => {
    setOpenDetails(true);
  };
  const handleCloseDetails = () => {
    setOpenDetails(false);
  };
  return (
    <>
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
                  Candidat {result.candidate_id}
                </Typography>

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
          <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
            <Button variant="outlined"
              onClick={handleDetails}
            >
              Plus de détails
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
    {/* Details Dialog */}
    <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", color: "#0F1E3D" }}>
        Détails du Candidat {result.candidate_id}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Localisation</Typography>
            <Typography variant="body2">{result.localisation}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Niveau</Typography>
            <Typography variant="body2">{result.niveau}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Expérience</Typography>
            <Typography variant="body2">{result.annees_exp} ans</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Score CV</Typography>
            <Typography variant="body2">{result.score_cv}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Talent Score</Typography>
            <Typography variant="body2">{result.talent_score}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          {exp.skills_matchés?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">Skills Matchés</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                {exp.skills_matchés.map(s => <SkillBadge key={s} skill={s} type="match" />)}
              </Box>
            </Box>
          )}
          {exp.skills_manquants?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">Skills Manquants</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                {exp.skills_manquants.map(s => <SkillBadge key={s} skill={s} type="missing" />)}
              </Box>
            </Box>
          )}
          {exp.skills_bonus?.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">Skills Bonus</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                {exp.skills_bonus.map(s => <SkillBadge key={s} skill={s} type="bonus" />)}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDetails} color="primary">Fermer</Button>
      </DialogActions>
    </Dialog>
    </>
  );
}