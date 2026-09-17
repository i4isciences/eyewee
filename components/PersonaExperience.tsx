"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EyePair, type EyeState } from "@/components/eye3d/EyePair";

type Conversation = { id: string; title: string; created_at: string; updated_at: string };
type Message = { id?: string; sender: "user" | "eyewee"; text: string; created_at?: string };

const SUGGESTED_PROMPTS = [
  "Help me explain my project to someone outside my field",
  "What should I sort out in my first month here?",
  "I'm stuck on where to even start with this",
  "Help me get through the literature systematically",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function relativeDay(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.floor((now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / dayMs);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function PersonaExperience({
  initialConversations,
  displayName,
  institution,
}: {
  initialConversations: Conversation[];
  displayName: string;
  institution: string;
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<"hero" | "thread">("hero");
  const [heroInput, setHeroInput] = useState("");
  const [composerInput, setComposerInput] = useState("");
  const [eyeState, setEyeState] = useState<EyeState>("idle");
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const firstName = (displayName || "there").split(" ")[0];

  useEffect(() => {
    const timer = window.setTimeout(() => setEyeState("wake"), 350);
    return () => window.clearTimeout(timer);
  }, []);

  function focusListening() {
    setEyeState((current) => (current === "wake" ? "listening" : current));
  }
  function blurToWake(value: string) {
    if (!value.trim()) setEyeState((current) => (current === "listening" ? "wake" : current));
  }

  async function loadConversation(id: string) {
    setActiveId(id);
    setMode("thread");
    const response = await fetch(`/api/conversations/${id}/messages`);
    const data = (await response.json()) as { messages?: Message[] };
    setMessages(data.messages ?? []);
    requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }));
  }

  async function startNewConversation() {
    setMode("hero");
    setActiveId(null);
    setMessages([]);
    setHeroInput("");
    setEyeState("wake");
  }

  async function submit(rawText: string) {
    const text = rawText.trim();
    if (!text || sending) return;
    if (settleTimer.current) window.clearTimeout(settleTimer.current);

    let conversationId = activeId;
    if (!conversationId) {
      const response = await fetch("/api/conversations", { method: "POST" });
      const data = (await response.json()) as { conversation?: Conversation };
      if (!data.conversation) return;
      conversationId = data.conversation.id;
      setConversations((prev) => [data.conversation as Conversation, ...prev]);
      setActiveId(conversationId);
    }

    setMode("thread");
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setHeroInput("");
    setComposerInput("");
    setSending(true);
    setEyeState("thinking");
    requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }));

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) {
        setMessages((prev) => [
          ...prev,
          { sender: "eyewee", text: "I ran into a snag there. Mind trying that again?" },
        ]);
        setEyeState("wake");
      } else {
        setMessages((prev) => [...prev, { sender: "eyewee", text: data.reply as string }]);
        setConversations((prev) =>
          prev
            .map((c) => (c.id === conversationId ? { ...c, updated_at: new Date().toISOString() } : c))
            .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
        );
        setEyeState("spark");
        settleTimer.current = window.setTimeout(() => setEyeState("wake"), 1300);
      }
    } catch {
      setEyeState("wake");
    } finally {
      setSending(false);
      requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }));
    }
  }

  if (mode === "hero") {
    return (
      <div className="hero-page">
        <div className="glow-field" />
        <div className="hero-topbar">
          <span className="hero-wordmark">eyewee</span>
          <div className="hero-topbar-actions">
            {conversations.length > 0 && (
              <button type="button" className="hero-topbar-link" onClick={() => loadConversation(conversations[0].id)}>
                Recent conversations
              </button>
            )}
            <button
              type="button"
              className="hero-topbar-link"
              onClick={async () => {
                await fetch("/api/auth", { method: "DELETE" });
                router.push("/");
                router.refresh();
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="hero-center">
          <div className="hero-eyes">
            <EyePair state={eyeState} size={190} />
          </div>
          <p className="hero-greeting">
            {eyeState === "idle" ? "…" : `What are you working on, ${firstName}?`}
          </p>
          <p className="hero-greeting-sub">Say it — eyewee carries it, guides it, and cracks the toughest problems.</p>

          <div className="hero-search">
            <div className="hero-search-bar">
              <input
                type="text"
                value={heroInput}
                placeholder="Ask eyewee anything"
                onFocus={focusListening}
                onBlur={() => blurToWake(heroInput)}
                onChange={(event) => {
                  setHeroInput(event.target.value);
                  if (event.target.value.trim()) focusListening();
                }}
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
          <h2>Recent</h2>
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
                    <span className="persona-recent-when">{relativeDay(c.updated_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="persona-sidebar-footer">
          <div className="persona-avatar">{initials(displayName || "eyewee")}</div>
          <div className="persona-profile-info">
            <div className="persona-profile-name">{displayName || "Your account"}</div>
            {institution && <div className="persona-profile-sub">{institution}</div>}
          </div>
        </div>
      </aside>

      <div className="persona-main">
        <div className="persona-main-header">
          <div className="persona-eye-wrap">
            <EyePair state={eyeState} size={64} />
          </div>
          <div>
            <div className="persona-header-name">eyewee</div>
            <div className="persona-header-status">{eyeState}</div>
          </div>
          <button
            type="button"
            className="persona-sign-out"
            onClick={async () => {
              await fetch("/api/auth", { method: "DELETE" });
              router.push("/");
              router.refresh();
            }}
          >
            Sign out
          </button>
        </div>

        <div className="persona-thread" ref={threadRef}>
          <div className="persona-thread-inner">
            {messages.map((message, index) => (
              <div key={message.id ?? index} className={`persona-msg persona-msg-${message.sender}`}>
                {message.sender === "eyewee" && <div className="persona-msg-eye-mark" />}
                <div className={`persona-bubble persona-bubble-${message.sender}`}>{message.text}</div>
              </div>
            ))}
            {sending && (
              <div className="persona-thinking-indicator">
                <div className="persona-msg-eye-mark" />
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
              onFocus={focusListening}
              onBlur={() => blurToWake(composerInput)}
              onChange={(event) => {
                setComposerInput(event.target.value);
                if (event.target.value.trim()) focusListening();
              }}
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
