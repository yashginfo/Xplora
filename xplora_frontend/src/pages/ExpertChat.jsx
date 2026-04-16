// src/pages/ExpertChat.jsx
import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace("https://", "wss://").replace("http://", "ws://");

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${date.toLocaleDateString([], { day: "2-digit", month: "short" })} ${time}`;
}

// ── Room List ──────────────────────────────────────────────────────────────────

function RoomList({ rooms, activeRoomUuid, onSelect, onNewRoom, onDelete, currentUser }) {
  const [expandedUsers, setExpandedUsers] = useState({});

  const toggleUser = (userId) => {
    setExpandedUsers((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  if (currentUser?.role === "admin" || currentUser?.role === "expert") {
    const grouped = {};
    rooms.forEach((room) => {
      const key = room.created_by;
      if (!grouped[key]) {
        grouped[key] = { name: room.creator_name, userId: room.created_by, rooms: [] };
      }
      grouped[key].rooms.push(room);
    });
    const groups = Object.values(grouped);

    return (
      <div
        className="flex flex-col h-full"
        style={{
          background: "rgba(8,6,4,0.70)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="px-4 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: "#c9a96e" }}>
            Expert Chat
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
            All conversations
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(201,169,110,0.2) transparent" }}>
          {groups.length === 0 && (
            <p className="text-center mt-8 px-4" style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>
              No open rooms yet.
            </p>
          )}

          {groups.map((group) => {
            const isOpen = expandedUsers[group.userId] ?? false;
            return (
              <div key={group.userId} className="flex flex-col">
                <button
                  onClick={() => toggleUser(group.userId)}
                  className="w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all"
                  style={{
                    background: isOpen ? "rgba(201,169,110,0.10)" : "rgba(255,255,255,0.04)",
                    border: isOpen ? "1px solid rgba(201,169,110,0.20)" : "1px solid rgba(255,255,255,0.06)",
                    marginBottom: "1px",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(201,169,110,0.20)", border: "1px solid rgba(201,169,110,0.35)" }}
                    >
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#c9a96e" }}>
                        {group.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span
                      className="truncate font-semibold"
                      style={{ fontSize: "13px", color: isOpen ? "#c9a96e" : "rgba(255,255,255,0.75)" }}
                    >
                      {group.name}
                    </span>
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded-full"
                      style={{
                        fontSize: "9px",
                        fontWeight: 600,
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.40)",
                      }}
                    >
                      {group.rooms.length}
                    </span>
                  </div>
                  <svg
                    className="shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                  >
                    <path d="M2 4l4 4 4-4" stroke="rgba(255,255,255,0.40)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-0.5 pl-3 pb-1">
                    {group.rooms.map((room) => (
                      <RoomItem
                        key={room.uuid}
                        room={room}
                        isActive={activeRoomUuid === room.uuid}
                        onSelect={onSelect}
                        onDelete={onDelete}
                        canDelete={true}
                        indent
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "rgba(8,6,4,0.70)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="px-4 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: "#c9a96e" }}>
          Expert Chat
        </p>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
          Ask our travel experts
        </p>
      </div>

      <div className="px-3 pt-3 shrink-0">
        <button
          onClick={onNewRoom}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "rgba(201,169,110,0.15)",
            border: "1px solid rgba(201,169,110,0.35)",
            color: "#c9a96e",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,169,110,0.25)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(201,169,110,0.15)")}
        >
          ✦ New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(201,169,110,0.2) transparent" }}>
        {rooms.length === 0 && (
          <p className="text-center mt-8 px-4" style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>
            No chats yet. Start one!
          </p>
        )}
        {rooms.map((room) => (
          <RoomItem
            key={room.uuid}
            room={room}
            isActive={activeRoomUuid === room.uuid}
            onSelect={onSelect}
            onDelete={onDelete}
            canDelete={true}
          />
        ))}
      </div>
    </div>
  );
}

// ── Room Item ──────────────────────────────────────────────────────────────────

function RoomItem({ room, isActive, onSelect, onDelete, canDelete, indent = false }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirmDelete(true);
  };

  const handleConfirm = (e) => {
    e.stopPropagation();
    onDelete(room.uuid);
    setConfirmDelete(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  return (
    <div
      className="relative group"
      style={{ paddingLeft: indent ? "4px" : "0" }}
    >
      {confirmDelete && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-xl px-3"
          style={{
            background: "rgba(15,10,5,0.95)",
            border: "1px solid rgba(248,113,113,0.30)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.60)" }}>Delete chat?</span>
          <button
            onClick={handleConfirm}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(248,113,113,0.20)", border: "1px solid rgba(248,113,113,0.35)", color: "rgba(248,113,113,0.90)" }}
          >
            Yes
          </button>
          <button
            onClick={handleCancel}
            className="px-2.5 py-1 rounded-lg text-xs"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.40)" }}
          >
            No
          </button>
        </div>
      )}

      <button
        onClick={() => onSelect(room)}
        className="w-full text-left px-3 py-3 rounded-xl transition-all"
        style={{
          background: isActive ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.04)",
          border: isActive ? "1px solid rgba(201,169,110,0.30)" : "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <p
            className="font-medium truncate flex-1"
            style={{ fontSize: "13px", color: isActive ? "#c9a96e" : "rgba(255,255,255,0.75)" }}
          >
            {room.topic || "Travel Question"}
          </p>
          {canDelete && !confirmDelete && (
            <button
              onClick={handleDeleteClick}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded"
              style={{ color: "rgba(248,113,113,0.70)" }}
              title="Delete conversation"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.30)" }}>
            {room.creator_name}
          </p>
          <span
            className="px-1.5 py-0.5 rounded-full"
            style={{
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              background: room.status === "open" ? "rgba(110,231,183,0.12)" : "rgba(255,255,255,0.06)",
              color: room.status === "open" ? "rgba(110,231,183,0.80)" : "rgba(255,255,255,0.30)",
            }}
          >
            {room.status.toUpperCase()}
          </span>
        </div>
      </button>
    </div>
  );
}

// ── New Room Modal ─────────────────────────────────────────────────────────────

function NewRoomModal({ onClose, onCreate }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    await onCreate(topic.trim() || null);
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "rgba(15,12,8,0.97)", border: "1px solid rgba(201,169,110,0.20)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: "#c9a96e" }}>
          Start a New Chat
        </p>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>
          Briefly describe your travel question (optional)
        </p>
        <input
          autoFocus
          className="w-full px-4 py-3 rounded-xl outline-none text-sm"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.85)",
          }}
          placeholder="e.g. Best places to visit in Rajasthan under ₹15,000"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.50)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(201,169,110,0.20)",
              border: "1px solid rgba(201,169,110,0.40)",
              color: "#c9a96e",
            }}
          >
            {loading ? "Creating..." : "Start Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chat Window ────────────────────────────────────────────────────────────────

function ChatWindow({ room, messages, currentUser, typingUsers, onSend, onEdit, onDelete, onTyping, connected }) {
  const [text, setText] = useState("");
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const bottomRef = useRef(null);
  const editInputRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    const handleOutsideClick = () => setSelectedMsgId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (onTyping) onTyping();
  };

  const handleEditSave = (id) => {
    if (!editText.trim()) return;
    onEdit(id, editText.trim());
    setEditingId(null);
    setEditText("");
    setSelectedMsgId(null);
  };

  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditText(msg.content);
    setSelectedMsgId(null);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleMsgClick = (e, msgId) => {
    e.stopPropagation();
    setSelectedMsgId((prev) => (prev === msgId ? null : msgId));
  };

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "rgba(201,169,110,0.50)" }}>
          Expert Chat
        </p>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>
          {currentUser?.role === "admin" || currentUser?.role === "expert"
            ? "Select a conversation"
            : "Select a conversation or start a new one"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        className="px-5 py-3.5 shrink-0 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div>
          <p className="font-semibold" style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
            {room.topic || "Travel Question"}
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.30)", marginTop: "1px" }}>
            with {room.creator_name}
            {" · "}
            <span style={{ color: room.status === "open" ? "rgba(110,231,183,0.70)" : "rgba(255,255,255,0.25)" }}>
              {room.status}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: connected ? "#6ee7b7" : "#f87171" }} />
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.30)" }}>
            {connected ? "Live" : "Connecting..."}
          </span>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(201,169,110,0.2) transparent" }}
      >
        {messages.length === 0 && (
          <p className="text-center mt-12" style={{ fontSize: "13px", color: "rgba(255,255,255,0.20)" }}>
            No messages yet. Say hello! 👋
          </p>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          const isSystem = msg.type === "system";
          const isDeleted = msg.is_deleted;
          const isSelected = selectedMsgId === msg.id;

          if (isSystem) {
            return (
              <div key={msg.id ?? msg.timestamp} className="text-center my-1">
                <span
                  className="px-3 py-1 rounded-full"
                  style={{ fontSize: "11px", color: "rgba(255,255,255,0.30)", background: "rgba(255,255,255,0.05)" }}
                >
                  {msg.text || msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {!isMe && (
                <p
                  className="mb-0.5 px-1"
                  style={{
                    fontSize: "10px",
                    color: msg.sender_role === "expert" || msg.sender_role === "admin"
                      ? "#c9a96e"
                      : "rgba(255,255,255,0.35)",
                    fontWeight: 600,
                  }}
                >
                  {msg.sender_name}
                  {(msg.sender_role === "expert" || msg.sender_role === "admin") && " ✦"}
                </p>
              )}

              <div
                className="relative max-w-[72%] px-4 py-2.5 rounded-2xl cursor-pointer select-text"
                style={{
                  background: isMe ? "rgba(201,169,110,0.20)" : "rgba(255,255,255,0.08)",
                  border: isMe
                    ? `1px solid ${isSelected ? "rgba(201,169,110,0.55)" : "rgba(201,169,110,0.30)"}`
                    : `1px solid ${isSelected ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.08)"}`,
                  borderBottomRightRadius: isMe ? "4px" : "16px",
                  borderBottomLeftRadius: isMe ? "16px" : "4px",
                  transition: "border-color 0.15s",
                }}
                onClick={(e) => {
                  if (isMe && !isDeleted && editingId !== msg.id) handleMsgClick(e, msg.id);
                }}
              >
                {editingId === msg.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      ref={editInputRef}
                      className="w-full px-2 py-1 rounded-lg outline-none text-sm"
                      style={{
                        background: "rgba(255,255,255,0.10)",
                        border: "1px solid rgba(201,169,110,0.40)",
                        color: "rgba(255,255,255,0.90)",
                        minWidth: "180px",
                      }}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditSave(msg.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEdit} style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)" }}>
                        Cancel
                      </button>
                      <button onClick={() => handleEditSave(msg.id)} style={{ fontSize: "11px", color: "#c9a96e", fontWeight: 600 }}>
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: "13px",
                      lineHeight: "1.5",
                      color: isDeleted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.85)",
                      fontStyle: isDeleted ? "italic" : "normal",
                    }}
                  >
                    {isDeleted ? "This message was deleted" : msg.content}
                  </p>
                )}
              </div>

              {isMe && !isDeleted && editingId !== msg.id && isSelected && (
                <div
                  className="flex items-center gap-1 mt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => startEdit(msg)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: "rgba(201,169,110,0.15)",
                      border: "1px solid rgba(201,169,110,0.25)",
                      color: "#c9a96e",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { onDelete(msg.id); setSelectedMsgId(null); }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: "rgba(248,113,113,0.12)",
                      border: "1px solid rgba(248,113,113,0.20)",
                      color: "rgba(248,113,113,0.80)",
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5 mt-0.5 px-1">
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>
                  {formatTime(msg.created_at)}
                </span>
                {msg.is_edited && !msg.is_deleted && (
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.20)" }}>· edited</span>
                )}
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "rgba(201,169,110,0.60)", animation: `xpBounce 1s infinite ${i * 0.15}s` }}
                />
              ))}
            </div>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)", fontStyle: "italic" }}>
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div
        className="px-4 py-3 shrink-0 flex items-center gap-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <input
          className="flex-1 px-4 py-2.5 rounded-xl outline-none text-sm"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.85)",
          }}
          placeholder={connected ? "Type a message..." : "Connecting..."}
          value={text}
          disabled={!connected || room.status === "closed"}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={!connected || !text.trim() || room.status === "closed"}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0"
          style={{
            background: connected && text.trim() ? "rgba(201,169,110,0.25)" : "rgba(255,255,255,0.05)",
            border: connected && text.trim() ? "1px solid rgba(201,169,110,0.45)" : "1px solid rgba(255,255,255,0.08)",
            color: connected && text.trim() ? "#c9a96e" : "rgba(255,255,255,0.25)",
          }}
        >
          Send
        </button>
      </div>

      {room.status === "closed" && (
        <div
          className="px-4 py-2 text-center shrink-0"
          style={{
            background: "rgba(248,113,113,0.08)",
            borderTop: "1px solid rgba(248,113,113,0.15)",
            fontSize: "12px",
            color: "rgba(248,113,113,0.70)",
          }}
        >
          This conversation has been closed.
        </div>
      )}
    </div>
  );
}

// ── Main ExpertChat Page ───────────────────────────────────────────────────────

const ExpertChat = () => {
  const { user, token, handleUnauthorized } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mobileView, setMobileView] = useState("list");
  const wsRef = useRef(null);
  const typingTimeout = useRef(null);
  const navigate = useNavigate();

  // ── Load rooms ─────────────────────────────────────────
  // FIX: check r.status before parsing, guard array, call handleUnauthorized on 401
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/chat/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          handleUnauthorized(); // clears token → ProtectedRoute redirects to /login
          return [];
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [token]);

  // ── Connect WebSocket when room changes ────────────────
  useEffect(() => {
    if (!activeRoom || !token) return;

    fetch(`${API_URL}/chat/rooms/${activeRoom.uuid}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) { handleUnauthorized(); return []; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(console.error);

    const ws = new WebSocket(`${WS_URL}/chat/ws/${activeRoom.uuid}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "typing") {
        setTypingUsers((prev) => prev.includes(data.sender_name) ? prev : [...prev, data.sender_name]);
      } else if (data.type === "stop_typing") {
        setTypingUsers((prev) => prev.filter((u) => u !== data.sender_name));
      } else if (data.type === "edit") {
        setMessages((prev) => prev.map((m) => (m.id === data.id ? { ...m, ...data } : m)));
      } else if (data.type === "delete") {
        setMessages((prev) => prev.map((m) => m.id === data.message_id ? { ...m, is_deleted: true } : m));
      } else if (data.type === "system") {
        setMessages((prev) => [...prev, { ...data, id: Date.now() }]);
        setTypingUsers((prev) => prev.filter((u) => u !== data.sender_name));
      } else {
        setMessages((prev) => [...prev, data]);
        setTypingUsers((prev) => prev.filter((u) => u !== data.sender_name));
      }
    };

    return () => ws.close();
  }, [activeRoom, token]);

  const handleSelectRoom = (room) => {
    setActiveRoom(room);
    setMessages([]);
    setTypingUsers([]);
    setMobileView("chat");
  };

  const handleCreateRoom = async (topic) => {
    const res = await fetch(`${API_URL}/chat/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ topic }),
    });
    if (res.status === 401) { handleUnauthorized(); return; }
    const room = await res.json();
    setRooms((prev) => [room, ...prev]);
    setShowModal(false);
    handleSelectRoom(room);
  };

  const handleDeleteRoom = async (roomUuid) => {
    try {
      const res = await fetch(`${API_URL}/chat/rooms/${roomUuid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleUnauthorized(); return; }
      if (res.ok) {
        setRooms((prev) => prev.filter((r) => r.uuid !== roomUuid));
        if (activeRoom?.uuid === roomUuid) {
          setActiveRoom(null);
          setMessages([]);
          setTypingUsers([]);
          wsRef.current?.close();
        }
      }
    } catch (err) {
      console.error("Failed to delete room", err);
    }
  };

  const handleSend = (text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", text }));
      clearTimeout(typingTimeout.current);
      wsRef.current.send(JSON.stringify({ type: "stop_typing" }));
    }
  };

  const handleTyping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing" }));
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        wsRef.current?.send(JSON.stringify({ type: "stop_typing" }));
      }, 2000);
    }
  };

  const handleEdit = (messageId, newText) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "edit", message_id: messageId, text: newText }));
    }
  };

  const handleDelete = (messageId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "delete", message_id: messageId }));
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Outfit:wght@300;400;500;600&display=swap');

        @keyframes xpBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }

        .xp-wallpaper-ec {
          position: fixed; inset: 0; z-index: 0;
          background-image: url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=85');
          background-size: cover;
          background-position: center 35%;
        }
        .xp-wallpaper-ec::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(160deg,rgba(4,3,2,0.82) 0%,rgba(8,6,4,0.72) 50%,rgba(4,3,2,0.85) 100%);
        }

        .ec-layout {
          height: calc(100vh - 56px);
        }
        @media (min-width: 768px) {
          .ec-layout {
            height: calc(100vh - 64px);
          }
        }
      `}</style>

      <div className="xp-wallpaper-ec" />

      <div className="relative z-10 flex flex-col" style={{ minHeight: "100vh" }}>
        <Navbar />

        <div className="ec-layout flex w-full overflow-hidden">
          <div
            className={`
              ${mobileView === "list" ? "flex" : "hidden"}
              md:flex flex-col overflow-hidden shrink-0
              w-full md:w-72
            `}
            style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}
          >
            <RoomList
              rooms={rooms}
              activeRoomUuid={activeRoom?.uuid}
              onSelect={handleSelectRoom}
              onNewRoom={() => setShowModal(true)}
              onDelete={handleDeleteRoom}
              currentUser={user}
            />
          </div>

          <div
            className={`
              ${mobileView === "chat" ? "flex" : "hidden"}
              md:flex flex-1 flex-col overflow-hidden
            `}
            style={{
              background: "rgba(8,6,4,0.55)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
            }}
          >
            {mobileView === "chat" && (
              <button
                className="md:hidden flex items-center gap-2 px-4 py-2.5 shrink-0"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  fontSize: "13px",
                  color: "#c9a96e",
                }}
                onClick={() => setMobileView("list")}
              >
                ← Back to chats
              </button>
            )}

            <ChatWindow
              room={activeRoom}
              messages={messages}
              currentUser={user}
              typingUsers={typingUsers}
              onSend={handleSend}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTyping={handleTyping}
              connected={connected}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <NewRoomModal onClose={() => setShowModal(false)} onCreate={handleCreateRoom} />
      )}
    </>
  );
};

export default ExpertChat;