"use client";

import { Mic, Send, Square, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type AudioRecording,
  useAudioRecorder,
} from "@/hooks/useAudioRecorder";

interface AudioRecorderProps {
  onSend: (recording: AudioRecording) => void;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Waveform({ data }: { data: Uint8Array | null }) {
  if (!data) return null;

  const bars = 32;
  const step = Math.floor(data.length / bars);
  const heights: number[] = [];
  for (let i = 0; i < bars; i++) {
    const val = data[i * step] || 128;
    heights.push(Math.max(4, Math.abs(val - 128) * 0.6));
  }

  return (
    <div className="flex items-center justify-center gap-0.5 h-12">
      {heights.map((h, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: waveform bars are position-based
          key={i}
          className="w-1 bg-primary rounded-full transition-all duration-75"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

export function AudioRecorder({ onSend, onClose }: AudioRecorderProps) {
  const {
    isRecording,
    isProcessing,
    duration,
    analyserData,
    startRecording,
    stopRecording,
  } = useAudioRecorder();
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    try {
      setError(null);
      await startRecording();
    } catch {
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const handleStop = async () => {
    const result = await stopRecording();
    setRecording(result);
  };

  const handleSend = () => {
    if (recording) {
      onSend(recording);
      onClose();
    }
  };

  const handleDiscard = () => {
    setRecording(null);
  };

  // Memoize the preview URL so we revoke exactly once per recording instead
  // of leaking a fresh objectURL on every render. URL.createObjectURL pins
  // the underlying Blob in memory until revoked, so a user who records 5
  // sounds and re-opens the recorder repeatedly would otherwise hold
  // megabytes of audio blobs alive for the entire page session.
  const previewUrl = useMemo(
    () => (recording ? URL.createObjectURL(recording.blob) : null),
    [recording],
  );

  useEffect(() => {
    if (!previewUrl) return;
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (error) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 rounded-t-xl border-t border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <p className="mb-4 text-center text-sm text-red-600 dark:text-red-500">
          {error}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-md border border-border bg-card py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 rounded-t-xl border-t border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      {/* Duration — tabular nums for crisp ticking */}
      <p className="mb-4 text-center font-mono text-2xl font-semibold tabular-nums tracking-tight">
        {formatDuration(recording?.durationSeconds ?? duration)}
      </p>

      {/* Waveform */}
      {isRecording && <Waveform data={analyserData} />}

      {/* Processing spinner */}
      {isProcessing && (
        <div className="mb-4 flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          <p className="text-xs text-muted-foreground">Analyzing sound…</p>
        </div>
      )}

      {/* Preview audio + spectrogram */}
      {recording && (
        <div className="mb-4 flex flex-col items-center gap-3">
          {/* biome-ignore lint/performance/noImgElement: data URL, next/image doesn't support base64 */}
          <img
            src={`data:image/png;base64,${recording.spectrogramBase64}`}
            alt="Sound spectrogram"
            className="w-full max-w-sm rounded-md border border-border"
          />
          {previewUrl && (
            // biome-ignore lint/a11y/useMediaCaption: user-recorded audio preview, no captions needed
            <audio controls src={previewUrl} className="w-full max-w-xs" />
          )}
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-6">
        {!isRecording && !recording && (
          <>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStart}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-105 dark:bg-red-500"
              aria-label="Start recording"
            >
              <Mic className="h-6 w-6" />
            </button>
            <div className="w-16" />
          </>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={handleStop}
            className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-red-600 text-white dark:bg-red-500"
            aria-label="Stop recording"
          >
            <Square className="h-5 w-5" />
          </button>
        )}

        {recording && (
          <>
            <button
              type="button"
              onClick={handleDiscard}
              className="rounded-md border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Discard"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </>
        )}
      </div>
    </div>
  );
}
