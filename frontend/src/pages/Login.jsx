import { useState } from "react";
import { CircularProgress, Alert } from "@mui/material";
import { login } from "../api/client";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleLogin = async () => {
  if (!email || !password) {
    setError("Remplissez tous les champs");
    return;
  }
  setLoading(true); setError("");
  try {
    const res = await login(email, password);
    localStorage.setItem("token",       res.data.token);
    localStorage.setItem("role",        res.data.role);
    localStorage.setItem("nom",         res.data.nom);
    localStorage.setItem("userId",      res.data.userId);
    localStorage.setItem("candidateId", res.data.candidateId || res.data.userId);

    const role = res.data.role;
    if (role === "ADMIN")             navigate("/admin");      // ← Admin → /admin
    else if (role === "RECRUTEUR")    navigate("/dashboard");  // ← Recruteur → /dashboard
    else if (role === "CANDIDAT")     navigate("/candidat");   // ← Candidat → /candidat
  } catch {
    setError("Email ou mot de passe incorrect");
  } finally { setLoading(false); }
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .login-root {
          
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f0f4ff;
        }

        /* ── LEFT PANEL ── */
        .left-panel {
          width: 45%;
          background: linear-gradient(145deg, #0D9488 0%, #0D9488 60%, #0D9488 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }

        .left-panel::before {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: #0D9488;
          top: -100px; left: -100px;
        }

        .left-panel::after {
          content: '';
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: #0D9488;
          bottom: -80px; right: -80px;
        }

        .brand {
          font-family: 'Syne', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
          margin-bottom: 8px;
          z-index: 1;
        }

        .brand span { color: #a8edea; }

        .brand-sub {
          color: rgba(255,255,255,0.65);
          font-size: 0.95rem;
          margin-bottom: 48px;
          z-index: 1;
        }

        /* SVG illustration */
        .illustration {
          width: 100%;
          max-width: 320px;
          z-index: 1;
          filter: drop-shadow(0 20px 40px #0D9488);
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-12px); }
        }

        .features {
          margin-top: 40px;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.85);
          font-size: 0.9rem;
        }

        .feature-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #0D9488;
          flex-shrink: 0;
        }

        /* ── RIGHT PANEL ── */
        .right-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: #fff;
        }

        .form-wrapper {
          width: 100%;
          max-width: 400px;
          animation: slideUp 0.5s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .form-title {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #0D9488;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .form-sub {
          color: #888;
          font-size: 0.9rem;
          margin-bottom: 36px;
        }

        .field-group {
          margin-bottom: 20px;
        }

        .field-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 500;
          color: #0D9488;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }

        .field-input {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid #eee;
          border-radius: 14px;
          font-size: 0.95rem;
          font-family: 'DM Sans', sans-serif;
          color: #0D9488;
          background: #fafafa;
          outline: none;
          transition: all 0.2s;
        }

        .field-input:focus {
          border-color: #0D9488;
          background: #fff;
          box-shadow: 0 0 0 4px #0D9488;
        }

        .login-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #0D9488, #0D9488);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.25s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.3px;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px #0D9488);
        }

        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .divider {
          text-align: center;
          color: #bbb;
          font-size: 0.85rem;
          margin: 24px 0;
          position: relative;
        }

        .divider::before, .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: #eee;
        }
        .divider::before { left: 0; }
        .divider::after  { right: 0; }

        .register-link {
          text-align: center;
          color: #888;
          font-size: 0.88rem;
        }

        .register-link a {
          color: #0D9488;
          font-weight: 600;
          text-decoration: none;
        }

        .register-link a:hover { text-decoration: underline; }

        .error-box {
          background: #fff0f0;
          border: 1px solid #ffd0d0;
          color: #c0392b;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 0.87rem;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .left-panel { display: none; }
          .right-panel { padding: 32px 24px; }
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT ── */}
        <div className="left-panel">
          <div className="brand">
            Talent<span>Match</span>
          </div>
          <div className="brand-sub">Plateforme intelligente de recrutement</div>

          {/* SVG Illustration */}
          <svg className="illustration" viewBox="0 0 400 320" fill="none">
            {/* Background shape */}
            <ellipse cx="200" cy="280" rx="160" ry="20" fill="rgba(255,255,255,0.1)"/>

            {/* Desk */}
            <rect x="60" y="220" width="280" height="12" rx="6" fill="rgba(255,255,255,0.25)"/>
            <rect x="90" y="232" width="12" height="50" rx="4" fill="rgba(255,255,255,0.15)"/>
            <rect x="298" y="232" width="12" height="50" rx="4" fill="rgba(255,255,255,0.15)"/>

            {/* Monitor */}
            <rect x="110" y="120" width="180" height="110" rx="10" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
            <rect x="118" y="128" width="164" height="88" rx="6" fill="rgba(255,255,255,0.15)"/>
            <rect x="185" y="218" width="30" height="8" rx="2" fill="rgba(255,255,255,0.2)"/>

            {/* Screen content - bars */}
            <rect x="130" y="140" width="80" height="6" rx="3" fill="rgba(168,237,234,0.8)"/>
            <rect x="130" y="152" width="50" height="4" rx="2" fill="rgba(255,255,255,0.4)"/>
            <rect x="130" y="162" width="120" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/>
            <rect x="130" y="170" width="90" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/>
            <rect x="130" y="178" width="110" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/>

            {/* Score circle */}
            <circle cx="240" cy="162" r="22" fill="rgba(168,237,234,0.2)" stroke="rgba(168,237,234,0.6)" strokeWidth="2"/>
            <text x="240" y="167" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">87%</text>

            {/* Person */}
            <circle cx="320" cy="130" r="22" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
            <circle cx="320" cy="122" r="10" fill="rgba(255,255,255,0.6)"/>
            <path d="M298 155 Q320 145 342 155 L340 220 L300 220 Z" fill="rgba(255,255,255,0.25)"/>

            {/* Floating cards */}
            <rect x="40" y="80" width="80" height="45" rx="8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            <rect x="50" y="90" width="40" height="4" rx="2" fill="rgba(168,237,234,0.7)"/>
            <rect x="50" y="99" width="60" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/>
            <rect x="50" y="107" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>

            <rect x="280" y="60" width="90" height="45" rx="8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            <rect x="290" y="70" width="45" height="4" rx="2" fill="rgba(168,237,234,0.7)"/>
            <rect x="290" y="79" width="70" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/>
            <rect x="290" y="87" width="55" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>

            {/* Check badge */}
            <circle cx="80" cy="200" r="18" fill="#a8edea"/>
            <path d="M72 200 L78 206 L90 194" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          <div className="features">
            {[
              "Matching intelligent CV ↔ Offres",
              "Analytics & Talent Score en temps réel",
              "350K candidats · 200K offres",
            ].map((f) => (
              <div className="feature-item" key={f}>
                <div className="feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="right-panel">
          <div className="form-wrapper">
            <div className="form-title">bon <span>retour</span></div>
            <div className="form-sub">
              Connectez-vous à votre espace personnel
            </div>

            {error && (
              <div className="error-box">
                ⚠️ {error}
              </div>
            )}

            <div className="field-group">
              <label className="field-label">Adresse email</label>
              <input
                className="field-input"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Mot de passe</label>
              <input
                className="field-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading
                ? <><CircularProgress size={18} sx={{ color: "#fff" }} /> Connexion...</>
                : "Se connecter →"
              }
            </button>

            <div className="divider">ou</div>

            <div className="register-link">
              Pas encore de compte ?{" "}
              <Link to="/register">S'inscrire maintenant</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}