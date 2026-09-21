"use client";

import { useRef, useState } from "react";
import { Eye, type EyeState } from "@/components/eye/Eye";

type Message = { id: string; sender: "user" | "eyewee"; text: string };
type Conversation = { id: string; title: string; updatedAt: number; messages: Message[] };

const SUGGESTED_PROMPTS = [
  "Help me explain my project to someone outside my field",
  "What should I sort out in my first month here?",
  "I'm stuck on where to even start with this",
  "Help me get through the literature systematically",
];

// Matches the verified reference's own auto-return timings for these two states.
const AUTO_RETURN_MS: Partial<Record<EyeState, number>> = { stuck: 3000, spark: 1100 };

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function now() {
  return Date.now();
}

function relativeDay(ms: number) {
  const diff = Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// No accounts, nothing persisted server-side: conversations live only in this tab, for this
// visit. That's the trade-off of removing login -- see docs/SPEC.md for why the chat itself
// still round-trips through a real (canned, non-model) reply endpoint rather than being purely
// client-side.
export function PersonaExperience() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<"hero" | "thread">("hero");
  const [heroInput, setHeroInput] = useState("");
  const [composerInput, setComposerInput] = useState("");
  const [heroTyping, setHeroTyping] = useState(false);
  const [composerTyping, setComposerTyping] = useState(false);
  const [eyeState, setEyeState] = useState<EyeState>("idle");
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);

  const active = conversations.find((c) => c.id === activeId) || null;
  const messages = active?.messages ?? [];

  function settleTo(state: EyeState, after?: EyeState) {
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    setEyeState(state);
    const delay = AUTO_RETURN_MS[state];
    if (delay) settleTimer.current = window.setTimeout(() => setEyeState(after ?? "idle"), delay);
  }

  function loadConversation(id: string) {
    setActiveId(id);
    setMode("thread");
    requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }));
  }

  function startNewConversation() {
    setMode("hero");
    setActiveId(null);
    setHeroInput("");
  }

  function appendMessage(conversationId: string, message: Message) {
    setConversations((prev) =>
      prev
        .map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, message] } : c))
        .sort((a, b) => b.updatedAt - a.updatedAt)
    );
  }

  async function submit(rawText: string) {
    const text = rawText.trim();
    if (!text || sending) return;
    if (settleTimer.current) window.clearTimeout(settleTimer.current);

    setHeroTyping(false);
    setComposerTyping(false);

    let conversationId = activeId;
    if (!conversationId) {
      conversationId = uid();
      const title = text.length > 60 ? `${text.slice(0, 57)}...` : text;
      const conversation: Conversation = { id: conversationId, title, updatedAt: now(), messages: [] };
      setConversations((prev) => [conversation, ...prev]);
      setActiveId(conversationId);
    }

    setMode("thread");
    setHeroInput("");
    setComposerInput("");
    appendMessage(conversationId, { id: uid(), sender: "user", text });
    setSending(true);
    setEyeState("thinking");
    requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }));

    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as { reply?: string };
      if (!response.ok || !data.reply) {
        appendMessage(conversationId, { id: uid(), sender: "eyewee", text: "I ran into a snag there. Mind trying that again?" });
        settleTo("stuck");
      } else {
        appendMessage(conversationId, { id: uid(), sender: "eyewee", text: data.reply });
        settleTo("spark");
      }
    } catch {
      settleTo("stuck");
    } finally {
      setSending(false);
      requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }));
    }
  }

  if (mode === "hero") {
    return (
      <div className="hero-page">
        <div className="hero-topbar">
          <span className="hero-wordmark">eyewee</span>
          {conversations.length > 0 && (
            <button type="button" className="hero-topbar-link" onClick={() => loadConversation(conversations[0].id)}>
              Recent conversations
            </button>
          )}
        </div>

        <div className="hero-center">
          <div className="hero-eyes">
            <Eye state={eyeState} size={190} excited={heroTyping} />
          </div>
          <p className="hero-greeting">What are you working on?</p>
          <p className="hero-greeting-sub">Say it — eyewee carries it, guides it, and cracks the toughest problems.</p>

          <div className="hero-search">
            <div className="hero-search-bar">
              <input
                type="text"
                value={heroInput}
                placeholder="Ask eyewee anything"
                onFocus={() => setHeroTyping(true)}
                onBlur={() => setHeroTyping(false)}
                onChange={(event) => setHeroInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submit(heroInput);
                  }
                }}
              />
              <button
                type="button"
                className="hero-search-send"
                aria-label="Send"
                disabled={heroInput.trim().length === 0}
                onClick={() => submit(heroInput)}
              >
                &#8593;
              </button>
            </div>
            <div className="hero-pills">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button key={prompt} type="button" className="hero-pill" onClick={() => submit(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="persona">
      <aside className="persona-sidebar">
        <div className="persona-sidebar-header">
          <span className="persona-wordmark">eyewee</span>
        </div>

        <button type="button" className="persona-new-chat" onClick={startNewConversation}>
          <span className="persona-new-chat-plus">+</span> New conversation
        </button>

        <div className="persona-side-section persona-side-recent">
          <h2>This visit</h2>
          {conversations.length === 0 ? (
            <p className="persona-empty-note">Your conversations will show up here.</p>
          ) : (
            <ul className="persona-recent-list">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`persona-recent-item${c.id === activeId ? " is-active" : ""}`}
                    onClick={() => loadConversation(c.id)}
                  >
                    {c.title}
                    <span className="persona-recent-when">{relativeDay(c.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="persona-sidebar-footer">
          <p className="persona-sidebar-note">Nothing here is saved once you close this tab.</p>
        </div>
      </aside>

      <div className="persona-main">
        <div className="persona-main-header">
          <div className="persona-eye-wrap">
            <Eye state={eyeState} size={64} excited={composerTyping} />
          </div>
          <div>
            <div className="persona-header-name">eyewee</div>
            <div className="persona-header-status">{eyeState}</div>
          </div>
        </div>

        <div className="persona-thread" ref={threadRef}>
          <div className="persona-thread-inner">
            {messages.map((message) => (
              <div key={message.id} className={`persona-msg persona-msg-${message.sender}`}>
                {message.sender === "eyewee" && (
                  <div className="persona-msg-eye-mark">
                    <Eye state="idle" size={26} interactive={false} />
                  </div>
                )}
                <div className={`persona-bubble persona-bubble-${message.sender}`}>{message.text}</div>
              </div>
            ))}
            {sending && (
              <div className="persona-thinking-indicator">
                <div className="persona-msg-eye-mark">
                  <Eye state="thinking" size={26} interactive={false} />
                </div>
                <div className="persona-thinking-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="persona-composer">
          <div className="persona-composer-inner">
            <textarea
              rows={1}
              placeholder="Message eyewee"
              value={composerInput}
              onFocus={() => setComposerTyping(true)}
              onBlur={() => setComposerTyping(false)}
              onChange={(event) => setComposerInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit(composerInput);
                }
              }}
            />
            <button
              type="button"
              className="persona-send-btn"
              aria-label="Send message"
              disabled={composerInput.trim().length === 0 || sending}
              onClick={() => submit(composerInput)}
            >
              &#8593;
            </button>
          </div>
          <p className="persona-composer-note">eyewee can make mistakes. Check important information independently.</p>
        </div>
      </div>
    </div>
  );
}
