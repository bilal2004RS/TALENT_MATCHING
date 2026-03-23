import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import WorkIcon from "@mui/icons-material/Work";
import LogoutIcon from "@mui/icons-material/Logout";

export default function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const nom  = localStorage.getItem("nom");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

const links =
  role === "CANDIDAT"
    ? [{ label: "Mon Espace", path: "/candidat" }]
    : role === "ADMIN"
    ? [
        { label: "Admin",      path: "/admin"      },
      ]
    : [
        { label: "Dashboard",  path: "/dashboard" },
        { label: "Analytics",  path: "/analytics" },
      ];

  return (
    <AppBar position="static" sx={{ background: "#0F1E3D" }}>
      <Toolbar>
        <WorkIcon sx={{ mr: 1, color: "#0D9488" }} />
        <Typography variant="h6" sx={{ flexGrow: 1, color: "#fff", fontWeight: "bold" }}>
          Talent<span style={{ color: "#0D9488" }}>Match</span>
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {links.map((item) => (
            <Button key={item.path} component={Link} to={item.path}
              sx={{ color: "#CBD5E1", "&:hover": { color: "#0D9488" } }}>
              {item.label}
            </Button>
          ))}

          {/* Nom + role */}
          <Typography variant="body2"
            sx={{ color: "#94A3B8", borderLeft: "1px solid #334155", pl: 2 }}>
            {nom} · <span style={{ color: "#0D9488" }}>{role}</span>
          </Typography>

          {/* Logout */}
          <Button onClick={handleLogout} startIcon={<LogoutIcon />}
            sx={{ color: "#EF4444", "&:hover": { color: "#DC2626" } }}>
            Déconnexion
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}