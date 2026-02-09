import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required");
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
}

export async function transcribeAudio(
  audioData: Uint8Array,
  filename: string,
): Promise<TranscriptionResult> {
  // Create a File object from the audio data
  // Copy to a new ArrayBuffer to ensure compatibility
  const buffer = audioData.buffer.slice(
    audioData.byteOffset,
    audioData.byteOffset + audioData.byteLength,
  ) as ArrayBuffer;
  const file = new File([buffer], filename, { type: "audio/webm" });

  const response = await getOpenAI().audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
  });

  return {
    text: response.text,
    duration: response.duration ?? 0,
  };
}
