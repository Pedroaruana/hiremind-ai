import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://hiremind-ai-production.up.railway.app";

const SKILL_WIDTHS = [90, 75, 82, 68, 95, 71, 85, 78, 65, 88];
const SKILL_COLORS = ["#8b5cf6","#3b82f6","#10b981","#f59e0b","#ec4899","#06b6d4"];
const TIP_ICONS = ["💡","🎯","✨","🔍","📌","🚀"];

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

function ScoreRing({ score }) {
  const s = score || 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = (s / 100) * circ;
  const col = scoreColor(s);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke={col.bar} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="44" textAnchor="middle" fill={col.text} fontSize="16" fontWeight="700" fontFamily="Sora,sans-serif">{s}</text>
      <text x="48" y="58" textAnchor="middle" fill="rgba(200,200,240,0.5)" fontSize="9" fontFamily="Sora,sans-serif">{scoreLabel(s)}</text>
    </svg>
  );
}

function SkillBar({ skill, index }) {
  const color = SKILL_COLORS[index % SKILL_COLORS.length];
  const width = SKILL_WIDTHS[index % SKILL_WIDTHS.length];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
      <div style={{ fontSize:"12px", color:"rgba(200,200,240,0.7)", width:"110px", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{skill}</div>
      <div style={{ flex:1, height:"5px", borderRadius:"99px", background:"rgba(255,255,255,0.07)" }}>
        <div style={{ height:"100%", borderRadius:"99px", background:color, width:`${width}%` }} />
      </div>
    </div>
  );
}

function TipCard({ tip, index }) {
  return (
    <div style={{ display:"flex", gap:"10px", alignItems:"flex-start", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"10px", padding:"10px 12px", marginBottom:"8px" }}>
      <span style={{ fontSize:"14px", flexShrink:0 }}>{TIP_ICONS[index % TIP_ICONS.length]}</span>
      <p style={{ fontSize:"12px", color:"rgba(200,200,240,0.65)", lineHeight:"1.6", margin:0 }}>{tip}</p>
    </div>
  );
}

function CVItem({ cv, isActive, onClick }) {
  const analysis = cv.ai_analysis || {};
  const score = analysis.score || 0;
  const col = scoreColor(score);
  const role = analysis.role || analysis.cargo || analysis.position || "Cargo não identificado";
  const name = analysis.name || analysis.nome || cv.filename || `CV #${String(cv.file_id || "").slice(-4) || "0000"}`;
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius:"10px", padding:"10px", cursor:"pointer", marginBottom:"4px",
        background: isActive ? "rgba(139,92,246,0.12)" : "transparent",
        border: isActive ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
        <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:"700", color:"#fff", flexShrink:0 }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:"12px", fontWeight:"600", color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
          <div style={{ fontSize:"10px", color:"rgba(200,200,240,0.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{role}</div>
        </div>
        <div style={{ fontSize:"11px", fontWeight:"700", borderRadius:"6px", padding:"2px 6px", background:col.bg, color:col.text, flexShrink:0 }}>{score}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const token = localStorage.getItem("token");

  const selected = cvs.find((c) => c.file_id === selectedId) || null;
  const analysis = selected ? (selected.ai_analysis || {}) : {};

  const score = analysis.score || 0;
  const role = analysis.role || analysis.cargo || analysis.position || "Cargo não identificado";
  const name = analysis.name || analysis.nome || (selected && selected.filename) || "Candidato";
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
    if (!token) {
      setLoading(false);
      return;
    }
    axios
      .get(`${API_URL}/cv/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setCvs(data);
        setSelectedId(data.length > 0 ? data[0].file_id : null);
        setLoading(false);
      })
      .catch((_) => {
        setLoading(false);
      });
  }, [token]);

  const handleUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      await axios.post(`${API_URL}/cv/upload-cv`, fd, {
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

  // Por isso:
const subScores = [
  { label: "Formato",   v: analysis.format_score  ?? Math.min(100, score + 8) },
  { label: "Conteúdo",  v: analysis.content_score ?? Math.max(0, score - 5) },
  { label: "Keywords",  v: analysis.keyword_score ?? Math.min(100, score + 15) },
];


  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f0c29 0%,#1a1040 40%,#0d1b3e 100%)", fontFamily:"'Sora',sans-serif", display:"flex", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: sidebarOpen ? "280px" : "64px", height:"100vh", background:"rgba(255,255,255,0.03)", borderRight:"1px solid rgba(255,255,255,0.07)", display:"flex", flexDirection:"column", transition:"width 0.25s ease", overflow:"hidden", flexShrink:0, position:"sticky", top:0 }}>

        {/* Logo row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 16px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", marginBottom:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/></svg>
            </div>
            {sidebarOpen && <span style={{ fontSize:"16px", fontWeight:"700", color:"#fff" }}>HireMind <span style={{ fontSize:"9px", fontWeight:"700", background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", color:"#fff", padding:"2px 6px", borderRadius:"20px" }}>AI</span></span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"6px", color:"rgba(200,200,240,0.5)", width:"24px", height:"24px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)", transition:"0.2s" }}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Upload button */}
        {sidebarOpen && (
          <label style={{ display:"flex", alignItems:"center", gap:"8px", margin:"0 12px 12px", background:"rgba(139,92,246,0.08)", border:"1px dashed rgba(139,92,246,0.35)", borderRadius:"10px", color:"#a78bfa", fontSize:"13px", fontWeight:"500", padding:"10px 14px", cursor:"pointer" }}>
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} style={{ display:"none" }} />
            {uploading
              ? <span style={{ width:"14px", height:"14px", border:"2px solid rgba(139,92,246,0.4)", borderTopColor:"#8b5cf6", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
            {uploading ? "Enviando..." : "Enviar CV"}
          </label>
        )}
        {uploadError && sidebarOpen && <p style={{ color:"#fca5a5", fontSize:"11px", padding:"0 16px 8px", lineHeight:"1.4" }}>{uploadError}</p>}

        {/* CV list */}
        {sidebarOpen && (
          <div style={{ flex:1, overflow:"hidden", padding:"0 12px" }}>
            <p style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"1px", color:"rgba(200,200,240,0.35)", textTransform:"uppercase", marginBottom:"8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              Meus Currículos
              <span style={{ background:"rgba(139,92,246,0.15)", color:"#a78bfa", fontSize:"10px", padding:"1px 6px", borderRadius:"10px", fontWeight:"600" }}>{cvs.length}</span>
            </p>
            <div style={{ overflowY:"auto", maxHeight:"calc(100vh - 260px)" }}>
              {loading
                ? [0,1,2].map((i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 0" }}>
                    <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"rgba(255,255,255,0.06)", flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ width:"70%", height:"12px", borderRadius:"6px", background:"rgba(255,255,255,0.06)", marginBottom:"6px" }} />
                      <div style={{ width:"50%", height:"10px", borderRadius:"6px", background:"rgba(255,255,255,0.06)" }} />
                    </div>
                  </div>
                ))
                : cvs.length === 0
                  ? <p style={{ textAlign:"center", color:"rgba(200,200,240,0.3)", fontSize:"12px", padding:"24px 8px", lineHeight:"1.6" }}>Nenhum CV ainda.<br/>Envie seu primeiro!</p>
                  : cvs.map((cv) => (
                    <CVItem key={cv.file_id} cv={cv} isActive={selectedId === cv.file_id} onClick={() => setSelectedId(cv.file_id)} />
                  ))
              }
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:"8px", background:"transparent", border:"none", color:"rgba(200,200,240,0.4)", fontSize:"13px", cursor:"pointer", padding:"16px", borderTop:"1px solid rgba(255,255,255,0.06)", width:"100%", fontFamily:"'Sora',sans-serif", marginTop:"auto" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {sidebarOpen && "Sair"}
        </button>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, overflowY:"auto", padding:"28px 32px", maxHeight:"100vh" }}>
        {!selected && !loading && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", textAlign:"center" }}>
            <div style={{ width:"80px", height:"80px", borderRadius:"20px", background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"20px" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ color:"rgba(139,92,246,0.5)" }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <h2 style={{ color:"#fff", fontSize:"22px", fontWeight:"700", marginBottom:"10px" }}>Nenhum currículo selecionado</h2>
            <p style={{ color:"rgba(200,200,240,0.5)", fontSize:"15px" }}>Envie um CV usando o botão na barra lateral.</p>
          </div>
        )}

        {selected && (
          <div style={{ animation:"fadeUp 0.4s ease both" }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                <div style={{ width:"48px", height:"48px", borderRadius:"14px", background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", fontWeight:"700", color:"#fff" }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 style={{ fontSize:"22px", fontWeight:"700", color:"#fff", letterSpacing:"-0.3px" }}>{name}</h1>
                  <p style={{ fontSize:"13px", color:"rgba(200,200,240,0.5)", marginTop:"2px" }}>{role}</p>
                </div>
              </div>
            </div>

            {/* Score + Summary */}
            <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:"16px", marginBottom:"16px" }}>

              {/* Score card */}
              <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px", padding:"20px" }}>
                <p style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"1px", color:"rgba(200,200,240,0.4)", textTransform:"uppercase", marginBottom:"14px" }}>Score Geral</p>
                <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
                  <ScoreRing score={score} />
                  <div>
                    <div style={{ fontSize:"28px", fontWeight:"700", color: scoreColor(score).text, lineHeight:1 }}>{score}/100</div>
                    <div style={{ fontSize:"13px", fontWeight:"600", color: scoreColor(score).text, marginTop:"4px" }}>{scoreLabel(score)}</div>
                    <div style={{ fontSize:"11px", color:"rgba(200,200,240,0.35)", marginTop:"4px" }}>Análise por IA</div>
                  </div>
                </div>
                <div style={{ marginTop:"16px", borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:"14px" }}>
                  {subScores.map(({ label, v }) => (
                    <div key={label} style={{ marginBottom:"10px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                        <span style={{ fontSize:"11px", color:"rgba(200,200,240,0.45)" }}>{label}</span>
                        <span style={{ fontSize:"11px", fontWeight:"600", color: scoreColor(v).text }}>{v}</span>
                      </div>
                      <div style={{ height:"3px", background:"rgba(255,255,255,0.07)", borderRadius:"99px" }}>
                        <div style={{ width:`${v}%`, height:"100%", background: scoreColor(v).bar, borderRadius:"99px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px", padding:"20px" }}>
                <p style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"1px", color:"rgba(200,200,240,0.4)", textTransform:"uppercase", marginBottom:"10px" }}>Resumo do Candidato</p>
                {summary
                  ? <p style={{ fontSize:"13px", color:"rgba(200,200,240,0.65)", lineHeight:"1.7" }}>{summary}</p>
                  : <p style={{ fontSize:"13px", color:"rgba(200,200,240,0.25)", lineHeight:"1.7", fontStyle:"italic" }}>Nenhum resumo retornado pela análise de IA.</p>
                }
                {languages.length > 0 && (
                  <div style={{ marginTop:"16px" }}>
                    <p style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"1px", color:"rgba(200,200,240,0.4)", textTransform:"uppercase", marginBottom:"8px" }}>Idiomas</p>
                    <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                      {languages.map((lang, i) => (
                        <span key={i} style={{ fontSize:"11px", padding:"4px 10px", borderRadius:"20px", background:"rgba(139,92,246,0.12)", color:"#a78bfa", border:"1px solid rgba(139,92,246,0.25)" }}>
                          {typeof lang === "object" ? `${lang.name || lang.idioma || ""} ${lang.level || lang.nivel || ""}`.trim() : lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Skills + Tips */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>

              <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px", padding:"20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"14px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#8b5cf6" strokeWidth="1.8" fill="none"/></svg>
                  <p style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"1px", color:"rgba(200,200,240,0.4)", textTransform:"uppercase" }}>Habilidades</p>
                  <span style={{ marginLeft:"auto", background:"rgba(139,92,246,0.15)", color:"#a78bfa", fontSize:"10px", padding:"2px 7px", borderRadius:"10px", fontWeight:"600" }}>{skills.length}</span>
                </div>
                {skills.length > 0
                  ? skills.map((skill, i) => <SkillBar key={i} skill={skill} index={i} />)
                  : <p style={{ fontSize:"12px", color:"rgba(200,200,240,0.25)", fontStyle:"italic" }}>Nenhuma habilidade identificada pela IA.</p>
                }
              </div>

              <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px", padding:"20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"14px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/></svg>
                  <p style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"1px", color:"rgba(200,200,240,0.4)", textTransform:"uppercase" }}>Dicas de Melhoria</p>
                  <span style={{ marginLeft:"auto", background:"rgba(245,158,11,0.15)", color:"#fbbf24", fontSize:"10px", padding:"2px 7px", borderRadius:"10px", fontWeight:"600" }}>{tips.length}</span>
                </div>
                {tips.length > 0
                  ? tips.map((tip, i) => <TipCard key={i} tip={typeof tip === "object" ? tip.text || tip.dica || JSON.stringify(tip) : tip} index={i} />)
                  : <p style={{ fontSize:"12px", color:"rgba(200,200,240,0.25)", fontStyle:"italic" }}>Nenhuma dica retornada pela IA.</p>
                }
              </div>
            </div>

            {/* Experience + Education */}
            {(experience.length > 0 || education.length > 0) && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                {experience.length > 0 && (
                  <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px", padding:"20px" }}>
                    <p style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"1px", color:"rgba(200,200,240,0.4)", textTransform:"uppercase", marginBottom:"14px" }}>Experiência</p>
                    {experience.map((exp, i) => (
                      <div key={i} style={{ display:"flex", gap:"12px", alignItems:"flex-start", paddingBottom:"12px", marginBottom:"12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#8b5cf6", flexShrink:0, marginTop:"5px" }} />
                        <div>
                          <p style={{ fontSize:"13px", fontWeight:"600", color:"#fff" }}>{typeof exp === "object" ? (exp.company || exp.empresa || exp.title || JSON.stringify(exp)) : exp}</p>
                          {typeof exp === "object" && (exp.role || exp.cargo) && <p style={{ fontSize:"12px", color:"rgba(200,200,240,0.5)", marginTop:"2px" }}>{exp.role || exp.cargo}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {education.length > 0 && (
                  <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px", padding:"20px" }}>
                    <p style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"1px", color:"rgba(200,200,240,0.4)", textTransform:"uppercase", marginBottom:"14px" }}>Educação</p>
                    {education.map((edu, i) => (
                      <div key={i} style={{ display:"flex", gap:"12px", alignItems:"flex-start", paddingBottom:"12px", marginBottom:"12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#10b981", flexShrink:0, marginTop:"5px" }} />
                        <div>
                          <p style={{ fontSize:"13px", fontWeight:"600", color:"#fff" }}>{typeof edu === "object" ? (edu.institution || edu.instituicao || edu.course || edu.curso || JSON.stringify(edu)) : edu}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

