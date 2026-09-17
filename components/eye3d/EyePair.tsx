"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Eye, type EyeState } from "@/components/eye3d/Eye";
import { useGazeTarget } from "@/lib/eyewee/useGaze";

export type { EyeState } from "@/components/eye3d/Eye";

export function EyePair({ state, size = 220 }: { state: EyeState; size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gaze = useGazeTarget(containerRef);
  const enteredStateAt = useRef(0);
  const prevState = useRef<EyeState>(state);

  useEffect(() => {
    if (prevState.current !== state) {
      enteredStateAt.current = performance.now() / 1000;
      prevState.current = state;
    }
  }, [state]);

  return (
    <div ref={containerRef} style={{ width: size * 2.3, height: size, margin: "0 auto" }}>
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.55} color="#dfe6ff" />
        <directionalLight position={[2, 3, 4]} intensity={1.1} color="#fff3da" />
        <directionalLight position={[-3, -1, 2]} intensity={0.4} color="#8fa6ff" />
        <Eye x={-1.32} state={state} gaze={gaze} enteredStateAt={enteredStateAt} />
        <Eye x={1.32} state={state} gaze={gaze} enteredStateAt={enteredStateAt} />
      </Canvas>
    </div>
  );
}
