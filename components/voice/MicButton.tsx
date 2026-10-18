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
        aria-label={recording ? "Stop recording" : "Speak to eyewee — sent for transcription, not saved"}
        title={recording ? "Stop recording" : "Speak to eyewee — sent for transcription, not saved"}
        disabled={transcribing}
        onClick={onClick}
      >
        {transcribing ? "…" : recording ? "◼" : "🎤"}
      </button>
      {recording && <p className="mic-recording-note">Recording… sent for transcription, not saved.</p>}
      {voiceError && <p className="mic-error">{voiceError}</p>}
    </div>
  );
}
