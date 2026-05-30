import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://hiremind-ai-production.up.railway.app";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_URL}/login`,
        new URLSearchParams({ username, password })
      );
      const token = res.data?.access_token;
      if (!token) {
        setError("Erro: token não recebido do servidor.");
        return;
      }
      localStorage.setItem("token", token);
      window.location.href = "/";
    } catch (err) {
      const msg = err.response?.data?.detail || "Usuário ou senha inválidos.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={styles.page}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.card}>
        {/* Logo / Brand */}
        <div style={styles.brandRow}>
          <div style={styles.logoBox}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={styles.brandName}>HireMind</span>
          <span style={styles.brandBadge}>AI</span>
        </div>

        <h1 style={styles.title}>Bem‑vindo de volta</h1>
        <p style={styles.subtitle}>Analise currículos com inteligência artificial</p>

        {/* Inputs */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Usuário</label>
          <div style={styles.inputWrap}>
            <svg style={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              style={styles.input}
              type="text"
              placeholder="seu@email.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="username"
            />
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Senha</label>
          <div style={styles.inputWrap}>
            <svg style={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              style={styles.input}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
            />
            <button
              style={styles.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              type="button"
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
              <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="1.8"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="#f87171"/>
            </svg>
            {error}
          </div>
        )}

        {/* Button */}
        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <span style={styles.spinner} />
          ) : (
            <>
              Entrar na plataforma
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>

        {/* Features strip */}
        <div style={styles.featuresRow}>
          {["Análise por IA", "Score detalhado", "Dicas personalizadas"].map((f) => (
            <div key={f} style={styles.featureChip}>
              <div style={styles.featureDot} />
              {f}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: rgba(160,160,190,0.5); }
        input:focus { outline: none; border-color: rgba(139,92,246,0.7) !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.15); }
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.1)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-25px,35px) scale(0.95)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,20px) scale(1.05)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #0d1b3e 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Sora', sans-serif",
    position: "relative",
    overflow: "hidden",
    padding: "24px",
  },
  blob1: {
    position: "absolute", top: "-80px", left: "-80px",
    width: "420px", height: "420px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)",
    animation: "float1 8s ease-in-out infinite",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute", bottom: "-100px", right: "-60px",
    width: "380px", height: "380px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
    animation: "float2 10s ease-in-out infinite",
    pointerEvents: "none",
  },
  blob3: {
    position: "absolute", top: "40%", left: "60%",
    width: "260px", height: "260px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
    animation: "float3 12s ease-in-out infinite",
    pointerEvents: "none",
  },
  card: {
    position: "relative", zIndex: 10,
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
    padding: "44px 40px",
    width: "100%", maxWidth: "420px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
    animation: "fadeUp 0.6s ease both",
  },
  brandRow: {
    display: "flex", alignItems: "center", gap: "10px",
    marginBottom: "32px",
  },
  logoBox: {
    width: "36px", height: "36px", borderRadius: "10px",
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  brandName: {
    fontSize: "18px", fontWeight: "700",
    color: "#fff", letterSpacing: "-0.3px",
  },
  brandBadge: {
    fontSize: "10px", fontWeight: "700",
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    color: "#fff", padding: "2px 8px", borderRadius: "20px",
    letterSpacing: "1px",
  },
  title: {
    fontSize: "26px", fontWeight: "700",
    color: "#fff", letterSpacing: "-0.5px",
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "14px", color: "rgba(160,160,210,0.75)",
    marginBottom: "32px", lineHeight: "1.5",
  },
  fieldGroup: {
    marginBottom: "18px",
  },
  label: {
    display: "block", fontSize: "12px", fontWeight: "600",
    color: "rgba(200,200,240,0.7)", letterSpacing: "0.8px",
    textTransform: "uppercase", marginBottom: "8px",
  },
  inputWrap: {
    position: "relative", display: "flex", alignItems: "center",
  },
  inputIcon: {
    position: "absolute", left: "14px",
    color: "rgba(160,160,210,0.5)", pointerEvents: "none",
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "'Sora', sans-serif",
    padding: "13px 40px 13px 42px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  eyeBtn: {
    position: "absolute", right: "14px",
    background: "none", border: "none",
    color: "rgba(160,160,210,0.5)",
    cursor: "pointer", padding: "4px",
    display: "flex", alignItems: "center",
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: "10px",
    color: "#fca5a5", fontSize: "13px",
    padding: "10px 14px", marginBottom: "16px",
  },
  btn: {
    width: "100%",
    background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
    border: "none", borderRadius: "12px",
    color: "#fff", fontSize: "15px", fontWeight: "600",
    fontFamily: "'Sora', sans-serif",
    padding: "14px 24px",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
    transition: "opacity 0.2s, transform 0.1s",
    boxShadow: "0 8px 24px rgba(139,92,246,0.35)",
    marginBottom: "28px",
  },
  spinner: {
    width: "18px", height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  featuresRow: {
    display: "flex", gap: "6px", flexWrap: "wrap",
  },
  featureChip: {
    display: "flex", alignItems: "center", gap: "6px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    color: "rgba(200,200,240,0.6)",
    fontSize: "11px", fontWeight: "500",
    padding: "5px 10px",
  },
  featureDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
  },
};