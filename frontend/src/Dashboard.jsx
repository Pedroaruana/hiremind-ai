import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { apiRequest } from "./apiClient";

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

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function CVItem({ cv, isActive, onClick }) {
  const analysis = cv.ai_analysis || {};
  const score = analysis.score || 0;
  const col = scoreColor(score);
  const role = analysis.role || analysis.cargo || analysis.position || "Cargo não identificado";
  const name = analysis.name || analysis.nome || cv.filename || `CV #${String(cv.file_id || "").slice(-4) || "0000"}`;
  const date = formatDate(cv.created_at);
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
          <div style={{ fontSize:"10px", color:"rgba(200,200,240,0.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {role}{date && <span style={{ marginLeft:"6px", opacity:0.6 }}>· {date}</span>}
          </div>
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
  const [deleting, setDeleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  const token = localStorage.getItem("token");
  const isGuest = !token && localStorage.getItem("guest") === "true";

  const username = isGuest ? "Visitante" : (() => {
    try {
      return JSON.parse(atob(token.split(".")[1])).sub || "";
    } catch {
      return "";
    }
  })();

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
    if (isGuest) {
      localStorage.removeItem("guest");
      localStorage.removeItem("guest_cvs");
    } else {
      localStorage.removeItem("token");
    }
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!selectedId || deleting) return;
    setDeleting(true);
    if (isGuest) {
      const updated = cvs.filter((c) => c.file_id !== selectedId);
      setCvs(updated);
      setSelectedId(updated.length > 0 ? updated[0].file_id : null);
      localStorage.setItem("guest_cvs", JSON.stringify(updated));
      setDeleting(false);
      return;
    }
    try {
      await apiRequest({
        method: "delete",
        url: `/cv/${selectedId}`,
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = cvs.filter((c) => c.file_id !== selectedId);
      setCvs(updated);
      setSelectedId(updated.length > 0 ? updated[0].file_id : null);
    } catch (_) {
      // silently ignore
    } finally {
      setDeleting(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const mg = 20;
    const cW = W - mg * 2;
    let y = 0;

    // Header
    doc.setFillColor(15, 12, 41);
    doc.rect(0, 0, W, 40, "F");
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 5, 40, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("HireMind AI", 14, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 200);
    doc.text("Relatório de Análise de Currículo", 14, 24);
    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    doc.setFontSize(8);
    doc.text(dateStr, W - mg, 24, { align: "right" });

    y = 52;

    // Candidate
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(20, 20, 40);
    doc.text(name, mg, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 130);
    doc.text(role, mg, y);
    y += 7;

    // Level badge
    const lvl = analysis.level || "Júnior";
    const lvlCol = lvl === "Sênior" ? [16, 185, 129] : lvl === "Pleno" ? [245, 158, 11] : [139, 92, 246];
    doc.setFillColor(...lvlCol);
    doc.rect(mg, y, 42, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Nível: ${lvl}`, mg + 21, y + 4, { align: "center" });
    y += 14;

    // Divider
    doc.setDrawColor(210, 210, 230);
    doc.setLineWidth(0.3);
    doc.line(mg, y, W - mg, y);
    y += 8;

    // Score
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 80, 160);
    doc.text("SCORE GERAL", mg, y);
    y += 7;

    const scoreCol3 = score >= 80 ? [16, 185, 129] : score >= 60 ? [245, 158, 11] : [239, 68, 68];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.setTextColor(...scoreCol3);
    doc.text(`${score}`, mg, y + 8);
    const scoreNumW = doc.getTextWidth(`${score}`);
    doc.setFontSize(13);
    doc.setTextColor(150, 150, 180);
    doc.text("/100", mg + scoreNumW + 1, y + 8);
    doc.setFontSize(10);
    doc.setTextColor(...scoreCol3);
    doc.text(scoreLabel(score), mg, y + 15);

    // Sub-score bars
    const bx = mg + 60;
    const bw = cW - 62;
    subScores.forEach(({ label, v }, idx) => {
      const by = y + idx * 11;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 100);
      doc.text(label, bx, by + 4);
      doc.setFillColor(220, 220, 235);
      doc.rect(bx + 22, by, bw - 30, 3.5, "F");
      const bc = v >= 80 ? [16, 185, 129] : v >= 60 ? [245, 158, 11] : [239, 68, 68];
      doc.setFillColor(...bc);
      doc.rect(bx + 22, by, (bw - 30) * v / 100, 3.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...bc);
      doc.text(`${v}`, W - mg, by + 4, { align: "right" });
    });

    y += 40;

    doc.setDrawColor(210, 210, 230);
    doc.line(mg, y, W - mg, y);
    y += 8;

    // Summary
    if (summary) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 80, 160);
      doc.text("RESUMO", mg, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 80);
      const lines = doc.splitTextToSize(summary, cW);
      doc.text(lines, mg, y);
      y += lines.length * 5 + 8;
      doc.setDrawColor(210, 210, 230);
      doc.line(mg, y, W - mg, y);
      y += 8;
    }

    // Skills
    if (skills.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 80, 160);
      doc.text(`HABILIDADES (${skills.length})`, mg, y);
      y += 6;
      let cx = mg;
      const chipH = 6;
      skills.forEach((sk) => {
        doc.setFontSize(8);
        const tw = doc.getTextWidth(sk) + 8;
        if (cx + tw > W - mg) { cx = mg; y += chipH + 3; }
        doc.setFillColor(230, 220, 255);
        doc.rect(cx, y, tw, chipH, "F");
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 60, 180);
        doc.text(sk, cx + 4, y + 4.2);
        cx += tw + 3;
      });
      y += chipH + 10;
      doc.setDrawColor(210, 210, 230);
      doc.line(mg, y, W - mg, y);
      y += 8;
    }

    // Tips
    if (tips.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 80, 160);
      doc.text("DICAS DE MELHORIA", mg, y);
      y += 6;
      tips.forEach((tip) => {
        const tipText = typeof tip === "object" ? (tip.text || tip.dica || "") : tip;
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFillColor(245, 158, 11);
        doc.rect(mg, y + 0.5, 2, 2, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 80);
        const tipLines = doc.splitTextToSize(tipText, cW - 8);
        doc.text(tipLines, mg + 6, y + 2.5);
        y += tipLines.length * 4.5 + 4;
      });
    }

    // Footer
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 220);
      doc.setLineWidth(0.2);
      doc.line(mg, 285, W - mg, 285);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 190);
      doc.text("Gerado por HireMind AI · hiremind-ai-fawn.vercel.app", mg, 290);
      doc.text(`Página ${i}/${pages}`, W - mg, 290, { align: "right" });
    }

    const safeName = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    doc.save(`analise-${safeName}.pdf`);
  };

  useEffect(() => {
    if (isGuest) {
      try {
        const stored = JSON.parse(localStorage.getItem("guest_cvs") || "[]");
        const data = Array.isArray(stored) ? stored : [];
        setCvs(data);
        setSelectedId(data.length > 0 ? data[0].file_id : null);
      } catch {
        setCvs([]);
      }
      setLoading(false);
      return;
    }
    if (!token) { setLoading(false); return; }
    apiRequest({ method: "get", url: "/cv/me", headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setCvs(data);
        setSelectedId(data.length > 0 ? data[0].file_id : null);
        setLoading(false);
      })
      .catch((_) => { setLoading(false); });
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (isGuest && cvs.length >= 10) {
      setUploadError("Limite de 10 currículos atingido. Delete um antes de enviar outro.");
      return;
    }
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      if (isGuest) {
        const res = await apiRequest({
          method: "post",
          url: "/cv/analyze-guest",
          data: fd,
          headers: { "Content-Type": "multipart/form-data" },
        });
        const newCv = {
          file_id: res.data.file_id,
          ai_analysis: res.data.ai_analysis,
          created_at: new Date().toISOString(),
        };
        const updated = [newCv, ...cvs];
        setCvs(updated);
        setSelectedId(newCv.file_id);
        localStorage.setItem("guest_cvs", JSON.stringify(updated));
      } else {
        await apiRequest({
          method: "post",
          url: "/cv/upload-cv",
          data: fd,
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        const res = await apiRequest({ method: "get", url: "/cv/me", headers: { Authorization: `Bearer ${token}` } });
        const data = Array.isArray(res.data) ? res.data : [];
        setCvs(data);
        if (data.length > 0) setSelectedId(data[0].file_id);
      }
    } catch (err) {
      const msg = err?.response?.data?.detail;
      setUploadError(msg || "Erro ao enviar CV. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const statsData = (() => {
    if (cvs.length === 0) return null;
    const scores = cvs.map(c => (c.ai_analysis || {}).score || 0).filter(s => s > 0);
    return {
      total: cvs.length,
      average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      best: scores.length ? Math.max(...scores) : 0,
    };
  })();

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
        @media(max-width:768px){
          .dash-main{padding:16px 14px!important;}
          .grid-score{grid-template-columns:1fr!important;}
          .grid-skills{grid-template-columns:1fr!important;}
          .grid-exp{grid-template-columns:1fr!important;}
          .cv-header{flex-wrap:wrap;gap:10px!important;}
          .cv-header h1{font-size:18px!important;}
        }
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
            <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} style={{ display:"none" }} />
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

        {/* User + Logout */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", marginTop:"auto" }}>
          {sidebarOpen && username && (
            <div style={{ padding:"12px 16px 0", display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:"700", color:"#fff", flexShrink:0 }}>
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize:"12px", fontWeight:"600", color:"rgba(200,200,240,0.8)" }}>Olá, {username}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:"8px", background:"transparent", border:"none", color:"rgba(200,200,240,0.4)", fontSize:"13px", cursor:"pointer", padding:"12px 16px", width:"100%", fontFamily:"'Sora',sans-serif" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {sidebarOpen && "Sair"}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dash-main" style={{ flex:1, overflowY:"auto", padding:"28px 32px", maxHeight:"100vh" }}>

        {/* Stats bar */}
        {statsData && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"24px" }}>
            {[
              { label:"CVs Analisados", value: statsData.total, color:"#a78bfa", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8"/><path d="M14 2v6h6M16 13H8M16 17H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
              { label:"Score Médio",    value: `${statsData.average}/100`, color:"#fbbf24", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
              { label:"Melhor Score",  value: `${statsData.best}/100`,    color:"#34d399", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"16px 18px", display:"flex", alignItems:"center", gap:"14px" }}>
                <div style={{ color, flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:"18px", fontWeight:"700", color, lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:"11px", color:"rgba(200,200,240,0.4)", marginTop:"4px" }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

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
            <div className="cv-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                <div style={{ width:"48px", height:"48px", borderRadius:"14px", background:"linear-gradient(135deg,#8b5cf6,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", fontWeight:"700", color:"#fff" }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 style={{ fontSize:"22px", fontWeight:"700", color:"#fff", letterSpacing:"-0.3px" }}>{name}</h1>
                  <p style={{ fontSize:"13px", color:"rgba(200,200,240,0.5)", marginTop:"2px" }}>{role}</p>
                </div>
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                <button
                  onClick={handleExportPDF}
                  title="Exportar análise em PDF"
                  style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:"8px", color:"rgba(139,92,246,0.85)", fontSize:"12px", padding:"7px 12px", cursor:"pointer", fontFamily:"'Sora',sans-serif" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Exportar PDF
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Deletar currículo"
                  style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"8px", color:"rgba(239,68,68,0.7)", fontSize:"12px", padding:"7px 12px", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.5 : 1, fontFamily:"'Sora',sans-serif" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {deleting ? "Deletando..." : "Deletar"}
                </button>
              </div>
            </div>

            {/* Score + Summary */}
            <div className="grid-score" style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:"16px", marginBottom:"16px" }}>

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
            <div className="grid-skills" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>

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
              <div className="grid-exp" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
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

