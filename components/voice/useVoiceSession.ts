"use client";

import { useCallback, useRef, useState } from "react";

// Push-to-talk voice I/O (docs/DEVELOPMENT_PLAN.md §6.3, Phase 5) -- click to start, click again to
// stop and transcribe. Deliberately not wake-word/always-listening: that's part of the 5-state
// eye-model claim this plan couldn't verify a source for (§8.1) -- push-to-talk needs none of that
// and works with the eye's existing 4 states.
export function useVoiceSession() {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      return true;
    } catch {
      setVoiceError("Couldn't access the microphone — check your browser permissions.");
      return false;
    }
  }, []);

  const stopRecording = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }
      recorder.onstop = async () => {
        setRecording(false);
        recorder.stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });

        setTranscribing(true);
        try {
          const response = await fetch("/api/voice/transcribe", { method: "POST", headers: { "Content-Type": blob.type }, body: blob });
          const data = (await response.json()) as { text?: string; error?: string };
          if (!response.ok) {
            setVoiceError(data.error ?? "Couldn't transcribe that.");
            resolve(null);
            return;
          }
          resolve(data.text?.trim() || null);
        } catch {
          setVoiceError("Couldn't reach the transcription service.");
          resolve(null);
        } finally {
          setTranscribing(false);
        }
      };
      recorder.stop();
    });
  }, []);

  // Speaking a reply out loud is an enhancement, not a requirement -- failures here stay silent
  // (voiceError is reserved for the input side, where silence would hide a real problem).
  //
  // `speaking` tracks actual playback (set false on `onended`/`onpause`, not on `.play()`
  // resolving -- that promise settles once playback *starts*, not when it finishes, which
  // previously made `speaking` go false almost immediately while audio was still playing and gave
  // no way to stop it mid-sentence).
  const speak = useCallback(async (text: string) => {
    currentAudioRef.current?.pause();
    setSpeaking(true);
    try {
      const response = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        setSpeaking(false);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      const cleanup = () => {
        URL.revokeObjectURL(url);
        setSpeaking(false);
        if (currentAudioRef.current === audio) currentAudioRef.current = null;
      };
      audio.onended = cleanup;
      audio.onpause = cleanup;
      audio.onerror = cleanup;
      await audio.play();
    } catch {
      setSpeaking(false);
      // silent -- see comment above
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    currentAudioRef.current?.pause();
  }, []);

  return { recording, transcribing, speaking, voiceError, startRecording, stopRecording, speak, stopSpeaking };
}
