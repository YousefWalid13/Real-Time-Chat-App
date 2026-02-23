import { useState, useEffect } from "react";
import { C } from "../utils/constants";

export default function Sidebar(props) {
  const {
    connected,
    myName,
    rooms,
    activeRoom,
    setActiveRoom,
    loadingRooms,
    showNewRoom,
    setShowNewRoom,
    newRoomName,
    setNewRoomName,
    createRoom,
    creating,
    roomError,
    setRoomError,
    joinRoom,
    leaveRoom,
    destroyRoom,
    onLogout,
  } = props;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarWidth = 280;

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            top: 14,
            left: 14,
            zIndex: 1100,
            background: C.purple,
            border: "none",
            borderRadius: 8,
            padding: "6px 10px",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          ☰
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 999,
          }}
        />
      )}

      <div
        style={{
          width: sidebarWidth,
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          flexShrink: 0,
          position: isMobile ? "fixed" : "relative",
          top: 0,
          left: isMobile ? (open ? 0 : -sidebarWidth) : 0,
          transition: "left 0.25s ease",
          zIndex: 1000,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                color: C.white,
                margin: 0,
                marginBottom: 4,
                fontSize: 18,
              }}
            >
              Chat
            </h2>
            <div style={{ fontSize: 12, color: C.textMuted }}>
              {connected ? "🟢 Live" : "🔴 Offline"}
            </div>
          </div>

          {isMobile && (
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: C.textMuted,
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* ROOMS */}
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {loadingRooms ? (
            <div style={{ color: C.textMuted }}>Loading rooms…</div>
          ) : rooms.length === 0 ? (
            <div style={{ color: C.textMuted }}>
              No rooms yet — create or join one below
            </div>
          ) : (
            rooms.map((room) => {
              const isActive = activeRoom?.id === room.id;

              return (
                <div
                  key={room.id}
                  onClick={() => {
                    setActiveRoom(room);
                    if (isMobile) setOpen(false);
                  }}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    marginBottom: 5,
                    cursor: "pointer",
                    background: isActive ? C.surfaceHi : "transparent",
                    border: isActive
                      ? `1px solid ${C.borderHi}`
                      : "1px solid transparent",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.white,
                    }}
                  >
                    #{room.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.textMuted,
                      marginTop: 3,
                    }}
                  >
                    ID: {room.id}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: 12,
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: C.purple,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {myName?.[0]?.toUpperCase() || "?"}
            </div>
            <span style={{ color: C.white, fontSize: 13 }}>{myName}</span>
          </div>

          <button
            onClick={onLogout}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: "1px solid rgba(248,113,113,0.4)",
              background: "transparent",
              color: "#f87171",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
