import { useState } from "react";
import { CircularProgress } from "@mui/material";
import { register } from "../api/client";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    nom: "", email: "", password: "", confirmPassword: ""
  });
  const [role, setRole]           = useState("CANDIDAT");

  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  const handleChange = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleRegister = async () => {
    if (!form.nom || !form.email || !form.password) {
      setError("Remplissez tous les champs"); return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Mots de passe non identiques"); return;
    }
    if (form.password.length < 6) {
      setError("Mot de passe min 6 caractères"); return;
    }
    setLoading(true); setError("");
    try {
      const res = await register(
        form.email, form.password, form.nom, role
      );
      localStorage.setItem("token",       res.data.token);
      localStorage.setItem("role",        res.data.role);
      localStorage.setItem("nom",         res.data.nom);
      localStorage.setItem("userId",      res.data.userId);
      if (role === "RECRUTEUR" || role === "ADMIN") navigate("/");
      else navigate("/candidat");
    } catch (e) {
      setError(e.response?.data?.message || "Email déjà utilisé");
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .reg-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f0f4ff;
        }

        /* ── LEFT ── */
        .reg-left {
          width: 42%;
          background: linear-gradient(145deg, #6C5CE7 0%, #4834d4 60%, #2d1fa3 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }
        .reg-left::before {
          content: '';
          position: absolute;
          width: 350px; height: 350px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          top: -100px; left: -80px;
        }
        .reg-left::after {
          content: '';
          position: absolute;
          width: 250px; height: 250px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          bottom: -60px; right: -60px;
        }
        .reg-brand {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
          margin-bottom: 6px;
          z-index: 1;
        }
        .reg-brand span { color: #a8edea; }
        .reg-brand-sub {
          color: rgba(255,255,255,0.6);
          font-size: 0.9rem;
          margin-bottom: 40px;
          z-index: 1;
        }
        .reg-illustration {
          width: 100%;
          max-width: 280px;
          z-index: 1;
          filter: drop-shadow(0 16px 32px rgba(0,0,0,0.2));
          animation: floatReg 4s ease-in-out infinite;
        }
        @keyframes floatReg {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        .reg-steps {
          margin-top: 36px;
          z-index: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .reg-step {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .reg-step-num {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(168,237,234,0.25);
          border: 1.5px solid rgba(168,237,234,0.5);
          color: #a8edea;
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .reg-step-text {
          color: rgba(255,255,255,0.8);
          font-size: 0.88rem;
        }

        /* ── RIGHT ── */
        .reg-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          background: #fff;
          overflow-y: auto;
        }
        .reg-wrapper {
          width: 100%;
          max-width: 400px;
          animation: slideUpReg 0.5s ease;
        }
        @keyframes slideUpReg {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reg-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 4px;
          letter-spacing: -0.5px;
        }
        .reg-sub {
          color: #888;
          font-size: 0.88rem;
          margin-bottom: 28px;
        }

        /* Role toggle */
        .role-toggle {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
        }
        .role-btn {
          flex: 1;
          padding: 10px;
          border: 2px solid #eee;
          border-radius: 12px;
          background: #fafafa;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .role-btn.active {
          border-color: #6C5CE7;
          background: rgba(108,92,231,0.07);
          color: #6C5CE7;
          font-weight: 600;
        }
        .role-btn:hover:not(.active) {
          border-color: #ccc;
          background: #f5f5f5;
        }

        /* Fields */
        .reg-field {
          margin-bottom: 16px;
        }
        .reg-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          color: #444;
          margin-bottom: 6px;
        }
        .reg-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #eee;
          border-radius: 12px;
          font-size: 0.92rem;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a2e;
          background: #fafafa;
          outline: none;
          transition: all 0.2s;
        }
        .reg-input:focus {
          border-color: #6C5CE7;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(108,92,231,0.08);
        }
        .reg-helper {
          font-size: 0.75rem;
          color: #aaa;
          margin-top: 4px;
        }

        .reg-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #6C5CE7, #4834d4);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 6px;
          transition: all 0.25s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .reg-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(108,92,231,0.35);
        }
        .reg-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .reg-error {
          background: #fff0f0;
          border: 1px solid #ffd0d0;
          color: #c0392b;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.85rem;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .reg-login-link {
          text-align: center;
          color: #888;
          font-size: 0.85rem;
          margin-top: 20px;
        }
        .reg-login-link a {
          color: #6C5CE7;
          font-weight: 600;
          text-decoration: none;
        }
        .reg-login-link a:hover { text-decoration: underline; }

        @media (max-width: 768px) {
          .reg-left { display: none; }
          .reg-right { padding: 24px; }
        }
      `}</style>

      <div className="reg-root">

        {/* ── LEFT ── */}
        <div className="reg-left">
          <div className="reg-brand">Talent<span>Match</span></div>
          <div className="reg-brand-sub">Rejoignez la plateforme intelligente</div>

          <svg className="reg-illustration" viewBox="0 0 340 280" fill="none">
            <ellipse cx="170" cy="255" rx="130" ry="16" fill="rgba(255,255,255,0.08)"/>

            {/* Main person */}
            <circle cx="170" cy="80" r="32" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
            <circle cx="170" cy="68" r="16" fill="rgba(255,255,255,0.5)"/>
            <path d="M138 120 Q170 105 202 120 L198 200 L142 200 Z" fill="rgba(255,255,255,0.2)"/>

            {/* CV document */}
            <rect x="60" y="100" width="90" height="120" rx="8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <rect x="72" y="115" width="50" height="5" rx="2.5" fill="rgba(168,237,234,0.8)"/>
            <rect x="72" y="126" width="65" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/>
            <rect x="72" y="134" width="55" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>
            <rect x="72" y="142" width="60" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>
            <rect x="72" y="155" width="40" height="3" rx="1.5" fill="rgba(168,237,234,0.5)"/>
            <rect x="72" y="163" width="65" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/>
            <rect x="72" y="171" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/>
            <rect x="72" y="183" width="55" height="6" rx="3" fill="rgba(168,237,234,0.4)"/>

            {/* Match arrow */}
            <path d="M158 160 L182 160" stroke="rgba(168,237,234,0.8)" strokeWidth="2" strokeDasharray="4 2"/>
            <polygon points="182,156 190,160 182,164" fill="rgba(168,237,234,0.8)"/>

            {/* Job card */}
            <rect x="192" y="120" width="90" height="80" rx="8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <rect x="202" y="133" width="50" height="5" rx="2.5" fill="rgba(168,237,234,0.8)"/>
            <rect x="202" y="144" width="68" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/>
            <rect x="202" y="152" width="55" height="3" rx="1.5" fill="rgba(255,255,255,0.3)"/>
            <rect x="202" y="163" width="60" height="8" rx="4" fill="rgba(168,237,234,0.3)" stroke="rgba(168,237,234,0.5)" strokeWidth="1"/>

            {/* Score badge */}
            <circle cx="282" cy="90" r="24" fill="rgba(168,237,234,0.2)" stroke="rgba(168,237,234,0.6)" strokeWidth="2"/>
            <text x="282" y="95" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">92%</text>

            {/* Check */}
            <circle cx="60" cy="230" r="18" fill="#a8edea"/>
            <path d="M52 230 L58 236 L70 222" stroke="#4834d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          <div className="reg-steps">
            {[
              ["1", "Créez votre profil en 2 minutes"],
              ["2", "Notre IA analyse vos compétences"],
              ["3", "Recevez des matchs personnalisés"],
            ].map(([n, t]) => (
              <div className="reg-step" key={n}>
                <div className="reg-step-num">{n}</div>
                <div className="reg-step-text">{t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="reg-right">
          <div className="reg-wrapper">
            <div className="reg-title">Créer un compte ✨</div>
            <div className="reg-sub">Rejoignez des milliers de talents et recruteurs</div>

            {/* Role toggle */}
            <div className="role-toggle">
              {[["CANDIDAT","👤","Candidat"],["RECRUTEUR","🏢","Recruteur"]].map(([v,ic,lb]) => (
                <button
                  key={v}
                  className={`role-btn ${role === v ? "active" : ""}`}
                  onClick={() => setRole(v)}
                >
                  {ic} {lb}
                </button>
              ))}
            </div>

            {error && <div className="reg-error">⚠️ {error}</div>}



            <div className="reg-field">
              <label className="reg-label">Nom complet</label>
              <input className="reg-input" type="text" placeholder="Votre nom"
                value={form.nom} onChange={handleChange("nom")} />
            </div>

            <div className="reg-field">
              <label className="reg-label">Adresse email</label>
              <input className="reg-input" type="email" placeholder="vous@exemple.com"
                value={form.email} onChange={handleChange("email")} />
            </div>

            <div className="reg-field">
              <label className="reg-label">Mot de passe</label>
              <input className="reg-input" type="password" placeholder="Min 6 caractères"
                value={form.password} onChange={handleChange("password")} />
            </div>

            <div className="reg-field">
              <label className="reg-label">Confirmer mot de passe</label>
              <input className="reg-input" type="password" placeholder="••••••••"
                value={form.confirmPassword} onChange={handleChange("confirmPassword")}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()} />
            </div>

            <button className="reg-btn" onClick={handleRegister} disabled={loading}>
              {loading
                ? <><CircularProgress size={18} sx={{ color: "#fff" }} /> Création...</>
                : "Créer mon compte →"}
            </button>

            <div className="reg-login-link">
              Déjà un compte ?{" "}
              <Link to="/login">Se connecter</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}