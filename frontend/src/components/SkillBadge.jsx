import { Chip } from "@mui/material";

export default function SkillBadge({ skill, type = "match" }) {
  const colors = {
    match  : { bg: "#D1FAE5", color: "#065F46" },
    missing: { bg: "#FEE2E2", color: "#991B1B" },
    bonus  : { bg: "#DBEAFE", color: "#1E40AF" },
  };
  const c = colors[type];
  return (
    <Chip
      label={skill}
      size="small"
      sx={{
        backgroundColor: c.bg,
        color: c.color,
        fontWeight: 600,
        fontSize: "0.7rem",
        m: 0.3,
      }}
    />
  );
}