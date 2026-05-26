/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { serverUrl } from "../App";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { userData } = useSelector((state) => state.user);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userData) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    socketRef.current = io(serverUrl, { withCredentials: true });

    const socket = socketRef.current;

    socket.on("connect", () => {
      socket.emit("join", userData._id);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userData]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
