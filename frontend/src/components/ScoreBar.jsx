import { Box, Typography, LinearProgress } from "@mui/material";

export default function ScoreBar({ score }) {
  const color =
    score >= 75 ? "#10B981" :
    score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary">
          Talent Score
        </Typography>
        <Typography variant="caption" sx={{ color, fontWeight: "bold" }}>
          {score}%
        </Typography>
      </Box>
<LinearProgress
  variant="determinate"
  value={Math.min(Math.max(score || 0, 0), 100)}
  sx={{
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    "& .MuiLinearProgress-bar": { backgroundColor: color, borderRadius: 4 },
  }}
/>
    </Box>
  );
}