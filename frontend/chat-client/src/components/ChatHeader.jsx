import { C } from "../utils/constants";

export default function ChatHeader({
  activeRoom,
  onlineUsers,
  onToggleSidebar,
  isMobile,
  sidebarOpen, // 👈 مهم
}) {
  return (
    <div
      style={{
        padding: "0 16px",
        height: 60,
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexShrink: 0,
      }}
    >
      {/* Hamburger */}
      {isMobile && (
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          style={{
            position: "relative",
            width: 40,
            height: 40,
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: C.surfaceHi,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          <div
            style={{
              width: 20,
              height: 14,
              position: "relative",
            }}
          >
            {/* Top */}
            <span
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 2,
                background: C.white,
                borderRadius: 2,
                transform: sidebarOpen
                  ? "rotate(45deg) translateY(6px)"
                  : "none",
                transition: "0.25s ease",
              }}
            />
            {/* Middle */}
            <span
              style={{
                position: "absolute",
                top: 6,
                left: 0,
                width: "100%",
                height: 2,
                background: C.white,
                borderRadius: 2,
                opacity: sidebarOpen ? 0 : 1,
                transition: "0.2s ease",
              }}
            />
            {/* Bottom */}
            <span
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: 2,
                background: C.white,
                borderRadius: 2,
                transform: sidebarOpen
                  ? "rotate(-45deg) translateY(-6px)"
                  : "none",
                transition: "0.25s ease",
              }}
            />
          </div>
        </button>
      )}

      {/* Room Info */}
      {activeRoom ? (
        <>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: C.grad,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 15,
              color: C.white,
              flexShrink: 0,
            }}
          >
            #
          </div>

          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: C.white,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {activeRoom.name}
            </p>

            <p
              style={{
                fontSize: 11,
                color: C.textMuted,
                margin: 0,
              }}
            >
              {onlineUsers.length} online
            </p>
          </div>
        </>
      ) : (
        <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
          {isMobile
            ? "Open sidebar to pick a room"
            : "Select a room to start chatting"}
        </p>
      )}
    </div>
  );
}
