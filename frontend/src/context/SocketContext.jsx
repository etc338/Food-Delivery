/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { serverUrl } from "../App";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { userData } = useSelector((state) => state.user);
  const [socketObj, setSocketObj] = React.useState({ current: null });

  useEffect(() => {
    if (!userData?._id) {
      if (socketObj.current) {
        socketObj.current.disconnect();
        setSocketObj({ current: null });
      }
      return;
    }

    const socket = io(serverUrl, { withCredentials: true });
    setSocketObj({ current: socket });

    socket.on("connect", () => {
      socket.emit("join", userData._id);
    });

    return () => {
      socket.disconnect();
      setSocketObj({ current: null });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?._id]);

  return (
    <SocketContext.Provider value={socketObj}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
