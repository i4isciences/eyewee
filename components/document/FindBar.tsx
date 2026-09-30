"use client";

import { useEffect, useRef } from "react";

export function FindBar({
  open,
  term,
  count,
  currentIndex,
  onChange,
  onNext,
  onPrev,
  onClose,
}: {
  open: boolean;
  term: string;
  count: number;
  currentIndex: number;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="findbar">
      <input
        ref={inputRef}
        type="text"
        className="findbar-input"
        placeholder="Search this document..."
        value={term}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (event.shiftKey) onPrev();
            else onNext();
          }
          if (event.key === "Escape") onClose();
        }}
      />
      <span className="findbar-count">{count === 0 ? "0 / 0" : `${currentIndex + 1} / ${count}`}</span>
      <button type="button" className="findbar-btn" title="Previous (Shift+Enter)" onClick={onPrev}>
        ↑
      </button>
      <button type="button" className="findbar-btn" title="Next (Enter)" onClick={onNext}>
        ↓
      </button>
      <button type="button" className="findbar-close" title="Close (Esc)" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}
