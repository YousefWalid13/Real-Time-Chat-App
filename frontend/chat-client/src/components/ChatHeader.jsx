import { C } from "../utils/constants";

export default function ChatHeader({ activeRoom, onlineUsers }) {
  return (
    <div
      style={{
        padding: "14px 24px",
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexShrink: 0,
      }}
    >
      {activeRoom ? (
        <>
          <div
            style={{
              width: 38, height: 38,
              borderRadius: 10,
              background: C.grad,
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 16, color: C.white,
            }}
          >
            #
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: C.white }}>
              {activeRoom.name}
            </p>
            <p style={{ fontSize: 11, color: C.textMuted }}>
              {onlineUsers.length} online
            </p>
          </div>
        </>
      ) : (
        <p style={{ color: C.textMuted, fontSize: 14 }}>
          👈 Select a room to start chatting
        </p>
      )}
    </div>
  );
}
