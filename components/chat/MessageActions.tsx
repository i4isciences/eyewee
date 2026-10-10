"use client";

import { useEffect, useRef, useState } from "react";

export function MessageActions({ onReply, onReadAloud }: { onReply: () => void; onReadAloud: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="msg-actions" ref={ref}>
      <button type="button" className="msg-actions-trigger" aria-label="Message actions" onClick={() => setOpen((v) => !v)}>
        ⋯
      </button>
      {open && (
        <div className="msg-actions-menu">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onReply();
            }}
          >
            ↩ Reply
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onReadAloud();
            }}
          >
            🔊 Read aloud
          </button>
        </div>
      )}
    </div>
  );
}
