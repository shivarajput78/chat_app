"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("setup", user._id);
      setReady(true);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setReady(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, ready }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
