import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "https://hiremind-ai-production.up.railway.app/login",
        new URLSearchParams({ username, password })
      );

      console.log("LOGIN RESPONSE:", res.data);

      const token = res.data?.access_token;

      if (!token) {
        console.log("❌ Token não retornado");
        return;
      }

      localStorage.setItem("token", token);

      console.log("TOKEN SALVO:", localStorage.getItem("token"));

      setTimeout(() => {
        window.location.reload();
      }, 200);

    } catch (err) {
      console.log("ERRO LOGIN:", err.response?.data || err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}