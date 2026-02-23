import { useState, useEffect, useRef, useCallback } from "react";
import { C } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import { useSignalR } from "../hooks/useSignalR";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";

export default function ChatPage() {
  const { auth, logout } = useAuth();
  const { token, user } = auth;

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [creating, setCreating] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [typingUser, setTypingUser] = useState(null);

  // ── Responsive sidebar ────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 768,
  );

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const prevRoomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const activeRoomRef = useRef(null);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // ── SignalR handlers ──────────────────────────────────────────────

  const handleMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (msg.id && prev.find((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const handleUserJoined = useCallback((u) => {
    setOnlineUsers((prev) =>
      prev.find((x) => x.id === u.id) ? prev : [...prev, u],
    );
  }, []);

  const handleUserLeft = useCallback((u) => {
    setOnlineUsers((prev) => prev.filter((x) => x.id !== u.id));
  }, []);

  const handleUserTyping = useCallback((username) => {
    setTypingUser(username);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setTypingUser(null), 2500);
  }, []);

  const handleRoomOnlineUsers = useCallback((data) => {
    const users =
      data?.onlineUsers ?? data?.users ?? (Array.isArray(data) ? data : []);
    setOnlineUsers(Array.isArray(users) ? users : []);
  }, []);

  const handleRoomDestroyed = useCallback((data) => {
    const destroyedId = data?.roomId ?? data?.id ?? data;
    setRooms((prev) => prev.filter((r) => r.id !== destroyedId));
    if (activeRoomRef.current?.id === destroyedId) {
      prevRoomRef.current = null;
      setActiveRoom(null);
      setMessages([]);
      setOnlineUsers([]);
      sessionStorage.removeItem("activeRoom");
    }
  }, []);

  const { connected, invoke } = useSignalR(
    token,
    handleMessage,
    handleUserJoined,
    handleUserLeft,
    handleUserTyping,
    handleRoomOnlineUsers,
    handleRoomDestroyed,
  );

  // ── Load rooms ────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    setLoadingRooms(true);
    api
      .get("/api/rooms/my-rooms")
      .then((res) => {
        const list =
          res?.rooms ??
          res?.data?.rooms ??
          res?.data ??
          (Array.isArray(res) ? res : []);
        setRooms(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("my-rooms error:", err.message);
        setRooms([]);
      })
      .finally(() => setLoadingRooms(false));
  }, [token]);

  // ── Restore last active room ──────────────────────────────────────

  useEffect(() => {
    const saved = sessionStorage.getItem("activeRoom");
    if (saved) {
      try {
        setActiveRoom(JSON.parse(saved));
      } catch {
        sessionStorage.removeItem("activeRoom");
      }
    }
  }, []);

  // ── Switch room ───────────────────────────────────────────────────

  useEffect(() => {
    if (!activeRoom || !connected) return;
    const switchRoom = async () => {
      if (prevRoomRef.current && prevRoomRef.current !== activeRoom.id) {
        try {
          await invoke("LeaveRoom", prevRoomRef.current);
        } catch {}
      }
      prevRoomRef.current = activeRoom.id;
      setMessages([]);
      setOnlineUsers([]);
      setTypingUser(null);
      setLoadingMsgs(true);
      try {
        await invoke("JoinRoom", activeRoom.id);
        const res = await api.get(`/api/messages/${activeRoom.id}`);
        const msgs =
          res?.messages ??
          res?.data?.messages ??
          res?.data ??
          (Array.isArray(res) ? res : []);
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch (e) {
        console.error("Failed to join/load room:", e);
      } finally {
        setLoadingMsgs(false);
      }
    };
    switchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.id, connected]);

  // ── Send message ──────────────────────────────────────────────────

  const send = async () => {
    if (!input.trim() || !activeRoom || !connected) return;
    const content = input.trim();
    setInput("");
    await invoke("SendMessage", activeRoom.id, content);
  };

  const handleInputChange = (val) => {
    setInput(val);
    if (activeRoom && connected) invoke("UserTyping", activeRoom.id);
  };

  // ── Create room ───────────────────────────────────────────────────

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreating(true);
    setRoomError("");
    try {
      const res = await api.post("/api/rooms/create", {
        name: newRoomName.trim(),
        isGroup: true,
      });
      const room = res?.room ?? res?.data?.room ?? res?.data ?? res;
      if (!room?.id) throw new Error("Invalid room response from server");
      setRooms((prev) => [...prev, room]);
      setNewRoomName("");
      setShowNewRoom(false);
      setActiveRoom(room);
      sessionStorage.setItem("activeRoom", JSON.stringify(room));
      closeSidebarOnMobile();
    } catch (e) {
      setRoomError(e.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  // ── Join room ─────────────────────────────────────────────────────

  const joinRoom = async (id) => {
    try {
      const res = await api.post(`/api/rooms/${id}/join`, {});
      const room = res?.room ?? res?.data?.room ?? res?.data ?? res;
      if (!room?.id) {
        const roomRes = await api.get(`/api/rooms/${id}`);
        const fetched = roomRes?.room ?? roomRes?.data ?? roomRes;
        setRooms((prev) =>
          prev.find((r) => r.id === fetched.id) ? prev : [...prev, fetched],
        );
        setActiveRoom(fetched);
        sessionStorage.setItem("activeRoom", JSON.stringify(fetched));
        closeSidebarOnMobile();
        return;
      }
      setRooms((prev) =>
        prev.find((r) => r.id === room.id) ? prev : [...prev, room],
      );
      setActiveRoom(room);
      sessionStorage.setItem("activeRoom", JSON.stringify(room));
      closeSidebarOnMobile();
    } catch (err) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("already a member") || msg.includes("already")) {
        const existing = rooms.find((r) => r.id === Number(id) || r.id === id);
        if (existing) {
          setActiveRoom(existing);
          sessionStorage.setItem("activeRoom", JSON.stringify(existing));
          closeSidebarOnMobile();
          return;
        }
      }
      throw err;
    }
  };

  // ── Leave room ────────────────────────────────────────────────────

  const leaveRoom = async (room) => {
    try {
      await api.post(`/api/rooms/${room.id}/leave`, {});
    } catch {}
    await invoke("LeaveRoom", room.id);
    setRooms((prev) => prev.filter((r) => r.id !== room.id));
    if (activeRoom?.id === room.id) {
      prevRoomRef.current = null;
      setActiveRoom(null);
      setMessages([]);
      setOnlineUsers([]);
      sessionStorage.removeItem("activeRoom");
    }
  };

  // ── Destroy room ──────────────────────────────────────────────────

  const destroyRoom = async (room) => {
    try {
      await api.delete(`/api/rooms/${room.id}`);
    } catch (err) {
      console.error("Destroy room error:", err.message);
      alert(err.message || "Failed to destroy room");
      return;
    }
    await invoke("DestroyRoom", room.id);
    setRooms((prev) => prev.filter((r) => r.id !== room.id));
    if (activeRoom?.id === room.id) {
      prevRoomRef.current = null;
      setActiveRoom(null);
      setMessages([]);
      setOnlineUsers([]);
      sessionStorage.removeItem("activeRoom");
    }
  };

  const myId = user?.id || user?.userId || user?.sub || "";
  const myName = user?.username || user?.userName || user?.name || "";

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        width: "100%",
        background: C.bg,
        overflow: "hidden",
      }}
    >
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar wrapper — static on desktop, slide-in drawer on mobile */}
      <div
        style={{
          ...(isMobile
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                height: "100%",
                zIndex: 50,
                transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 0.25s cubic-bezier(.4,0,.2,1)",
              }
            : { position: "relative", flexShrink: 0 }),
        }}
      >
        <Sidebar
          connected={connected}
          myName={myName}
          rooms={rooms}
          activeRoom={activeRoom}
          setActiveRoom={(room) => {
            setActiveRoom(room);
            if (room)
              sessionStorage.setItem("activeRoom", JSON.stringify(room));
            else sessionStorage.removeItem("activeRoom");
            closeSidebarOnMobile();
          }}
          loadingRooms={loadingRooms}
          showNewRoom={showNewRoom}
          setShowNewRoom={setShowNewRoom}
          newRoomName={newRoomName}
          setNewRoomName={setNewRoomName}
          createRoom={createRoom}
          creating={creating}
          roomError={roomError}
          setRoomError={setRoomError}
          joinRoom={joinRoom}
          leaveRoom={leaveRoom}
          destroyRoom={destroyRoom}
          onLogout={logout}
        />
      </div>

      {/* Main panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <ChatHeader
          activeRoom={activeRoom}
          onlineUsers={onlineUsers}
          onToggleSidebar={() => setSidebarOpen((p) => !p)}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
        />
        <MessageList
          messages={messages}
          activeRoom={activeRoom}
          loadingMsgs={loadingMsgs}
          myId={myId}
          myName={myName}
          typingUser={typingUser}
        />
        <MessageInput
          activeRoom={activeRoom}
          input={input}
          setInput={handleInputChange}
          onSend={send}
        />
      </div>
    </div>
  );
}
