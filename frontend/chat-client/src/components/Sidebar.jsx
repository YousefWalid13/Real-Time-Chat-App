import { useState } from "react";
import { C } from "../utils/constants";

export default function Sidebar({
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
}) {
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [leavingId, setLeavingId] = useState(null);
  const [destroyingId, setDestroyingId] = useState(null);
  const [confirmDestroyRoom, setConfirmDestroyRoom] = useState(null); // room to confirm

  const handleLeave = async (e, room) => {
    e.stopPropagation();
    setLeavingId(room.id);
    try {
      await leaveRoom(room);
    } finally {
      setLeavingId(null);
    }
  };

  const handleDestroyClick = (e, room) => {
    e.stopPropagation();
    setConfirmDestroyRoom(room); // show confirm dialog
  };

  const handleDestroyConfirm = async () => {
    if (!confirmDestroyRoom) return;
    setDestroyingId(confirmDestroyRoom.id);
    setConfirmDestroyRoom(null);
    try {
      await destroyRoom(confirmDestroyRoom);
    } finally {
      setDestroyingId(null);
    }
  };

  const handleJoin = async () => {
    const trimmed = joinId.trim();
    if (!trimmed) {
      setJoinError("Please enter a room ID");
      return;
    }
    const id = parseInt(trimmed, 10);
    if (isNaN(id) || id <= 0) {
      setJoinError("Room ID must be a positive number");
      return;
    }
    setJoining(true);
    setJoinError("");
    try {
      await joinRoom(id);
      setJoinId("");
      setShowJoin(false);
    } catch (e) {
      setJoinError(e?.message || "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      style={{
        width: 280,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flexShrink: 0,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <h2
          style={{ color: C.white, margin: 0, marginBottom: 4, fontSize: 18 }}
        >
          Chat
        </h2>
        <div style={{ fontSize: 12, color: C.textMuted }}>
          {connected ? "🟢 Live" : "🔴 Offline"}
        </div>
      </div>

      {/* ── Rooms List ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {loadingRooms ? (
          <div style={{ color: C.textMuted, padding: 8, fontSize: 13 }}>
            Loading rooms…
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ color: C.textMuted, padding: 8, fontSize: 13 }}>
            No rooms yet — create or join one below
          </div>
        ) : (
          rooms.map((room) => {
            const isActive = activeRoom?.id === room.id;
            const isLeaving = leavingId === room.id;
            const isDestroying = destroyingId === room.id;

            return (
              <div
                key={room.id}
                onClick={() => setActiveRoom(room)}
                style={{
                  padding: "9px 10px",
                  borderRadius: 10,
                  marginBottom: 4,
                  cursor: "pointer",
                  background: isActive ? C.surfaceHi : "transparent",
                  border: isActive
                    ? `1px solid ${C.borderHi}`
                    : "1px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {/* Room name + ID */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.white,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    # {room.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: C.textMuted,
                      marginLeft: 6,
                      flexShrink: 0,
                    }}
                  >
                    ID: {room.id}
                  </span>
                </div>

                {/* Action buttons row */}
                <div
                  style={{ display: "flex", gap: 5 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Leave */}
                  <button
                    onClick={(e) => handleLeave(e, room)}
                    disabled={isLeaving || isDestroying}
                    title="Leave room (you can rejoin later)"
                    style={{
                      flex: 1,
                      padding: "3px 0",
                      borderRadius: 6,
                      border: "1px solid rgba(248,113,113,0.35)",
                      background: "transparent",
                      color: "#f87171",
                      fontSize: 11,
                      cursor: isLeaving ? "not-allowed" : "pointer",
                      opacity: isLeaving || isDestroying ? 0.5 : 1,
                    }}
                  >
                    {isLeaving ? "…" : "Leave"}
                  </button>

                  {/* Destroy */}
                  <button
                    onClick={(e) => handleDestroyClick(e, room)}
                    disabled={isDestroying || isLeaving}
                    title="Destroy room permanently (owner only)"
                    style={{
                      flex: 1,
                      padding: "3px 0",
                      borderRadius: 6,
                      border: "1px solid rgba(239,68,68,0.5)",
                      background: isDestroying
                        ? "rgba(239,68,68,0.15)"
                        : "transparent",
                      color: "#ef4444",
                      fontSize: 11,
                      cursor: isDestroying ? "not-allowed" : "pointer",
                      opacity: isDestroying || isLeaving ? 0.5 : 1,
                      fontWeight: 600,
                    }}
                  >
                    {isDestroying ? "…" : "🗑 Destroy"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Confirm Destroy Dialog ── */}
      {confirmDestroyRoom && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setConfirmDestroyRoom(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 24,
              width: 300,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{ fontSize: 28, textAlign: "center", marginBottom: 12 }}
            >
              ⚠️
            </div>
            <div
              style={{
                color: C.white,
                fontWeight: 700,
                fontSize: 16,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Destroy Room?
            </div>
            <div
              style={{
                color: C.textMuted,
                fontSize: 13,
                textAlign: "center",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: "#f87171", fontWeight: 600 }}>
                #{confirmDestroyRoom.name}
              </span>{" "}
              will be permanently deleted along with all its messages. This
              cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmDestroyRoom(null)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 9,
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.textMuted,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDestroyConfirm}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 9,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Yes, Destroy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Room Panel ── */}
      {showNewRoom && (
        <div
          style={{
            margin: "0 10px 8px",
            padding: 12,
            background: C.surfaceHi,
            borderRadius: 10,
            border: `1px solid ${C.borderHi}`,
          }}
        >
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
            New room name
          </div>
          <input
            autoFocus
            value={newRoomName}
            onChange={(e) => {
              setNewRoomName(e.target.value);
              setRoomError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") createRoom();
              if (e.key === "Escape") {
                setShowNewRoom(false);
                setNewRoomName("");
              }
            }}
            placeholder="e.g. general"
            style={{
              width: "100%",
              padding: "7px 10px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.bg,
              color: C.white,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 8,
            }}
          />
          {roomError && (
            <div style={{ color: "#f87171", fontSize: 11, marginBottom: 6 }}>
              {roomError}
            </div>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={createRoom}
              disabled={creating || !newRoomName.trim()}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 8,
                border: "none",
                background: C.purple,
                color: "#fff",
                fontSize: 12,
                cursor:
                  creating || !newRoomName.trim() ? "not-allowed" : "pointer",
                opacity: creating || !newRoomName.trim() ? 0.5 : 1,
              }}
            >
              {creating ? "Creating…" : "Create"}
            </button>
            <button
              onClick={() => {
                setShowNewRoom(false);
                setNewRoomName("");
                setRoomError("");
              }}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.textMuted,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Join Room Panel ── */}
      {showJoin && (
        <div
          style={{
            margin: "0 10px 8px",
            padding: 12,
            background: C.surfaceHi,
            borderRadius: 10,
            border: `1px solid ${C.borderHi}`,
          }}
        >
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>
            Enter room ID
          </div>
          <input
            autoFocus
            type="number"
            min="1"
            value={joinId}
            onChange={(e) => {
              setJoinId(e.target.value);
              setJoinError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
              if (e.key === "Escape") {
                setShowJoin(false);
                setJoinId("");
                setJoinError("");
              }
            }}
            placeholder="e.g. 3"
            style={{
              width: "100%",
              padding: "7px 10px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.bg,
              color: C.white,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 8,
            }}
          />
          {joinError && (
            <div style={{ color: "#f87171", fontSize: 11, marginBottom: 6 }}>
              {joinError}
            </div>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleJoin}
              disabled={joining || !joinId.trim()}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 8,
                border: "none",
                background: "#3b82f6",
                color: "#fff",
                fontSize: 12,
                cursor: joining || !joinId.trim() ? "not-allowed" : "pointer",
                opacity: joining || !joinId.trim() ? 0.5 : 1,
              }}
            >
              {joining ? "Joining…" : "Join"}
            </button>
            <button
              onClick={() => {
                setShowJoin(false);
                setJoinId("");
                setJoinError("");
              }}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.textMuted,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div
        style={{
          padding: "8px 10px",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <button
          onClick={() => {
            setShowNewRoom((p) => !p);
            setShowJoin(false);
            setRoomError("");
          }}
          style={{
            width: "100%",
            padding: "9px 0",
            borderRadius: 10,
            border: `1px dashed ${C.borderHi}`,
            background: showNewRoom ? C.surfaceHi : "transparent",
            color: C.purple,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          + New Room
        </button>
        <button
          onClick={() => {
            setShowJoin((p) => !p);
            setShowNewRoom(false);
            setRoomError("");
          }}
          style={{
            width: "100%",
            padding: "9px 0",
            borderRadius: 10,
            border: `1px dashed ${C.borderHi}`,
            background: showJoin ? C.surfaceHi : "transparent",
            color: "#60a5fa",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          🔗 Join Room
        </button>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
              flexShrink: 0,
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
  );
}
