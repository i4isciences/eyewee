"use client";

import { useEffect, useState } from "react";
import { EyePair, type EyeState } from "@/components/eye3d/EyePair";

export function LandingHeroEye({ size = 170 }: { size?: number }) {
  const [state, setState] = useState<EyeState>("idle");

  useEffect(() => {
    const timer = window.setTimeout(() => setState("wake"), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return <EyePair state={state} size={size} />;
}
