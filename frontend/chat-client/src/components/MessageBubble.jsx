import { C } from "../utils/constants";

const fmt = (ts) =>
  ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

/**
 * The .NET MessagesController returns:
 *   { id, roomId, senderId, content, createdAtUtc, isEdited, isDeleted }
 *
 * SignalR ReceiveMessage may add extra fields like username/user.
 * We handle both shapes here.
 */
export default function MessageBubble({ msg, isMe }) {
  // Deleted messages
  if (msg.isDeleted) {
    return (
      <div style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        padding: "2px 0",
      }}>
        <span style={{
          fontSize: 12, color: C.textDim, fontStyle: "italic",
          padding: "6px 14px",
          background: C.surfaceHi,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
        }}>
          🗑 Message deleted
        </span>
      </div>
    );
  }

  // Resolve sender display name
  // REST: senderId (GUID), no username in payload
  // SignalR: may include username or user.username
  const senderName =
    msg.username       ||
    msg.user?.username ||
    msg.senderUsername ||
    msg.sender?.username ||
    (msg.senderId ? `User ${String(msg.senderId).slice(0, 6)}` : "User");

  const content = msg.content || msg.text || msg.body || "";
  const ts      = msg.createdAtUtc || msg.createdAt || msg.timestamp || msg.sentAt;

  return (
    <div
      className="msg-in"
      style={{
        display: "flex", gap: 10,
        flexDirection: isMe ? "row-reverse" : "row",
        alignItems: "flex-end",
      }}
    >
      {/* Avatar — other users only */}
      {!isMe && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: C.white,
          marginBottom: 18,
        }}>
          {senderName[0]?.toUpperCase()}
        </div>
      )}

      {/* Bubble + meta */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: isMe ? "flex-end" : "flex-start",
        gap: 4, maxWidth: "65%",
      }}>
        {/* Sender label — other users only */}
        {!isMe && (
          <span style={{ fontSize: 11, color: C.purple, fontWeight: 600, paddingLeft: 4 }}>
            {senderName}
          </span>
        )}

        {/* Bubble */}
        <div style={{
          padding: "10px 16px",
          background: isMe ? C.grad : C.surfaceHi,
          color: C.white,
          fontSize: 14, lineHeight: 1.5,
          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          boxShadow: isMe ? "0 4px 15px rgba(124,58,237,0.3)" : "none",
          wordBreak: "break-word",
          position: "relative",
        }}>
          {content}
          {msg.isEdited && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>
              (edited)
            </span>
          )}
        </div>

        {/* Timestamp */}
        <span style={{ fontSize: 10, color: C.textDim, paddingLeft: 4 }}>
          {fmt(ts)}
        </span>
      </div>
    </div>
  );
}
