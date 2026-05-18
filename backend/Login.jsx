const handleLogin = async () => {
  try {
    const res = await axios.post(
      "http://127.0.0.1:8000/auth/login",
      new URLSearchParams({ username, password })
    );

    console.log("🔥 LOGIN RESPONSE:", res.data);

    const token = res.data?.access_token;

    console.log("🔥 TOKEN EXTRAÍDO:", token);

    if (!token) {
      alert("Backend NÃO está retornando access_token");
      return;
    }

    localStorage.setItem("token", token);

    console.log("🔥 TOKEN SALVO:", localStorage.getItem("token"));

    window.location.href = "/";
  } catch (err) {
    console.log("ERRO LOGIN:", err.response?.data || err.message);
  }
};