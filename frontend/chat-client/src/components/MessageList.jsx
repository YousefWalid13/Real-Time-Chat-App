import { useRef, useEffect } from "react";
import { C } from "../utils/constants";
import MessageBubble from "./MessageBubble";

export default function MessageList({
  messages,
  activeRoom,
  loadingMsgs,
  myId,
  myName,
  typingUser,
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        // Responsive padding: smaller on mobile
        padding: "16px max(12px, min(24px, 3vw))",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        // Prevents this from pushing siblings — critical for mobile
        minHeight: 0,
      }}
    >
      {/* No room selected */}
      {!activeRoom && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            opacity: 0.5,
            paddingTop: "20vh",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: C.surfaceHi,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            💬
          </div>
          <p style={{ color: C.textMuted, fontSize: 14, textAlign: "center" }}>
            No room selected
          </p>
        </div>
      )}

      {/* Loading */}
      {loadingMsgs && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px 0",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: `3px solid ${C.purple}`,
              borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Empty room */}
      {activeRoom && !loadingMsgs && messages.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingTop: "15vh",
            opacity: 0.4,
          }}
        >
          <span style={{ fontSize: 32 }}>👋</span>
          <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center" }}>
            No messages yet. Say hello!
          </p>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, i) => {
        const senderId =
          msg.senderId || msg.userId || msg.user?.id || msg.sender?.id;
        const senderName =
          msg.username ||
          msg.user?.username ||
          msg.senderUsername ||
          msg.sender?.username;

        const isMe =
          (myId && senderId === myId) || (myName && senderName === myName);

        return <MessageBubble key={msg.id || i} msg={msg} isMe={isMe} />;
      })}

      {/* Typing indicator */}
      {typingUser && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 0",
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: C.textMuted,
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 12, color: C.textMuted }}>
            {typingUser} is typing…
          </span>
          <style>{`
            @keyframes bounce {
              0%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-5px); }
            }
          `}</style>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
