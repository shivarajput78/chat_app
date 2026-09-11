"use client";
import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("dedo_token");
    const savedUser = localStorage.getItem("dedo_user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  function persist(token, user) {
    localStorage.setItem("dedo_token", token);
    localStorage.setItem("dedo_user", JSON.stringify(user));
    setUser(user);
  }

  async function login(email, password) {
    const { data } = await api.post("/api/auth/login", { email, password });
    persist(data.token, data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const { data } = await api.post("/api/auth/register", { name, email, password });
    persist(data.token, data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("dedo_token");
    localStorage.removeItem("dedo_user");
    setUser(null);
  }

  function updateUser(updated) {
    setUser(updated);
    localStorage.setItem("dedo_user", JSON.stringify(updated));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
