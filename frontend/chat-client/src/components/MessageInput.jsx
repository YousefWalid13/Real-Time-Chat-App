import { C } from "../utils/constants";

export default function MessageInput({ activeRoom, input, setInput, onSend }) {
  if (!activeRoom) return null;

  return (
    <div
      style={{
        // Responsive padding
        padding: "12px max(12px, min(20px, 3vw))",
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: C.surfaceHi,
          border: `1px solid ${C.borderHi}`,
          borderRadius: 16,
          padding: "6px 8px 6px 14px",
        }}
      >
        <input
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: C.white,
            // Slightly smaller on narrow screens
            fontSize: "clamp(13px, 3.5vw, 15px)",
            outline: "none",
            caretColor: C.purple,
            // Prevent iOS zoom on focus (needs ≥16px, but we use clamp min 13 so add meta viewport instead)
            minWidth: 0,
          }}
          placeholder={`Message #${activeRoom.name}…`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // On mobile, Enter should not send (use the button) — only send on desktop
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent?.isComposing
            ) {
              const isMobileDevice = window.innerWidth < 768;
              if (!isMobileDevice) {
                e.preventDefault();
                onSend();
              }
            }
          }}
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
        style={{
          fontSize: 11,
          color: C.textDim,
          marginTop: 5,
          paddingLeft: 4,
          // Hide the hint on very small screens to save space
          display: window.innerWidth < 400 ? "none" : "block",
        }}
      >
        {window.innerWidth < 768 ? "Tap ➤ to send" : "Press Enter to send"}
      </p>
    </div>
  );
}
