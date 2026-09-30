"use client";

export function MicButton({
  recording,
  transcribing,
  voiceError,
  onClick,
}: {
  recording: boolean;
  transcribing: boolean;
  voiceError: string | null;
  onClick: () => void;
}) {
  return (
    <div className="mic-wrap">
      <button
        type="button"
        className={`mic-btn${recording ? " is-recording" : ""}`}
        aria-label={recording ? "Stop recording" : "Speak to eyewee"}
        title={recording ? "Stop recording" : "Speak to eyewee"}
        disabled={transcribing}
        onClick={onClick}
      >
        {transcribing ? "…" : recording ? "◼" : "🎤"}
      </button>
      {voiceError && <p className="mic-error">{voiceError}</p>}
    </div>
  );
}
