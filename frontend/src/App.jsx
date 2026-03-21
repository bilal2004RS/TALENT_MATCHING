import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar        from "./components/Navbar";
import Dashboard     from "./pages/Dashboard";
import CandidatSpace from "./pages/CandidatSpace";
import Analytics     from "./pages/Analytics";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import AdminSpace from "./pages/AdminSpace";

function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }
  return children;
}

function HomeRedirect() {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (role === "CANDIDAT") return <Navigate to="/candidat" />;
  return <Navigate to="/dashboard" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Racine — redirige selon état */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Publiques */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Recruteur / Admin */}
        <Route path="/dashboard" element={
          <PrivateRoute allowedRoles={["RECRUTEUR", "ADMIN"]}>
            <Box sx={{ background: "#F8FAFC", minHeight: "100vh" }}>
              <Navbar /><Dashboard />
            </Box>
          </PrivateRoute>
        }/>

        <Route path="/analytics" element={
          <PrivateRoute allowedRoles={["RECRUTEUR", "ADMIN"]}>
            <Box sx={{ background: "#F8FAFC", minHeight: "100vh" }}>
              <Navbar /><Analytics />
            </Box>
          </PrivateRoute>
        }/>

        {/* Candidat */}
        <Route path="/candidat" element={
          <PrivateRoute allowedRoles={["CANDIDAT", "ADMIN"]}>
            <Box sx={{ background: "#F8FAFC", minHeight: "100vh" }}>
              <Navbar /><CandidatSpace />
            </Box>
          </PrivateRoute>
        }/>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />

        <Route path="/admin" element={
  <PrivateRoute allowedRoles={["ADMIN"]}>
    <Box sx={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <Navbar /><AdminSpace />
    </Box>
  </PrivateRoute>
}/>

      </Routes>
    </BrowserRouter>
  );
}