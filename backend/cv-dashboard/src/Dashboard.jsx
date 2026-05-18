import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [cvs, setCvs] = useState([]);

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwZWRybyIsImV4cCI6MTc3OTA3OTk1OX0.RF8CwHK7bMoTnpxPLXDlq82c_5zn_jcXYyS3u_DO4bY";

    axios
      .get("http://127.0.0.1:8000/cv/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("DATA:", res.data);
        setCvs(res.data || []);
      })
      .catch((err) => {
        console.log("ERRO:", err.response?.data || err.message);
      });
  }, []);

  return (
    <div style={{ padding: 20 }}>
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
          <p><b>Skills:</b> {cv.ai_analysis?.skills?.join(", ")}</p>
        </div>
      ))}
    </div>
  );
}