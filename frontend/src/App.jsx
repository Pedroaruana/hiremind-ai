import Dashboard from "./Dashboard";
import Login from "./Login";

export default function App() {
  const token = localStorage.getItem("token");
  const guest = localStorage.getItem("guest") === "true";

  return (token || guest) ? <Dashboard /> : <Login />;
}