// src/components/MessageInput.js
import { C } from "../utils/constants";

export default function MessageInput({ activeRoom, input, setInput, onSend }) {
  if (!activeRoom) return null;

  return (
    <div
      style={{
        padding: "14px 20px",
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: C.surfaceHi,
          border: `1px solid ${C.borderHi}`,
          borderRadius: 16,
          padding: "6px 8px 6px 18px",
        }}
      >
        <input
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: C.white,
            fontSize: 14,
            outline: "none",
            caretColor: C.purple,
          }}
          placeholder={`Message #${activeRoom.name}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
        />

        <button
          onClick={onSend}
          disabled={!input.trim()}
          style={{
            width: 38,
            height: 38,
            border: "none",
            cursor: input.trim() ? "pointer" : "default",
            borderRadius: 10,
            flexShrink: 0,
            background: input.trim() ? C.grad : C.border,
            color: input.trim() ? C.white : C.textDim,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          ➤
        </button>
      </div>

      <p
        style={{ fontSize: 11, color: C.textDim, marginTop: 6, paddingLeft: 4 }}
      >
        Press Enter to send
      </p>
    </div>
  );
}
