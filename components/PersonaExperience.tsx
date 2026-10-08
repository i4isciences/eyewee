"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, type EyeState } from "@/components/eye/Eye";
import type { StorageRepository } from "@/lib/storage/providers/types";
import { STORAGE_REPOSITORIES } from "@/lib/storage/providers/types";
import { MicButton } from "@/components/voice/MicButton";
import { useVoiceSession } from "@/components/voice/useVoiceSession";

type Message = { id: string; sender: "user" | "eyewee"; text: string };
type ConversationSummary = { id: string; title: string; updatedAt: string };
type StorageRow = { repository: StorageRepository; connected: boolean; externalAccountLabel: string | null };
type MemoryFact = { id: string; text: string; category: string };
type MemorySuggestion = { text: string; category: string };

const SUGGESTED_PROMPTS = [
  "Help me explain my project to someone outside my field",
  "What should I sort out in my first month here?",
  "I'm stuck on where to even start with this",
  "Help me get through the literature systematically",
];

const REPOSITORY_LABEL: Record<StorageRepository, string> = {
  zenodo: "Zenodo",
  osf: "OSF",
  dryad: "Dryad",
  figshare: "Figshare",
};

// Matches the locked reference's own auto-return timing for Spark. There is no equivalent for
// error handling anymore -- "stuck" isn't one of the 5 locked states (idle/wake/listening/
// thinking/spark); errors just settle back to idle and speak for themselves via the message text.
const SPARK_AUTO_RETURN_MS = 1100;

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function relativeDay(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// eyewee is account-free (no login, no email) but conversations, storage connections, and memory
// are now real and persisted server-side, keyed to an anonymous per-browser device id
// (lib/eyewee/session/deviceId.ts) instead of an account. Real send-message replies stay behind
// the crisis-response gate -- see app/api/conversations/[id]/messages/route.ts -- so `data.reply`
// is still the same canned "still being built" text today; only the round trip changed.
export function PersonaExperience() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<"hero" | "thread">("hero");
  const [heroInput, setHeroInput] = useState("");
  const [composerInput, setComposerInput] = useState("");
  const [eyeState, setEyeState] = useState<EyeState>("idle");
  const [sending, setSending] = useState(false);
  const [storageRows, setStorageRows] = useState<StorageRow[]>([]);
  const [memoryFacts, setMemoryFacts] = useState<MemoryFact[]>([]);
  const [pendingFact, setPendingFact] = useState<MemorySuggestion | null>(null);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editingFactText, setEditingFactText] = useState("");
  const [usagePercent, setUsagePercent] = useState(0);
  const threadRef = useRef<HTMLDivElement>(null);
  const sparkTimer = useRef<number | null>(null);
  const voice = useVoiceSession();

  function refreshMemory() {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((data: { facts?: MemoryFact[] }) => setMemoryFacts(data.facts ?? []))
      .catch(() => {});
  }

  function refreshUsage() {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((data: { usagePercent?: number }) => setUsagePercent(data.usagePercent ?? 0))
      .catch(() => {});
  }

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data: { conversations?: ConversationSummary[] }) => setConversations(data.conversations ?? []))
      .catch(() => {});
    fetch("/api/storage/connections")
      .then((r) => r.json())
      .then((data: { connections?: StorageRow[] }) => setStorageRows(data.connections ?? []))
      .catch(() => {});
    refreshMemory();
    refreshUsage();
  }, []);

  async function approveFact() {
    if (!pendingFact) return;
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: pendingFact.text, category: pendingFact.category }),
    }).catch(() => {});
    setPendingFact(null);
    refreshMemory();
  }

  function dismissFact() {
    setPendingFact(null);
  }

  async function deleteFact(id: string) {
    await fetch(`/api/memory/${id}`, { method: "DELETE" }).catch(() => {});
    setMemoryFacts((prev) => prev.filter((f) => f.id !== id));
  }

  function startEditingFact(fact: MemoryFact) {
    setEditingFactId(fact.id);
    setEditingFactText(fact.text);
  }

  async function saveEditedFact() {
    if (!editingFactId) return;
    const response = await fetch(`/api/memory/${editingFactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editingFactText }),
    });
    if (response.ok) refreshMemory();
    setEditingFactId(null);
  }

  function settleToSpark() {
    if (sparkTimer.current) window.clearTimeout(sparkTimer.current);
    setEyeState("spark");
    sparkTimer.current = window.setTimeout(() => setEyeState("idle"), SPARK_AUTO_RETURN_MS);
  }

  // Only wakes from idle, and only reverts to idle if still awake -- never clobbers
  // listening/thinking/spark if something else started while the field was focused.
  function wakeOnFocus() {
    setEyeState((prev) => (prev === "idle" ? "wake" : prev));
  }
  function settleOnBlur() {
    setEyeState((prev) => (prev === "wake" ? "idle" : prev));
  }

  async function loadConversation(id: string) {
    setActiveId(id);
    setMode("thread");
    setMessages([]);
    requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }));
    try {
      const response = await fetch(`/api/conversations/${id}/messages`);
      const data = (await response.json()) as { messages?: Message[] };
      setMessages(data.messages ?? []);
      requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }));
    } catch {
      // Leave the thread empty rather than blocking the UI -- the sidebar item still works if retried.
    }
  }

  function startNewConversation() {
    setMode("hero");
    setActiveId(null);
    setMessages([]);
    setHeroInput("");
  }

  async function disconnectStorage(repository: StorageRepository) {
    await fetch(`/api/storage/connections/${repository}`, { method: "DELETE" }).catch(() => {});
    setStorageRows((prev) => prev.map((row) => (row.repository === repository ? { ...row, connected: false, externalAccountLabel: null } : row)));
  }

  async function handleMicClick() {
    if (voice.recording) {
      setEyeState("thinking");
      const text = await voice.stopRecording();
      if (text) submit(text);
      else setEyeState("idle");
      return;
    }
    setEyeState("wake");
    const started = await voice.startRecording();
    setEyeState(started ? "listening" : "idle");
  }

  async function submit(rawText: string) {
    const text = rawText.trim();
    if (!text || sending) return;
    if (sparkTimer.current) window.clearTimeout(sparkTimer.current);

    let conversationId = activeId;
    if (!conversationId) {
      const title = text.length > 60 ? `${text.slice(0, 57)}...` : text;
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        const data = (await response.json()) as { conversation?: ConversationSummary };
        if (!data.conversation) return;
        conversationId = data.conversation.id;
        setConversations((prev) => [data.conversation as ConversationSummary, ...prev]);
        setActiveId(conversationId);
      } catch {
        setEyeState("idle");
        return;
      }
    }

    setMode("thread");
    setHeroInput("");
    setComposerInput("");
    setMessages((prev) => [...prev, { id: uid(), sender: "user", text }]);
    setSending(true);
    setEyeState("thinking");
    requestAnimationFrame(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }));

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as { eyeweeMessage?: Message; error?: string; suggestedFact?: MemorySuggestion | null };
      if (!response.ok || !data.eyeweeMessage) {
        setMessages((prev) => [...prev, { id: uid(), sender: "eyewee", text: data.error ?? "I ran into a snag there. Mind trying that again?" }]);
        setEyeState("idle");
      } else {
        setMessages((prev) => [...prev, data.eyeweeMessage as Message]);
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, updatedAt: new Date().toISOString() } : c)).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)));
        settleToSpark();
        void voice.speak(data.eyeweeMessage.text);
        if (data.suggestedFact) setPendingFact(data.suggestedFact);
        refreshUsage();
      }
    } catch {
      setEyeState("idle");
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
            <Eye state={eyeState} size={190} usagePercent={usagePercent} />
          </div>
          <p className="hero-greeting">What are you working on?</p>
          <p className="hero-greeting-sub">Say it — eyewee carries it, guides it, and cracks the toughest problems.</p>

          <div className="hero-search">
            <div className="hero-search-bar">
              <input
                type="text"
                value={heroInput}
                placeholder="Ask eyewee anything"
                onFocus={wakeOnFocus}
                onBlur={settleOnBlur}
                onChange={(event) => setHeroInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submit(heroInput);
                  }
                }}
              />
              <MicButton recording={voice.recording} transcribing={voice.transcribing} voiceError={voice.voiceError} onClick={handleMicClick} />
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

        <div className="persona-side-section">
          <h2>Storage</h2>
          <ul className="persona-storage-list">
            {STORAGE_REPOSITORIES.map((repository) => {
              const row = storageRows.find((r) => r.repository === repository);
              return (
                <li key={repository} className="persona-storage-row">
                  <span>{REPOSITORY_LABEL[repository]}</span>
                  {row?.connected ? (
                    <button type="button" className="persona-storage-btn" onClick={() => disconnectStorage(repository)}>
                      Disconnect
                    </button>
                  ) : (
                    <a className="persona-storage-btn" href={`/api/storage/connect/${repository}`}>
                      Connect
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="persona-side-section">
          <h2>Memory</h2>
          {memoryFacts.length === 0 ? (
            <p className="persona-empty-note">eyewee hasn&rsquo;t saved anything about you yet.</p>
          ) : (
            <ul className="persona-recent-list">
              {memoryFacts.map((fact) =>
                editingFactId === fact.id ? (
                  <li key={fact.id} className="persona-memory-item persona-memory-editing">
                    <input
                      type="text"
                      value={editingFactText}
                      onChange={(event) => setEditingFactText(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && saveEditedFact()}
                      autoFocus
                    />
                    <button type="button" onClick={saveEditedFact} aria-label="Save">
                      ✓
                    </button>
                  </li>
                ) : (
                  <li key={fact.id} className="persona-memory-item">
                    <span onClick={() => startEditingFact(fact)}>{fact.text}</span>
                    <button type="button" className="persona-memory-delete" onClick={() => deleteFact(fact.id)} aria-label="Delete">
                      ×
                    </button>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        {pendingFact && (
          <div className="persona-fact-suggestion">
            <p>eyewee would like to remember: &ldquo;{pendingFact.text}&rdquo;</p>
            <div className="persona-fact-suggestion-actions">
              <button type="button" className="btn btn-gold" onClick={approveFact}>
                Save it
              </button>
              <button type="button" className="btn btn-outline" onClick={dismissFact}>
                Not now
              </button>
            </div>
          </div>
        )}

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
                    <span className="persona-recent-when">{relativeDay(c.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="persona-sidebar-footer">
          <p className="persona-sidebar-note">Saved to this device — no account needed.</p>
        </div>
      </aside>

      <div className="persona-main">
        <div className="persona-main-header">
          <div className="persona-eye-wrap">
            <Eye state={eyeState} size={64} usagePercent={usagePercent} />
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
                    <Eye state="wake" size={26} />
                  </div>
                )}
                <div className={`persona-bubble persona-bubble-${message.sender}`}>{message.text}</div>
              </div>
            ))}
            {sending && (
              <div className="persona-thinking-indicator">
                <div className="persona-msg-eye-mark">
                  <Eye state="thinking" size={26} />
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
              onFocus={wakeOnFocus}
              onBlur={settleOnBlur}
              onChange={(event) => setComposerInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit(composerInput);
                }
              }}
            />
            <MicButton recording={voice.recording} transcribing={voice.transcribing} voiceError={voice.voiceError} onClick={handleMicClick} />
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
          <p className="persona-composer-note">eyewee can make mistakes. Check important information independently. Patient names, MRNs, or other health-identifying info don&rsquo;t belong here.</p>
        </div>
      </div>
    </div>
  );
}
