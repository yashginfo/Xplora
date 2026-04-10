// src/components/Sidebar.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import useTranslate from "../hooks/useTranslate";
import client from "../api/client";

const RESET_SECONDS = 30;

const Sidebar = () => {
  const [title, subtitle, placeholder, greeting, sug1, sug2, sug3] =
    useTranslate([
      "AI Travel Assistant",
      "Ask anything about any destination",
      "Ask about any destination...",
      "Hi! Ask me anything about a destination — weather, crowd, best time, vibe — I'll help you decide.",
      "Best time to visit Goa?",
      "Is Manali safe in December?",
      "Crowd level in Rajasthan in March?",
    ]);

  const [greetingSet, setGreetingSet] = useState(false);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [chip, setChip]               = useState("");
  const [chipUsed, setChipUsed]       = useState(false);
  const [countdown, setCountdown]     = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mobile: controls whether the bottom sheet is expanded
  const [mobileOpen, setMobileOpen]   = useState(false);

  const countdownRef = useRef(null);
  const bottomRef    = useRef(null);

  // ── resetChat ───────────────────────────────────────────────
  const resetChat = useCallback(() => {
    setMessages([{
      role: "ai",
      text: greeting || "Hi! Ask me anything about a destination — weather, crowd, best time, vibe — I'll help you decide.",
    }]);
    setChip("");
    setChipUsed(false);
    setCountdown(null);
    clearTimeout(countdownRef.current);
    setInput("");
    setShowSuggestions(false);
  }, [greeting]);

  // ── Set greeting once translation is ready ─────────────────
  useEffect(() => {
    if (greeting && !greetingSet) {
      setGreetingSet(true);
      setMessages([{ role: "ai", text: greeting }]);
    }
  }, [greeting, greetingSet]);

  // ── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chip, countdown]);

  // ── Lock body scroll when mobile sheet is open ─────────────
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // ── Countdown timer ────────────────────────────────────────
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      clearTimeout(countdownRef.current);
      resetChat();
      return;
    }
    countdownRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(countdownRef.current);
  }, [countdown, resetChat]);

  // ── Send message ───────────────────────────────────────────
  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question) return;

    setChip("");
    setChipUsed(false);
    setCountdown(null);
    clearTimeout(countdownRef.current);
    setShowSuggestions(false);

    const userMsg = { role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
      const res = await client.post("/sidebar/ask", { question, history });
      const { answer, suggested_chip } = res.data;
      setMessages((prev) => [...prev, { role: "ai", text: answer }]);
      if (suggested_chip) setChip(suggested_chip);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Chip click ─────────────────────────────────────────────
  const handleChipClick = async () => {
    if (!chip || chipUsed || loading) return;
    setChipUsed(true);
    const chipQuestion = chip;
    setChip("");
    await sendMessage(chipQuestion);
    setCountdown(RESET_SECONDS);
  };

  const suggestions = [sug1, sug2, sug3].filter(Boolean);

  // ── Shared chat panel content ──────────────────────────────
  const ChatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: "rgba(201,169,110,0.15)" }}>
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-serif font-semibold text-white text-sm">{title}</h3>
          </div>
          <p className="text-xs pl-4" style={{ color: "rgba(201,169,110,0.60)" }}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button
              onClick={resetChat}
              className="text-[10px] px-2.5 py-1 rounded-full transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Clear
            </button>
          )}
          {/* Close button — mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white/60 transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 mr-2"
                style={{ border: "1px solid rgba(201,169,110,0.40)" }}
              >
                <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            )}
            <div
              className={`text-xs leading-relaxed rounded-xl px-3.5 py-2.5 max-w-[82%] ${
                msg.role === "user" ? "bg-amber-400 text-stone-900 font-medium" : ""
              }`}
              style={msg.role === "ai" ? {
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.85)",
              } : {}}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(201,169,110,0.20)", border: "1px solid rgba(201,169,110,0.40)" }}
            >
              <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div
              className="rounded-xl px-3.5 py-2.5"
              style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <span className="flex items-center gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className="w-1 h-1 rounded-full bg-amber-400/50 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </span>
            </div>
          </div>
        )}

        {/* Suggestion chip */}
        {chip && !loading && (
          <div className="flex justify-start pl-8">
            <button
              onClick={handleChipClick}
              className="text-[11px] px-3 py-1.5 rounded-full transition-all duration-200"
              style={{
                background: "rgba(201,169,110,0.12)",
                border: "1px solid rgba(201,169,110,0.35)",
                color: "#c9a96e",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(201,169,110,0.22)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(201,169,110,0.12)"}
            >
              ✦ {chip}
            </button>
          </div>
        )}

        {/* Countdown strip */}
        {countdown !== null && !loading && (
          <div
            className="mx-1 rounded-xl px-3 py-2 flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Chat resets in {countdown}s
            </span>
            <button
              onClick={resetChat}
              className="text-[10px] font-semibold transition-colors"
              style={{ color: "rgba(201,169,110,0.70)" }}
            >
              Reset now
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row + dropdown */}
      <div className="px-4 py-3 border-t shrink-0" style={{ borderColor: "rgba(201,169,110,0.15)" }}>
        {showSuggestions && (
          <div
            className="mb-2 rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(201,169,110,0.20)" }}
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { sendMessage(s); setShowSuggestions(false); }}
                className="w-full text-left text-xs px-3.5 py-2.5 transition-all duration-150 border-b last:border-0"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.65)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(201,169,110,0.12)";
                  e.currentTarget.style.color = "#c9a96e";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowSuggestions((v) => !v)}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
            style={{
              background: showSuggestions ? "rgba(201,169,110,0.20)" : "rgba(255,255,255,0.06)",
              border: showSuggestions ? "1px solid rgba(201,169,110,0.40)" : "1px solid rgba(255,255,255,0.10)",
            }}
            title="Quick questions"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              style={{ color: showSuggestions ? "#c9a96e" : "rgba(255,255,255,0.35)" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 text-xs rounded-lg px-3 py-2.5 focus:outline-none transition-all duration-200 disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.85)",
            }}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(201,169,110,0.50)"}
            onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
          />

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-stone-900 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  // ── Mobile bottom sheet ─────────────────────────────────────
  const MobileView = (
    <>
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          height: "75vh",
          background: "rgba(20,14,6,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(201,169,110,0.20)",
          borderRadius: "20px 20px 0 0",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div style={{ height: "calc(100% - 1.25rem)" }}>
          {ChatContent}
        </div>
      </div>

      {/* Floating trigger button */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl shadow-black/50 transition-all active:scale-95"
          style={{
            background: "rgba(255,185,30,0.90)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,185,30,0.5)",
          }}
        >
          <svg className="w-4 h-4 text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-stone-900 text-sm font-bold">AI Assistant</span>
          {messages.length > 1 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      )}
    </>
  );

  // ── Desktop sidebar panel ───────────────────────────────────
  const DesktopView = (
    <div
      className="flex flex-col h-full"
      style={{
        background: "rgba(255, 185, 30, 0.15)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderLeft: "1px solid rgba(201,169,110,0.20)",
      }}
    >
      {ChatContent}
    </div>
  );

  return (
    <>
      {/* Desktop: full sidebar */}
      <div className="hidden md:flex md:flex-col md:h-full">
        {DesktopView}
      </div>

      {/* Mobile: floating button + bottom sheet */}
      <div className="md:hidden">
        {MobileView}
      </div>
    </>
  );
};

export default Sidebar;