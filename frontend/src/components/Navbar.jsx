import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import WorkIcon from "@mui/icons-material/Work";
import LogoutIcon from "@mui/icons-material/Logout";
import axios from "axios";
import { useEffect, useState } from "react";
import { Menu, MenuItem } from "@mui/material";

import { IconButton, Tooltip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import {
  Dialog,
  DialogTitle,
  DialogContent
} from "@mui/material";
export default function Navbar() {

  const [applications, setApplications] = useState([]);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [openCV, setOpenCV] = useState(false);
const [cvUrl, setCvUrl] = useState("");

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const nom  = localStorage.getItem("nom");

  useEffect(() => {
  const userId = localStorage.getItem("userId");

  if (role === "RECRUTEUR") {
    axios.get("http://localhost:8080/applications")
      .then(res => setApplications(res.data))
      .catch(err => console.error(err));
  }

  if (role === "CANDIDAT") {
    axios.get(`http://localhost:8080/applications/user/${userId}`)
      .then(res => setApplications(res.data))
      .catch(err => console.error(err));
  }

}, [role]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };
  const updateStatus = async (id, status) => {
  try {
    await axios.put(`http://localhost:8080/applications/${id}/status?status=${status}`);
    alert("Status updated ✅");

    // refresh
    window.location.reload();

  } catch (err) {
    console.error(err);
    alert("Erreur ❌");
  }
};

const deleteApplication = async (id) => {
  try {
    await axios.delete(`http://localhost:8080/applications/${id}`);
    
    // نحيدها من state بلا refresh
    setApplications(prev => prev.filter(app => app.id !== id));

  } catch (err) {
    console.error(err);
  }
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

          {(role === "RECRUTEUR" || role === "CANDIDAT") && (
  <Button
    variant="outlined"
    sx={{ color: "#CBD5E1", borderColor: "#CBD5E1" }}
    onClick={handleClick}
  >
    🔔 ({applications.length})
  </Button>
)}

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
        <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}

        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}

        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}

        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 2,
            boxShadow: 3,
            border: "8px solid #e2e8f0"
          }
        }}
      >
  {applications.length === 0 ? (
    <MenuItem>Aucune notification</MenuItem>
  ) : (
    applications.map((app) => (
<MenuItem
  key={app.id}
  disableRipple
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 2,
    cursor: "default",
    "&:hover": {
      backgroundColor: "transparent"
    }
  }}
>
  {/* LEFT SIDE */}
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    
    {role === "RECRUTEUR" ? (
      <>
        <Box>
          <div>👤 {app.email}</div>
          <div style={{ fontSize: "12px", color: "#94A3B8" }}>
            📄 #{app.offreId}
          </div>
        </Box>

        —
        <strong
          style={{
            color:
              app.status === "ACCEPTED"
                ? "green"
                : app.status === "REJECTED"
                ? "red"
                : "gray"
          }}
        >
          {app.status}
        </strong>
      </>
    ) : (
      <>
        <Box>
          <div>📄 Offre #{app.offreId}</div>
        </Box>

        —
        <strong
          style={{
            color:
              app.status === "ACCEPTED"
                ? "green"
                : app.status === "REJECTED"
                ? "red"
                : "gray"
          }}
        >
          {app.status === "ACCEPTED" && "✔ Acceptée"}
          {app.status === "REJECTED" && "❌ Refusée"}
          {app.status === "APPLIED" && "⏳ En attente"}
        </strong>
      </>
    )}

  </Box>

  {/* RIGHT SIDE (غير recruteur) */}
  {role === "RECRUTEUR" && (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      
      {/* CV */}
      <Tooltip title="Voir CV">
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setCvUrl(`http://localhost:8080${app.cvUrl}`);
            setOpenCV(true);
          }}
          sx={{ color: "#0D9488" }}
        >
          <DescriptionIcon />
        </IconButton>
      </Tooltip>

      {/* ACCEPT */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          updateStatus(app.id, "ACCEPTED");
        }}
        sx={{ color: "green" }}
      >
        <CheckCircleIcon />
      </IconButton>

      {/* REJECT */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          updateStatus(app.id, "REJECTED");
        }}
        sx={{ color: "red" }}
      >
        <CancelIcon />
      </IconButton>

      {/* DELETE */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm("Supprimer cette notification ?")) {
            deleteApplication(app.id);
          }
        }}
        sx={{ color: "gray" }}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  )}
</MenuItem>
    ))
  )}
</Menu>
<Dialog
  open={openCV}
  onClose={() => setOpenCV(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>CV du candidat</DialogTitle>

  <DialogContent sx={{ height: "80vh" }}>
    <iframe
      src={cvUrl}
      width="100%"
      height="100%"
      style={{ border: "none" }}
      title="CV"
    />
  </DialogContent>
</Dialog>
      </Toolbar>
    </AppBar>
  );
}