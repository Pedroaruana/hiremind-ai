import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://hiremind-ai-production.up.railway.app";

/* ── helpers ─────────────────────────────────────────── */
function scoreColor(score) {
  if (score >= 80) return { bar: "#10b981", text: "#10b981", bg: "rgba(16,185,129,0.12)" };
  if (score >= 60) return { bar: "#f59e0b", text: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return { bar: "#ef4444", text: "#ef4444", bg: "rgba(239,68,68,0.12)" };
}

function scoreLabel(score) {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Regular";
  return "Fraco";
}

function ScoreRing({ score = 0 }) {
  const r = 36; const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const col = scoreColor(score);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke={col.bar} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x="48" y="44" textAnchor="middle" fill={col.text} fontSize="16" fontWeight="700" fontFamily="'Sora',sans-serif">{score}</text>
      <text x="48" y="58" textAnchor="middle" fill="rgba(200,200,240,0.5)" fontSize="9" fontFamily="'Sora',sans-serif">{scoreLabel(score)}</text>
    </svg>
  );
}

const SKILL_WIDTHS = [90, 75, 82, 68, 95, 71, 85, 78, 65, 88];

function SkillBar({ skill, index }) {
  const colors = ["#8b5cf6","#3b82f6","#10b981","#f59e0b","#ec4899","#06b6d4"];
  const color = colors[index % colors.length];
  const width = SKILL_WIDTHS[index % SKILL_WIDTHS.length];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
      <div style={{ fontSize: "12px", color: "rgba(200,200,240,0.7)", width: "110px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{skill}</div>
      <div style={{ flex: 1, height: "5px", borderRadius: "99px", background: "rgba(255,255,255,0.07)" }}>
        <div style={{ height: "100%", borderRadius: "99px", background: color, width: `${width}%`, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function TipCard({ tip, index }) {
  const icons = ["💡","🎯","✨","🔍","📌","🚀"];
  return (
    <div style={styles.tipCard}>
      <span style={styles.tipIcon}>{icons[index % icons.length]}</span>
      <p style={styles.tipText}>{tip}</p>
    </div>
  );
}

function CVCard({ cv, isActive, onClick }) {
  const analysis = cv.ai_analysis || {};
  const score = analysis.score ?? 0;
  const col = scoreColor(score);
  const role = analysis.role || analysis.cargo || analysis.position || "Cargo não identificado";
  const name = analysis.name || analysis.nome || cv.filename || `CV #${cv.file_id?.slice(-4) || "0000"}`;

  return (
    <div style={{ ...styles.cvCard, ...(isActive ? styles.cvCardActive : {}) }} onClick={onClick}>
      <div style={styles.cvCardHeader}>
        <div style={styles.cvAvatar}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.cvName}>{name}</div>
          <div style={styles.cvRole}>{role}</div>
        </div>
        <div style={{ ...styles.cvScoreBadge, background: col.bg, color: col.text }}>
          {score}
        </div>
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────────── */
export default function Dashboard() {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(!!token);
  const [selectedId, setSelectedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const token = localStorage.getItem("token");
  const selected = cvs.find((c) => c.file_id === selectedId);
  const analysis = selected?.ai_analysis || {};

  const score = analysis.score ?? 0;
  const role = analysis.role || analysis.cargo || analysis.position || "Cargo não identificado";
  const name = analysis.name || analysis.nome || selected?.filename || "Candidato";
  const skills = analysis.skills || analysis.habilidades || [];
  const tips = analysis.tips || analysis.dicas || analysis.suggestions || [];
  const summary = analysis.summary || analysis.resumo || analysis.about || "";
  const education = analysis.education || analysis.educacao || [];
  const experience = analysis.experience || analysis.experiencia || [];
  const languages = analysis.languages || analysis.idiomas || [];

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/cv/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setCvs(data);
        setSelectedId(data.length > 0 ? data[0].file_id : null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [token]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      await axios.post(`${API_URL}/cv/upload`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const res = await axios.get(`${API_URL}/cv/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = Array.isArray(res.data) ? res.data : [];
      setCvs(data);
      if (data.length > 0) setSelectedId(data[0].file_id);
    } catch (_) {
      setUploadError("Erro ao enviar CV. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .upload-btn:hover { background: rgba(139,92,246,0.2) !important; border-color: rgba(139,92,246,0.6) !important; }
        .cv-card-item:hover { background: rgba(255,255,255,0.06) !important; }
        .logout-btn:hover { background: rgba(239,68,68,0.1) !important; color: #fca5a5 !important; }
        .action-btn:hover { background: rgba(139,92,246,0.15) !important; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? "280px" : "64px" }}>
        {/* Logo */}
        <div style={styles.sidebarTop}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            </div>
            {sidebarOpen && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={styles.logoText}>HireMind</span>
                <span style={styles.logoBadge}>AI</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.collapseBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "0.2s" }}>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Upload */}
        {sidebarOpen && (
          <label style={styles.uploadLabel} className="upload-btn">
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} style={{ display: "none" }} />
            {uploading ? (
              <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(139,92,246,0.4)", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span>{uploading ? "Enviando..." : "Enviar CV"}</span>
          </label>
        )}
        {uploadError && sidebarOpen && <p style={{ color: "#fca5a5", fontSize: "11px", padding: "0 16px 8px", lineHeight: "1.4" }}>{uploadError}</p>}

        {/* CV List */}
        {sidebarOpen && (
          <div style={styles.sidebarSection}>
            <p style={styles.sidebarSectionLabel}>
              Meus Currículos
              <span style={styles.countBadge}>{cvs.length}</span>
            </p>
            <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
              {loading ? (
                [0,1,2].map(i => (
                  <div key={i} style={styles.skelRow}>
                    <div style={{ ...styles.skel, width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ ...styles.skel, width: "70%", height: "12px", marginBottom: "6px" }} />
                      <div style={{ ...styles.skel, width: "50%", height: "10px" }} />
                    </div>
                  </div>
                ))
              ) : cvs.length === 0 ? (
                <div style={styles.emptyState}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 8px", display: "block", color: "rgba(200,200,240,0.3)" }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p>Nenhum CV ainda.<br/>Envie seu primeiro!</p>
                </div>
              ) : (
                cvs.map((cv) => (
                  <CVCard
                    key={cv.file_id}
                    cv={cv}
                    isActive={selectedId === cv.file_id}
                    onClick={() => setSelectedId(cv.file_id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={handleLogout} style={styles.logoutBtn} className="logout-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {sidebarOpen && <span>Sair</span>}
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={styles.main}>
        {!selected && !loading ? (
          <div style={styles.emptyMain}>
            <div style={styles.emptyMainIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: "rgba(139,92,246,0.5)" }}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "700", marginBottom: "10px" }}>
              Nenhum currículo selecionado
            </h2>
            <p style={{ color: "rgba(200,200,240,0.5)", fontSize: "15px" }}>
              Envie um CV usando o botão na barra lateral para começar a análise.
            </p>
          </div>
        ) : selected ? (
          <div style={{ animation: "fadeUp 0.4s ease both" }}>
            {/* Header */}
            <div style={styles.contentHeader}>
              <div style={styles.headerLeft}>
                <div style={styles.headerAvatar}>{name.charAt(0).toUpperCase()}</div>
                <div>
                  <h1 style={styles.headerName}>{name}</h1>
                  <p style={styles.headerRole}>{role}</p>
                </div>
              </div>
              <div style={styles.headerActions}>
                <button style={styles.actionBtn} className="action-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Exportar
                </button>
              </div>
            </div>

            {/* Top grid: Score + Stats */}
            <div style={styles.topGrid}>
              {/* Score card */}
              <div style={styles.scoreCard}>
                <p style={styles.cardLabel}>Score Geral</p>
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <ScoreRing score={score} />
                  <div>
                    <div style={{ ...styles.scoreBigNum, color: scoreColor(score).text }}>{score}/100</div>
                    <div style={{ ...styles.scoreLabelBig, color: scoreColor(score).text }}>
                      {scoreLabel(score)}
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(200,200,240,0.4)", marginTop: "4px" }}>
                      Baseado em análise de IA
                    </div>
                  </div>
                </div>
                {/* Mini sub-scores */}
                <div style={styles.subScores}>
                  {[
                    { label: "Formato", v: Math.min(100, score + 8) },
                    { label: "Conteúdo", v: Math.max(30, score - 5) },
                    { label: "Keywords", v: Math.min(100, score + 15) },
                  ].map(({ label, v }) => {
                    const c = scoreColor(v);
                    return (
                      <div key={label} style={styles.subScore}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "11px", color: "rgba(200,200,240,0.5)" }}>{label}</span>
                          <span style={{ fontSize: "11px", color: c.text, fontWeight: "600" }}>{v}</span>
                        </div>
                        <div style={{ height: "3px", background: "rgba(255,255,255,0.07)", borderRadius: "99px" }}>
                          <div style={{ width: `${v}%`, height: "100%", background: c.bar, borderRadius: "99px", transition: "width 1s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              {summary && (
                <div style={styles.summaryCard}>
                  <p style={styles.cardLabel}>Resumo do Candidato</p>
                  <p style={styles.summaryText}>{summary}</p>
                  {languages.length > 0 && (
                    <div style={{ marginTop: "16px" }}>
                      <p style={{ ...styles.cardLabel, marginBottom: "8px" }}>Idiomas</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {languages.map((lang, i) => (
                          <span key={i} style={styles.langChip}>{typeof lang === "object" ? `${lang.name || lang.idioma} — ${lang.level || lang.nivel || ""}` : lang}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Middle grid: Skills + Tips */}
            <div style={styles.midGrid}>
              {/* Skills */}
              <div style={styles.glassCard}>
                <div style={styles.cardHead}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#8b5cf6" strokeWidth="1.8" fill="none"/>
                  </svg>
                  <p style={styles.cardLabel}>Habilidades Detectadas</p>
                  <span style={styles.countPill}>{skills.length}</span>
                </div>
                {skills.length > 0 ? (
                  <div style={{ marginTop: "12px" }}>
                    {skills.map((skill, i) => (
                      <SkillBar key={i} skill={skill} index={i} />
                    ))}
                  </div>
                ) : (
                  <div style={styles.skillTags}>
                    {["Análise de dados","Comunicação","Liderança","Problem-solving"].map((s, i) => (
                      <span key={s} style={{ ...styles.skillTag, borderColor: ["#8b5cf6","#3b82f6","#10b981","#f59e0b"][i] + "55", color: ["#a78bfa","#60a5fa","#34d399","#fbbf24"][i] }}>
                        {s}
                      </span>
                    ))}
                    <p style={{ fontSize: "11px", color: "rgba(200,200,240,0.3)", marginTop: "8px", width: "100%" }}>Nenhuma skill extraída pela IA</p>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div style={styles.glassCard}>
                <div style={styles.cardHead}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="1.8"/>
                    <path d="M12 8v4M12 16h.01" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p style={styles.cardLabel}>Dicas de Melhoria</p>
                  <span style={{ ...styles.countPill, background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>{tips.length}</span>
                </div>
                {tips.length > 0 ? (
                  <div style={{ marginTop: "12px" }}>
                    {tips.map((tip, i) => (
                      <TipCard key={i} tip={typeof tip === "object" ? tip.text || tip.dica || JSON.stringify(tip) : tip} index={i} />
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: "12px" }}>
                    {[
                      "Adicione um resumo profissional no topo do currículo com seus principais diferenciais.",
                      "Use verbos de ação para descrever suas experiências (liderou, desenvolveu, aumentou).",
                      "Quantifique suas conquistas sempre que possível (ex: aumentei vendas em 30%).",
                    ].map((tip, i) => <TipCard key={i} tip={tip} index={i} />)}
                    <p style={{ fontSize: "11px", color: "rgba(200,200,240,0.3)", marginTop: "4px" }}>Dicas genéricas — análise de IA não retornou dicas específicas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Experience + Education */}
            {(experience.length > 0 || education.length > 0) && (
              <div style={styles.bottomGrid}>
                {experience.length > 0 && (
                  <div style={styles.glassCard}>
                    <div style={styles.cardHead}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="7" width="20" height="14" rx="2" stroke="#3b82f6" strokeWidth="1.8"/>
                        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#3b82f6" strokeWidth="1.8"/>
                      </svg>
                      <p style={styles.cardLabel}>Experiência</p>
                    </div>
                    <div style={{ marginTop: "12px" }}>
                      {experience.map((exp, i) => (
                        <div key={i} style={styles.timelineItem}>
                          <div style={styles.timelineDot} />
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>
                              {typeof exp === "object" ? (exp.company || exp.empresa || exp.title || JSON.stringify(exp)) : exp}
                            </p>
                            {typeof exp === "object" && (exp.role || exp.cargo) && (
                              <p style={{ fontSize: "12px", color: "rgba(200,200,240,0.5)", marginTop: "2px" }}>{exp.role || exp.cargo}</p>
                            )}
                            {typeof exp === "object" && (exp.period || exp.periodo) && (
                              <p style={{ fontSize: "11px", color: "rgba(200,200,240,0.35)", marginTop: "2px" }}>{exp.period || exp.periodo}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {education.length > 0 && (
                  <div style={styles.glassCard}>
                    <div style={styles.cardHead}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      <p style={styles.cardLabel}>Educação</p>
                    </div>
                    <div style={{ marginTop: "12px" }}>
                      {education.map((edu, i) => (
                        <div key={i} style={styles.timelineItem}>
                          <div style={{ ...styles.timelineDot, background: "#10b981" }} />
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>
                              {typeof edu === "object" ? (edu.institution || edu.instituicao || edu.course || edu.curso || JSON.stringify(edu)) : edu}
                            </p>
                            {typeof edu === "object" && (edu.degree || edu.grau || edu.course || edu.curso) && (
                              <p style={{ fontSize: "12px", color: "rgba(200,200,240,0.5)", marginTop: "2px" }}>{edu.degree || edu.grau || edu.course || edu.curso}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

/* ── styles ──────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #0d1b3e 100%)",
    fontFamily: "'Sora', sans-serif",
    display: "flex",
    overflow: "hidden",
  },
  sidebar: {
    height: "100vh",
    background: "rgba(255,255,255,0.03)",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.25s ease",
    overflow: "hidden",
    flexShrink: 0,
    position: "sticky",
    top: 0,
  },
  sidebarTop: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 16px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: "12px",
  },
  logoRow: { display: "flex", alignItems: "center", gap: "10px" },
  logoIcon: {
    width: "32px", height: "32px", borderRadius: "8px",
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  logoText: { fontSize: "16px", fontWeight: "700", color: "#fff" },
  logoBadge: {
    fontSize: "9px", fontWeight: "700",
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    color: "#fff", padding: "2px 6px", borderRadius: "20px", letterSpacing: "1px",
  },
  collapseBtn: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "6px", color: "rgba(200,200,240,0.5)",
    width: "24px", height: "24px", display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer", flexShrink: 0,
  },
  uploadLabel: {
    display: "flex", alignItems: "center", gap: "8px",
    margin: "0 12px 12px",
    background: "rgba(139,92,246,0.08)",
    border: "1px dashed rgba(139,92,246,0.35)",
    borderRadius: "10px",
    color: "#a78bfa", fontSize: "13px", fontWeight: "500",
    padding: "10px 14px", cursor: "pointer",
    transition: "all 0.2s",
  },
  sidebarSection: { flex: 1, overflow: "hidden", padding: "0 12px" },
  sidebarSectionLabel: {
    fontSize: "10px", fontWeight: "700", letterSpacing: "1px",
    color: "rgba(200,200,240,0.35)", textTransform: "uppercase",
    marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  countBadge: {
    background: "rgba(139,92,246,0.15)", color: "#a78bfa",
    fontSize: "10px", padding: "1px 6px", borderRadius: "10px", fontWeight: "600",
  },
  cvCard: {
    borderRadius: "10px", padding: "10px",
    cursor: "pointer", marginBottom: "4px",
    transition: "all 0.15s",
    background: "transparent",
  },
  cvCardActive: {
    background: "rgba(139,92,246,0.12)",
    border: "1px solid rgba(139,92,246,0.25)",
  },
  cvCardHeader: { display: "flex", alignItems: "center", gap: "8px" },
  cvAvatar: {
    width: "32px", height: "32px", borderRadius: "50%",
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "13px", fontWeight: "700", color: "#fff", flexShrink: 0,
  },
  cvName: { fontSize: "12px", fontWeight: "600", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cvRole: { fontSize: "10px", color: "rgba(200,200,240,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cvScoreBadge: {
    fontSize: "11px", fontWeight: "700", borderRadius: "6px",
    padding: "2px 6px", flexShrink: 0,
  },
  logoutBtn: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "transparent", border: "none",
    color: "rgba(200,200,240,0.4)", fontSize: "13px",
    cursor: "pointer", padding: "16px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    width: "100%", transition: "all 0.2s", fontFamily: "'Sora', sans-serif",
    marginTop: "auto",
  },
  skelRow: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 0" },
  skel: {
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "400px 100%",
    animation: "shimmer 1.4s ease-in-out infinite",
    borderRadius: "6px",
  },
  emptyState: {
    textAlign: "center", padding: "24px 8px",
    color: "rgba(200,200,240,0.3)", fontSize: "12px", lineHeight: "1.6",
  },
  main: {
    flex: 1, overflowY: "auto", padding: "28px 32px",
    maxHeight: "100vh",
  },
  emptyMain: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    minHeight: "60vh", textAlign: "center",
  },
  emptyMainIcon: {
    width: "80px", height: "80px", borderRadius: "20px",
    background: "rgba(139,92,246,0.08)",
    border: "1px solid rgba(139,92,246,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: "20px",
  },
  contentHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: "24px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "14px" },
  headerAvatar: {
    width: "48px", height: "48px", borderRadius: "14px",
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "20px", fontWeight: "700", color: "#fff",
  },
  headerName: { fontSize: "22px", fontWeight: "700", color: "#fff", letterSpacing: "-0.3px" },
  headerRole: { fontSize: "13px", color: "rgba(200,200,240,0.5)", marginTop: "2px" },
  headerActions: { display: "flex", gap: "8px" },
  actionBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", color: "rgba(200,200,240,0.7)",
    fontSize: "12px", padding: "8px 14px", cursor: "pointer",
    fontFamily: "'Sora', sans-serif", transition: "all 0.2s",
  },
  topGrid: {
    display: "grid", gridTemplateColumns: "260px 1fr", gap: "16px",
    marginBottom: "16px",
  },
  scoreCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px", padding: "20px",
  },
  cardLabel: {
    fontSize: "10px", fontWeight: "700", letterSpacing: "1px",
    color: "rgba(200,200,240,0.4)", textTransform: "uppercase", marginBottom: "14px",
  },
  scoreBigNum: { fontSize: "28px", fontWeight: "700", lineHeight: 1 },
  scoreLabelBig: { fontSize: "13px", fontWeight: "600", marginTop: "4px" },
  subScores: { marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "14px" },
  subScore: { marginBottom: "10px" },
  summaryCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px", padding: "20px",
  },
  summaryText: { fontSize: "13px", color: "rgba(200,200,240,0.65)", lineHeight: "1.7" },
  langChip: {
    fontSize: "11px", padding: "4px 10px", borderRadius: "20px",
    background: "rgba(139,92,246,0.12)", color: "#a78bfa",
    border: "1px solid rgba(139,92,246,0.25)",
  },
  midGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" },
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  glassCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px", padding: "20px",
  },
  cardHead: { display: "flex", alignItems: "center", gap: "8px" },
  countPill: {
    marginLeft: "auto",
    background: "rgba(139,92,246,0.15)", color: "#a78bfa",
    fontSize: "10px", padding: "2px 8px", borderRadius: "10px", fontWeight: "600",
  },
  skillTags: { display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" },
  skillTag: {
    fontSize: "12px", padding: "4px 10px", borderRadius: "6px",
    border: "1px solid", background: "transparent",
  },
  tipCard: {
    display: "flex", gap: "10px", alignItems: "flex-start",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "10px", padding: "10px 12px",
    marginBottom: "8px",
  },
  tipIcon: { fontSize: "14px", flexShrink: 0, marginTop: "1px" },
  tipText: { fontSize: "12px", color: "rgba(200,200,240,0.65)", lineHeight: "1.6" },
  timelineItem: {
    display: "flex", gap: "12px", alignItems: "flex-start",
    paddingBottom: "12px", marginBottom: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  timelineDot: {
    width: "8px", height: "8px", borderRadius: "50%",
    background: "#8b5cf6", flexShrink: 0, marginTop: "5px",
  },
};