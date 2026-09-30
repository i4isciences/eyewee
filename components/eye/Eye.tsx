// eyewee's animated eye — the persona mark. Renders one of the 5 LOCKED
// states: Idle, Wake, Listening, Thinking, Spark. See
// eyewee_eye_states.html for the interactive reference this was ported
// from, and the six-layer-pipeline doc for how Thinking/Spark map to
// eyewee's actual reasoning.
//
// This component is CONTROLLED — it does not decide its own state. In
// production, `state` is driven by real conversation activity (wake-word
// detection, message send, response streaming, answer ready), not a
// timer. "Stuck" is not a state — if a prolonged pause is needed on a
// hard problem, that is Thinking's own "eyes can pause closed for a
// moment" behavior, already built in below, not a separate state to add.
//
// usagePercent (added 2026-09-30): a pure color overlay on top of the
// same 5-state behavior above -- nothing about the state logic changes.
// Below 70%, no tint. 70-100%, the rendered colors interpolate smoothly
// toward a warm (not alarm-red) palette. At 100%, eyewee is still fully
// interactive -- no lockout logic lives in this component.

"use client";

import { useEffect, useRef, useState } from "react";

export type EyeState = "idle" | "wake" | "listening" | "thinking" | "spark";

export interface EyeProps {
  /** Which of the 5 locked states to render. Controlled by the caller. */
  state: EyeState;
  /** Pixel width of the eye; height scales to match the 200:150 viewBox ratio. Default 200. */
  size?: number;
  /** Overrides for the brand palette. Defaults to the locked navy/gold. */
  colors?: Partial<{
    navy: string;
    navyDeep: string;
    gold: string;
    goldDeep: string;
    sclera: string;
  }>;
  /** 0-100. Above 70, colors warm smoothly toward a reddish tint. Not a lockout signal. */
  usagePercent?: number;
  className?: string;
}

const DEFAULT_COLORS = {
  navy: "#182D5A",
  navyDeep: "#0F2040",
  gold: "#F4A725",
  goldDeep: "#D98C12",
  sclera: "#2A3E6E",
};

// Where each tinted channel heads toward at 100% usage -- warm ember tones, deliberately not a
// stop-sign/alarm red (this isn't a failure state, just a "getting warm" signal).
const HOT_COLORS = {
  navy: "#5C2A1E",
  gold: "#E8703D",
  goldDeep: "#C25A2E",
  sclera: "#6E3730",
};

const TINT_START = 70;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpColor(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}

function applyUsageTint(base: typeof DEFAULT_COLORS, usagePercent?: number) {
  if (!usagePercent || usagePercent <= TINT_START) return base;
  const t = Math.min(1, (usagePercent - TINT_START) / (100 - TINT_START));
  return {
    ...base,
    navy: lerpColor(base.navy, HOT_COLORS.navy, t),
    gold: lerpColor(base.gold, HOT_COLORS.gold, t),
    goldDeep: lerpColor(base.goldDeep, HOT_COLORS.goldDeep, t),
    sclera: lerpColor(base.sclera, HOT_COLORS.sclera, t),
  };
}

// Pupil radius per state — matches the locked reference exactly.
const PUPIL_RADIUS: Record<EyeState, number> = {
  idle: 14,
  wake: 14,
  listening: 23,
  thinking: 11,
  spark: 14,
};

const REST_CX = 100;
const DART_LEFT_CX = 88;
const DART_RIGHT_CX = 112;

export function Eye({ state, size = 200, colors, usagePercent, className }: EyeProps) {
  const c = applyUsageTint({ ...DEFAULT_COLORS, ...colors }, usagePercent);
  const height = Math.round((size / 200) * 150);

  const [eyeOpen, setEyeOpen] = useState(state !== "idle");
  const [pupilCx, setPupilCx] = useState(REST_CX);
  const [sparkOn, setSparkOn] = useState(state === "spark");
  const [sparkKey, setSparkKey] = useState(0); // bump to replay the pulse animation

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const thinkingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearAllTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (thinkingInterval.current) {
      clearInterval(thinkingInterval.current);
      thinkingInterval.current = null;
    }
  }

  function after(ms: number, fn: () => void) {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }

  // Blink `times` times — eyelid closes for 130ms, reopens, 220ms gap between blinks.
  function blink(times: number) {
    let n = 0;
    function cycle() {
      setEyeOpen(false);
      after(130, () => {
        setEyeOpen(true);
        n++;
        if (n < times) after(220, cycle);
      });
    }
    cycle();
  }

  // Thinking's dart-and-occasionally-pause-closed loop. Every 5th tick,
  // closes the eyelid for 1.4s (the "pauses closed for a moment on a hard
  // one" behavior) — this IS what "Stuck" was describing; it is not a
  // separate state.
  function startThinkingLoop() {
    let tick = 0;
    thinkingInterval.current = setInterval(() => {
      tick++;
      if (tick % 5 === 0) {
        setEyeOpen(false);
        after(1400, () => setEyeOpen(true));
      } else if (tick % 2 === 0) {
        setPupilCx(DART_LEFT_CX);
        after(380, () => setPupilCx(REST_CX));
      } else {
        setPupilCx(DART_RIGHT_CX);
        after(380, () => setPupilCx(REST_CX));
      }
    }, 650);
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- this effect *is* the state machine: it
       drives a purely visual animation transition on every `state` prop change, not derived data.
       There's no non-Effect equivalent that doesn't reintroduce the exact "why did the animation
       not restart" bugs this pattern (and the sibling exhaustive-deps disable below) exists to avoid. */
    clearAllTimers();

    switch (state) {
      case "idle":
        setPupilCx(REST_CX);
        setEyeOpen(false);
        setSparkOn(false);
        break;
      case "wake":
        setPupilCx(REST_CX);
        setEyeOpen(true);
        setSparkOn(false);
        after(250, () => blink(2));
        break;
      case "listening":
        setPupilCx(REST_CX);
        setEyeOpen(true);
        setSparkOn(false);
        break;
      case "thinking":
        setPupilCx(REST_CX);
        setEyeOpen(true);
        setSparkOn(false);
        after(300, startThinkingLoop);
        break;
      case "spark":
        setPupilCx(REST_CX);
        setEyeOpen(true);
        setSparkOn(true);
        setSparkKey((k) => k + 1); // replay the pulse animation on every entry
        break;
    }

    return clearAllTimers;
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const pupilR = PUPIL_RADIUS[state];
  const eyelidShift = 46; // px the lids travel when open, matches the reference exactly

  return (
    <div className={className} style={{ width: size, height, display: "inline-block" }}>
      <svg width={size} height={height} viewBox="0 0 200 150" role="img" aria-label={`eyewee — ${state}`}>
        <ellipse cx="100" cy="75" rx="68" ry="40" fill="none" stroke={c.gold} strokeWidth={1.6} />
        <clipPath id="eyewee-eye-clip">
          <ellipse cx="100" cy="75" rx="66" ry="38" />
        </clipPath>
        <g clipPath="url(#eyewee-eye-clip)">
          <ellipse cx="100" cy="75" rx="66" ry="38" fill={c.sclera} />
          <circle cx="100" cy="75" r="22" fill="none" stroke={c.goldDeep} strokeWidth={1.2} opacity={0.6} />
          <circle
            cx={pupilCx}
            cy="75"
            r={pupilR}
            fill={c.gold}
            style={{ transition: "r 0.4s ease, cx 0.5s ease" }}
          />
          <g
            key={sparkKey}
            style={{
              opacity: sparkOn ? 1 : 0,
              transformOrigin: "100px 75px",
              transition: "opacity 0.3s ease",
              animation: sparkOn ? "eyewee-spark-pulse 0.6s ease" : undefined,
            }}
          >
            <path d="M100 58 L104 71 L117 75 L104 79 L100 92 L96 79 L83 75 L96 71 Z" fill="#FFFFFF" />
          </g>
          <rect
            x="20"
            y="20"
            width="160"
            height="55"
            fill={c.navy}
            style={{
              transform: eyeOpen ? `translateY(-${eyelidShift}px)` : "translateY(0)",
              transition: "transform 0.35s cubic-bezier(.4,0,.2,1)",
            }}
          />
          <rect
            x="20"
            y="75"
            width="160"
            height="55"
            fill={c.navy}
            style={{
              transform: eyeOpen ? `translateY(${eyelidShift}px)` : "translateY(0)",
              transition: "transform 0.35s cubic-bezier(.4,0,.2,1)",
            }}
          />
        </g>
      </svg>
      <style>{`
        @keyframes eyewee-spark-pulse {
          0% { transform: scale(0.3); }
          60% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default Eye;
