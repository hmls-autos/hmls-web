import { z } from "zod";
import { transcribeAudio as whisperTranscribe } from "../lib/whisper.ts";
import { getMedia } from "../lib/r2.ts";
import { toolResult } from "@hmls/shared/tool-result";

const transcribeAudioSchema = z.object({
  r2Key: z.string().describe("R2 storage key for the audio file"),
  filename: z.string().describe("Original filename of the audio"),
});

export const transcribeAudioTool = {
  name: "transcribeAudio",
  description: "Transcribe vehicle audio (engine sounds, brake noises, etc.) using Whisper",
  schema: transcribeAudioSchema,
  execute: async (params: z.infer<typeof transcribeAudioSchema>) => {
    const { r2Key, filename } = params;

    // Fetch audio from R2
    const audioData = await getMedia(r2Key);

    // Transcribe with Whisper
    const result = await whisperTranscribe(audioData, filename);

    return toolResult({
      transcription: result.text,
      durationSeconds: result.duration,
      analysis: `Audio transcription: "${result.text}". Duration: ${result.duration} seconds.`,
    });
  },
};
