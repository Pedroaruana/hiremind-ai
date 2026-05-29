import { useEffect, useState } from "react";
import axios from "axios";
console.log("API:", import.meta.env.VITE_API_URL);
export default function Dashboard() {
  const [cvs, setCvs] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    console.log("TOKEN NO DASHBOARD:", token);

    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL;

    axios
      .get(`${API_URL}/cv/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("DATA:", res.data);
        setCvs(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.log("ERRO:", err.response?.data || err.message);
      });
  }, []);


  return (
  <div style={{ padding: 20 }}>

    {/* 🔴 BOTÃO DE LOGOUT */}
    <button
      onClick={handleLogout}
      style={{
        marginBottom: 20,
        padding: "8px 12px",
        cursor: "pointer",
      }}
    >
      🚪 Sair (Logout)
    </button>

    <h1>📄 Meus CVs</h1>

    {cvs.length === 0 && <p>Nenhum CV encontrado.</p>}

    {cvs.map((cv) => (
      <div
        key={cv.file_id}
        style={{
          border: "1px solid #ccc",
          margin: 10,
          padding: 10,
          borderRadius: 8,
        }}
      >
        <p><b>ID:</b> {cv.file_id}</p>
        <p><b>Role:</b> {cv.ai_analysis?.role}</p>
        <p>
          <b>Skills:</b>{" "}
          {cv.ai_analysis?.skills?.join(", ")}
        </p>
      </div>
    ))}
  </div>
)}