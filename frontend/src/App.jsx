import { useState } from "react";
import Dashboard from "./Dashboard";
import Login from "./Login";

export default function App() {
  const token = localStorage.getItem("token");

  return token ? <Dashboard /> : <Login />;
}