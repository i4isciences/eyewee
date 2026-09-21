"use client";

import { useEffect, useId, useRef } from "react";
import { useGazeTarget } from "@/lib/eyewee/useGaze";

export type EyeState = "idle" | "thinking" | "stuck" | "spark";

/**
 * eyewee's one and only eye mark -- the clean, simple shape from the landing page (two navy
 * petals framing a white lens, a gold iris), now carrying the full range of expression: real
 * states (idle/thinking/stuck/spark), continuous gaze tracking toward the pointer or the held
 * arrow key, a one-shot "waking up" entrance on every mount, natural ambient blinking, and a
 * grows-when-you-type reaction. Used at every size, everywhere eyewee appears.
 */
export function Eye({
  state,
  size = 220,
  excited = false,
  interactive = true,
}: {
  state: EyeState;
  size?: number;
  excited?: boolean;
  interactive?: boolean;
}) {
  const uid = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gazeWrapRef = useRef<SVGGElement>(null);
  const gaze = useGazeTarget(containerRef);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.classList.remove("behavior-idle", "behavior-thinking", "behavior-stuck", "behavior-spark");
    // Forced reflow so re-entering the same behavior restarts its animation instead of no-op'ing.
    void svg.getBoundingClientRect();
    svg.classList.add(`behavior-${state}`);
  }, [state]);

  // Wakes up the moment it mounts: starts closed, opens, settles -- an excited "good to see you"
  // beat. `eye-enter` is in the *initial* className (not added after mount) so the very first
  // paint -- server-rendered, before any JS runs -- already shows it closed/asleep instead of
  // flashing open first.
  useEffect(() => {
    if (!interactive) return;
    const timer = window.setTimeout(() => svgRef.current?.classList.remove("eye-enter"), 700);
    return () => window.clearTimeout(timer);
  }, [interactive]);

  useEffect(() => {
    if (!interactive) return;
    let frame = 0;
    function tick() {
      if (gazeWrapRef.current) {
        const x = (gaze.current.x * 16).toFixed(2);
        const y = (gaze.current.y * 9).toFixed(2);
        gazeWrapRef.current.setAttribute("transform", `translate(${x} ${y})`);
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [gaze, interactive]);

  const irisGradient = `${uid}-iris`;

  return (
    <div ref={containerRef} className="eye-single" style={{ width: size, height: size * 0.625 }}>
      <svg
        ref={svgRef}
        className={`eye-svg${interactive ? " eye-enter" : ""}${excited ? " is-excited" : ""}`}
        viewBox="0 0 240 150"
        width="100%"
        height="100%"
        role="img"
        aria-label="eyewee"
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id={irisGradient} cx="42%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#ffcf6e" />
            <stop offset="100%" stopColor="var(--gold)" />
          </radialGradient>
        </defs>

        {/* Static navy frame -- never animated */}
        <path d="M14,75 Q120,8 226,75 Q120,42 14,75 Z" fill="var(--navy)" />
        <path d="M14,75 Q120,142 226,75 Q120,108 14,75 Z" fill="var(--navy)" />

        {/* The lens: scales vertically to blink, squint, or widen -- this is the whole "eyelid" */}
        <g className="eye-lens">
          <ellipse cx="120" cy="75" rx="58" ry="27" fill="#ffffff" />
          <g ref={gazeWrapRef}>
            <g className="eye-iris">
              <circle cx="120" cy="75" r="23" fill={`url(#${irisGradient})`} />
              <circle cx="120" cy="75" r="23" fill="none" stroke="var(--navy)" strokeWidth={3} />
              <g className="eye-pupil">
                <circle cx="120" cy="75" r="10" fill="var(--navy)" />
                <circle cx="126" cy="68" r="3.4" fill="#ffffff" />
              </g>
            </g>
          </g>
          <g className="eye-spark">
            <circle cx="120" cy="75" r="30" fill="var(--gold)" opacity={0.3} />
            <path
              d="M120,55 123,68 137,60 128,73 142,75 128,77 137,90 123,82 120,95 117,82 103,90 112,77 98,75 112,73 103,60 117,68 Z"
              fill="var(--gold)"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
