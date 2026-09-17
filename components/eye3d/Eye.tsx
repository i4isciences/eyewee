"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GazeTarget } from "@/lib/eyewee/useGaze";

export type EyeState = "idle" | "wake" | "listening" | "thinking" | "spark";

const PUPIL_SCALE: Record<EyeState, number> = {
  idle: 0.34,
  wake: 0.34,
  listening: 0.52,
  thinking: 0.27,
  spark: 0.34,
};

function useStarShape(radius: number) {
  return useMemo(() => {
    const shape = new THREE.Shape();
    const points = 8;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : radius * 0.42;
      const angle = (i / (points * 2)) * Math.PI * 2;
      const x = Math.sin(angle) * r;
      const y = Math.cos(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape, 1);
  }, [radius]);
}

export function Eye({
  x,
  state,
  gaze,
  enteredStateAt,
}: {
  x: number;
  state: EyeState;
  gaze: React.RefObject<GazeTarget>;
  enteredStateAt: React.RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const squash = useRef<THREE.Group>(null);
  const pupilGroup = useRef<THREE.Group>(null);
  const sparkRef = useRef<THREE.Mesh>(null);
  const sparkLight = useRef<THREE.PointLight>(null);
  const squashValue = useRef(0.05);
  const pupilScaleValue = useRef(0.34);

  const starGeometry = useStarShape(0.34);

  useFrame((_, delta) => {
    // Wall-clock time, shared with the "entered this state at" timestamp set in EyePair --
    // three.js's own clock isn't a common epoch across both places.
    const t = performance.now() / 1000;
    const since = t - (enteredStateAt.current ?? t);

    // -- How "open" the eye is (1 = wide open, ~0.05 = closed), with wake's double-blink and
    // thinking's periodic blink layered on top of the base per-state target --
    let openTarget = state === "idle" ? 0.05 : 1;
    if (state === "wake" && since < 0.62) {
      const cyclePos = since % 0.62;
      openTarget = cyclePos < 0.09 || (cyclePos > 0.22 && cyclePos < 0.3) ? 0.05 : 1;
    }
    if (state === "thinking") {
      const shortCycle = t % 3.2;
      const longCycle = t % 6.4;
      const shortBlink = shortCycle > 2.9 && shortCycle < 3.05;
      const longPause = longCycle > 2.9 && longCycle < 3.55;
      openTarget = shortBlink || longPause ? 0.05 : 1;
    }
    squashValue.current += (openTarget - squashValue.current) * Math.min(1, delta * 9);

    if (squash.current) {
      squash.current.scale.set(1 + (1 - squashValue.current) * 0.1, squashValue.current, 1);
    }

    // -- Pupil size --
    const pupilTarget = PUPIL_SCALE[state];
    pupilScaleValue.current += (pupilTarget - pupilScaleValue.current) * Math.min(1, delta * 6);
    if (pupilGroup.current) pupilGroup.current.scale.setScalar(pupilScaleValue.current / 0.34);

    // -- Gaze: pointer/arrow-key driven, plus a thinking-only dart on top --
    const dart = state === "thinking" ? Math.sin(t * 2.3) * 0.32 : 0;
    const gazeX = state === "idle" ? 0 : gaze.current.x;
    const gazeY = state === "idle" ? 0 : gaze.current.y;
    if (group.current) {
      const targetYaw = gazeX * 0.5 + dart;
      const targetPitch = gazeY * 0.32;
      group.current.rotation.y += (targetYaw - group.current.rotation.y) * Math.min(1, delta * 7);
      group.current.rotation.x += (targetPitch - group.current.rotation.x) * Math.min(1, delta * 7);
    }

    // -- Spark burst envelope --
    const sparkOn = state === "spark";
    const sparkEnvelope = sparkOn ? Math.max(0, Math.sin(Math.min(since / 0.6, 1) * Math.PI)) : 0;
    if (sparkRef.current) {
      sparkRef.current.scale.setScalar(0.4 + sparkEnvelope * 0.9);
      (sparkRef.current.material as THREE.MeshStandardMaterial).opacity = sparkOn ? sparkEnvelope : 0;
    }
    if (sparkLight.current) sparkLight.current.intensity = sparkOn ? sparkEnvelope * 3.5 : 0;
  });

  return (
    <group position={[x, 0, 0]}>
      <group ref={group}>
        {/* Soft glow halo behind the eye -- stays put even through a blink */}
        <mesh position={[0, 0, -0.4]}>
          <circleGeometry args={[1.55, 48]} />
          <meshBasicMaterial color="#f4a725" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Everything below squashes vertically to blink / close */}
        <group ref={squash}>
          {/* Sclera -- bright and warm so it reads clearly on a dark page */}
          <mesh>
            <sphereGeometry args={[1, 48, 48]} />
            <meshStandardMaterial color="#faf6ec" emissive="#f6efd9" emissiveIntensity={0.18} roughness={0.32} />
          </mesh>

          {/* Iris ring */}
          <mesh position={[0, 0, 0.94]}>
            <ringGeometry args={[0.34, 0.48, 64]} />
            <meshStandardMaterial color="#f4a725" emissive="#d98c12" emissiveIntensity={0.55} side={THREE.DoubleSide} />
          </mesh>

          {/* Pupil group (scales for listening/thinking) */}
          <group ref={pupilGroup} position={[0, 0, 0.95]}>
            <mesh>
              <circleGeometry args={[0.34, 48]} />
              <meshStandardMaterial color="#182d5a" />
            </mesh>
            <mesh position={[-0.1, 0.11, 0.01]}>
              <circleGeometry args={[0.075, 24]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} />
            </mesh>
          </group>

          {/* Spark burst */}
          <mesh ref={sparkRef} geometry={starGeometry} position={[0, 0, 1.02]}>
            <meshStandardMaterial color="#f4a725" emissive="#f4a725" emissiveIntensity={1.4} transparent opacity={0} />
          </mesh>
          <pointLight ref={sparkLight} position={[0, 0, 1.4]} color="#f4a725" intensity={0} distance={3} />
        </group>
      </group>
    </group>
  );
}
