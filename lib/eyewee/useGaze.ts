"use client";

import { useEffect, useRef } from "react";

export type GazeTarget = { x: number; y: number };

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

/**
 * Tracks where the eyes should look: the pointer by default, or a held arrow key's direction
 * (arrow keys are ignored while the user is typing in a field, so text-cursor movement still
 * works normally). Returns a mutable ref rather than state -- consumed inside a useFrame loop,
 * so it never triggers a React re-render on every pointer/key event.
 */
export function useGazeTarget(containerRef: React.RefObject<HTMLElement | null>) {
  const target = useRef<GazeTarget>({ x: 0, y: 0 });
  const keyOverride = useRef<GazeTarget | null>(null);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const el = containerRef.current;
      const rect = el ? el.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (event.clientX - cx) / (window.innerWidth / 2);
      const dy = (event.clientY - cy) / (window.innerHeight / 2);
      if (!keyOverride.current) {
        target.current = { x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) };
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      const map: Record<string, GazeTarget> = {
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
      };
      const next = map[event.key];
      if (!next) return;
      event.preventDefault();
      keyOverride.current = next;
      target.current = next;
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        keyOverride.current = null;
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [containerRef]);

  return target;
}
