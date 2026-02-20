import { useEffect, useRef, useState, useCallback } from "react";
import { HUB_URL } from "../utils/constants";

export function useSignalR(
  token,
  onMessage,
  onUserJoined,
  onUserLeft,
  onUserTyping,
  onRoomOnlineUsers,
  onRoomDestroyed, // ← NEW: called when room is destroyed by owner
) {
  const connRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const onMessageRef = useRef(onMessage);
  const onUserJoinedRef = useRef(onUserJoined);
  const onUserLeftRef = useRef(onUserLeft);
  const onUserTypingRef = useRef(onUserTyping);
  const onRoomOnlineUsersRef = useRef(onRoomOnlineUsers);
  const onRoomDestroyedRef = useRef(onRoomDestroyed);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  useEffect(() => {
    onUserJoinedRef.current = onUserJoined;
  }, [onUserJoined]);
  useEffect(() => {
    onUserLeftRef.current = onUserLeft;
  }, [onUserLeft]);
  useEffect(() => {
    onUserTypingRef.current = onUserTyping;
  }, [onUserTyping]);
  useEffect(() => {
    onRoomOnlineUsersRef.current = onRoomOnlineUsers;
  }, [onRoomOnlineUsers]);
  useEffect(() => {
    onRoomDestroyedRef.current = onRoomDestroyed;
  }, [onRoomDestroyed]);

  useEffect(() => {
    if (!token) return;
    let conn;
    let stopped = false;

    const loadSignalR = () => {
      if (window.signalR) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/7.0.5/signalr.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadSignalR()
      .then(() => {
        if (stopped) return;

        conn = new window.signalR.HubConnectionBuilder()
          .withUrl(HUB_URL, {
            accessTokenFactory: () => {
              const raw = sessionStorage.getItem("_chatAuth");
              return raw ? JSON.parse(raw).token : null;
            },
            transport:
              window.signalR.HttpTransportType.WebSockets |
              window.signalR.HttpTransportType.LongPolling,
          })
          .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
          .configureLogging(window.signalR.LogLevel.Warning)
          .build();

        conn.on("ReceiveMessage", (msg) => onMessageRef.current?.(msg));
        conn.on("UserJoined", (u) => onUserJoinedRef.current?.(u));
        conn.on("UserLeft", (u) => onUserLeftRef.current?.(u));
        conn.on("UserTyping", (username) =>
          onUserTypingRef.current?.(username),
        );
        conn.on("RoomOnlineUsers", (data) =>
          onRoomOnlineUsersRef.current?.(data),
        );

        // ← NEW: server broadcasts this to all members when room is deleted
        conn.on("RoomDestroyed", (data) => {
          console.log("💥 RoomDestroyed:", data);
          onRoomDestroyedRef.current?.(data);
        });

        conn.onreconnecting(() => setConnected(false));
        conn.onreconnected(() => setConnected(true));
        conn.onclose(() => setConnected(false));

        conn
          .start()
          .then(() => {
            if (stopped) {
              conn.stop();
              return;
            }
            setConnected(true);
            connRef.current = conn;
          })
          .catch((e) => console.error("SignalR start error:", e));
      })
      .catch((e) => console.error("Failed to load SignalR script:", e));

    return () => {
      stopped = true;
      setConnected(false);
      conn?.stop();
      connRef.current = null;
    };
  }, [token]);

  const invoke = useCallback((method, ...args) => {
    const conn = connRef.current;
    if (conn?.state === "Connected")
      return conn
        .invoke(method, ...args)
        .catch((e) =>
          console.error(`SignalR invoke "${method}" failed:`, e?.message || e),
        );
    console.warn(`SignalR not connected — skipped: ${method}`);
    return Promise.resolve();
  }, []);

  return { connected, invoke };
}
