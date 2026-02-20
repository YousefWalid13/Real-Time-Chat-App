import { useRef, useEffect } from "react";
import { C } from "../utils/constants";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, activeRoom, loadingMsgs, myId, myName }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 14,
    }}>

      {/* Empty state */}
      {!activeRoom && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 12, opacity: 0.5, paddingTop: "25vh",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: C.surfaceHi,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28,
          }}>💬</div>
          <p style={{ color: C.textMuted, fontSize: 14 }}>No room selected</p>
        </div>
      )}

      {/* Loading spinner */}
      {loadingMsgs && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            border: `3px solid ${C.purple}`,
            borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
          }} />
        </div>
      )}

      {/* No messages yet */}
      {activeRoom && !loadingMsgs && messages.length === 0 && (
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 8, paddingTop: "20vh", opacity: 0.4,
        }}>
          <span style={{ fontSize: 32 }}>👋</span>
          <p style={{ color: C.textMuted, fontSize: 13 }}>
            No messages yet. Say hello!
          </p>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, i) => {
        // REST response uses senderId (GUID string)
        // SignalR may use userId / user.id / senderId
        const senderId =
          msg.senderId    ||
          msg.userId      ||
          msg.user?.id    ||
          msg.sender?.id;

        const senderName =
          msg.username       ||
          msg.user?.username ||
          msg.senderUsername ||
          msg.sender?.username;

        // Match by ID first (most reliable), fall back to name
        const isMe =
          (myId   && senderId   === myId)   ||
          (myName && senderName === myName);

        return (
          <MessageBubble key={msg.id || i} msg={msg} isMe={isMe} />
        );
      })}

      <div ref={endRef} />
    </div>
  );
}
