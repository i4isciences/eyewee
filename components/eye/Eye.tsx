"use client";

import { useEffect, useId, useRef } from "react";
import { useGazeTarget } from "@/lib/eyewee/useGaze";

export type EyeState = "idle" | "thinking" | "stuck" | "spark";

/**
 * eyewee's eye -- a direct, faithful port of the verified reference (navy lids, navy-to-gold
 * iris, exact lash/crack/spark coordinates, exact CSS keyframe timings). Behavior states
 * (idle/thinking/stuck/spark) are driven by CSS classes exactly the way the reference's own
 * `setBehavior` does it -- remove all behavior classes, force a reflow, add the new one, so
 * re-entering the same state restarts its animation instead of no-op'ing. The one addition
 * beyond the reference is gaze tracking: a wrapping group around the iris moves it toward the
 * pointer or the held arrow key, composing underneath whatever the CSS animation is doing on
 * top of it (so it still tracks in idle, and rolls as normal during thinking). `excited` is the
 * other addition -- while it's true (the postdoc is actively typing to it), the iris grows, a
 * visible "it's paying attention to you" reaction.
 */
export function Eye({ state, size = 220, excited = false }: { state: EyeState; size?: number; excited?: boolean }) {
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

  // Wakes up the moment it mounts: starts closed (the lids together), opens, and the iris pops
  // wide before settling -- an excited "good to see you" beat, plays once per mount. The class is
  // removed once it's done so it can't linger and fight with the `excited` (typing) reaction below
  // over the same transform.
  useEffect(() => {
    const svg = svgRef.current;
    svg?.classList.add("eye-enter");
    const timer = window.setTimeout(() => svg?.classList.remove("eye-enter"), 950);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let frame = 0;
    function tick() {
      if (gazeWrapRef.current) {
        const x = (gaze.current.x * 22).toFixed(2);
        const y = (gaze.current.y * 14).toFixed(2);
        gazeWrapRef.current.setAttribute("transform", `translate(${x} ${y})`);
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [gaze]);

  const clip = `${uid}-clip`;
  const scleraGradient = `${uid}-sclera`;
  const irisGradient = `${uid}-iris`;
  const rayFade = `${uid}-ray`;

  return (
    <div ref={containerRef} className="eye-single" style={{ width: size, height: size * 0.875 }}>
      <svg
        ref={svgRef}
        className={`eye-svg${excited ? " is-excited" : ""}`}
        data-usage-tier="0"
        viewBox="0 -70 400 350"
        width="100%"
        height="100%"
        role="img"
        aria-label="eyewee"
      >
        <defs>
          <clipPath id={clip}>
            <path d="M 30,120 C 110,20 290,15 370,120 C 290,205 110,215 30,120 Z" />
          </clipPath>
          <radialGradient id={scleraGradient} cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e9ecf2" />
          </radialGradient>
          <radialGradient id={irisGradient} cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#3a4d78" />
            <stop offset="60%" stopColor="#1b2a4a" />
            <stop offset="100%" stopColor="#c89b3c" />
          </radialGradient>
          <linearGradient id={rayFade} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${clip})`}>
          <path d="M 30,120 C 110,20 290,15 370,120 C 290,205 110,215 30,120 Z" fill={`url(#${scleraGradient})`} />

          <g stroke="var(--gold-deep)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path className="crack-path" data-tier="1" d="M 58,105 L 80,97 L 98,87 M 80,97 L 93,107" />
            <path className="crack-path" data-tier="1" d="M 55,130 L 80,140 L 98,150 M 80,140 L 90,127" />
            <path className="crack-path" data-tier="2" d="M 342,105 L 320,97 L 302,87 M 320,97 L 307,107" />
            <path className="crack-path" data-tier="2" d="M 345,130 L 320,140 L 302,150 M 320,140 L 310,127" />
            <path className="crack-path" data-tier="3" d="M 50,120 L 85,120 L 100,110 M 85,120 L 100,132" />
            <path className="crack-path" data-tier="3" d="M 350,120 L 315,120 L 300,110 M 315,120 L 300,132" />
          </g>

          {/* Gaze wrapper (added beyond the reference) -- the iris + pupil roll as one unit inside it */}
          <g ref={gazeWrapRef}>
            <g className="iris-pupil">
              <circle cx="200" cy="115" r="62" fill={`url(#${irisGradient})`} />
              <g className="pupil-inner">
                <circle cx="200" cy="115" r="27" fill="var(--navy-strong)" />
                <circle cx="183" cy="98" r="8" fill="rgba(255,255,255,0.85)" />
              </g>
            </g>
          </g>

          <g className="spark-group">
            <circle cx="200" cy="115" r="38" fill="var(--gold)" opacity="0.25" />
            <path
              d="M 200,83 L 205,103 L 222.6,92.4 L 212,110 L 232,115 L 212,120 L 222.6,137.6 L 205,127 L 200,147 L 195,127 L 177.4,137.6 L 188,120 L 168,115 L 188,110 L 177.4,92.4 L 195,103 Z"
              fill="var(--gold)"
            />
          </g>
        </g>

        {/* Soft boundary around the white of the eye -- a muted shadow line, not a hard outline */}
        <path
          d="M 30,120 C 110,20 290,15 370,120 C 290,205 110,215 30,120 Z"
          fill="none"
          stroke="#9aa2b8"
          strokeWidth={2.5}
          strokeOpacity={0.4}
        />

        <g className="spark-rays" fill={`url(#${rayFade})`}>
          <path d="M 202.5,126.7 L 138.5,240.7 L 112.3,222.3 L 197.5,123.3 Z" />
          <path d="M 202.9,125.9 L 177.3,254.0 L 146.7,244.6 L 197.1,124.1 Z" />
          <path d="M 203.0,125.0 L 216.0,255.0 L 184.0,255.0 L 197.0,125.0 Z" />
          <path d="M 202.9,124.1 L 253.3,244.6 L 222.7,254.0 L 197.1,125.9 Z" />
          <path d="M 202.5,123.3 L 287.7,222.3 L 261.5,240.7 L 197.5,126.7 Z" />
        </g>

        <g className="lid lid-top">
          <g clipPath={`url(#${clip})`}>
            <path d="M 30,120 C 110,138 290,142 370,120 L 380,-60 L 20,-60 Z" fill="var(--navy)" />
          </g>
          <g stroke="var(--navy)" strokeWidth={3} strokeLinecap="round">
            <path d="M 68.9,126.7 L 71.3,108.9" />
            <path d="M 109.2,131.0 L 111.2,107.1" />
            <path d="M 153.5,133.8 L 154.9,103.8" />
            <path d="M 200.0,135.0 L 200.3,99.0" />
            <path d="M 246.5,134.5 L 245.1,92.5" />
            <path d="M 290.8,132.1 L 287.1,84.2" />
            <path d="M 331.1,127.7 L 323.4,74.3" />
          </g>
        </g>

        <g className="lid lid-bottom">
          <g clipPath={`url(#${clip})`}>
            <path d="M 30,120 C 110,102 290,98 370,120 L 380,295 L 20,295 Z" fill="var(--navy)" />
          </g>
          <g stroke="var(--navy)" strokeWidth={2.5} strokeLinecap="round">
            <path d="M 95.2,110.3 L 96.4,122.2" />
            <path d="M 153.5,106.2 L 154.2,121.7" />
            <path d="M 200.0,105.0 L 200.1,124.0" />
            <path d="M 246.5,105.5 L 245.8,128.0" />
            <path d="M 304.8,109.1 L 302.3,135.0" />
          </g>
        </g>
      </svg>
    </div>
  );
}
