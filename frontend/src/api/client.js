import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

// Interceptor JWT
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login    = (email, password) =>
  API.post("/api/auth/login", { email, password });

export const register = (email, password, nom, role) =>
  API.post("/api/auth/register", { email, password, nom, role });

// Matching
export const matchCVtoOffres = (candidate_id, top_n = 5) =>
  API.get(`/api/matching/cv/${candidate_id}?topN=${top_n}`);

export const matchOffreToCVs = (job_id, top_n = 5) =>
  API.get(`/api/matching/offre/${job_id}?topN=${top_n}`);

export const semanticSearch = (query, top_n = 5) =>
  API.get(`/api/matching/search?query=${encodeURIComponent(query)}&topN=${top_n}`);

// Analytics
export const getSkillGap = (top_n = 20, filtre = "all") =>
  API.get(`/api/analytics/skill-gap?topN=${top_n}&filtre=${filtre}`);

export const getTurnoverRisk = (candidate_id) =>
  API.get(`/api/analytics/turnover/${candidate_id}`);

export const getMarketSkills = (top_n = 10) =>    // ← nouveau
  API.get(`/api/analytics/marche-skills?top_n=${top_n}`);

export const getCartographie = (top_n = 20) =>    // ← nouveau
  API.get(`/api/analytics/cartographie-skills?top_n=${top_n}`);


// ── CANDIDAT ──────────────────────────────────
export const uploadCV = (candidateId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post(`/api/candidat/upload-cv/${candidateId}`,
    formData, { headers: { "Content-Type": "multipart/form-data" } }
  );
};

export const getTalentScore = (candidateId) =>
  API.get(`/api/candidat/talent-score/${candidateId}`);

export const getOffresRecommandees = (candidateId, topN = 5) =>
  API.get(`/api/candidat/offres/${candidateId}?topN=${topN}`);

export const getOrientation = (candidateId) =>
  API.get(`/api/candidat/orientation/${candidateId}`);

// ── OFFRES ────────────────────────────────────
export const publierOffre = (data) =>
  API.post("/api/offres", data);

export const getOffres = (page=1, limit=10, secteur="",
                          localisation="", niveau="") =>
  API.get(`/api/offres?page=${page}&limit=${limit}` +
          `&secteur=${secteur}&localisation=${localisation}&niveau=${niveau}`);

export const getDashboardStats = () =>
  API.get("/api/offres/stats");

// ── ADMIN ─────────────────────────────────────
export const getAdminUsers = () =>
  API.get("/api/admin/users");

export const updateUserRole = (userId, role) =>
  API.put(`/api/admin/users/${userId}/role`, { role });

export const deleteUser = (userId) =>
  API.delete(`/api/admin/users/${userId}`);

export const getMonitoring = () =>
  API.get("/api/admin/monitoring");

export const getMonitoringML = () =>
  API.get("/api/admin/monitoring-ml");

export const getDrift = () =>
  API.get("/api/admin/drift");

export default API;