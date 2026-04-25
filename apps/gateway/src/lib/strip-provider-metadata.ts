// Workaround for vercel/ai#13733: the AI SDK 6.0.120+ server emits
// `providerMetadata` on stream chunks (e.g. `tool-output-available`),
// but the client's `uiMessageChunkSchema` uses `z.strictObject()` and
// rejects unknown keys. Gemini's `thoughtSignature` reliably triggers
// the validation error and crashes the chat stream.
//
// Until vercel/ai#13787 lands, strip `providerMetadata` from every
// AI-SDK SSE chunk on the server side. The data is purely informational
// (model reasoning trace, OpenAI item id, etc.) and the UI doesn't need
// it. Remove this helper after upgrading to a fixed AI SDK release.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Return a new Response whose body is the original SSE stream with
 *  `providerMetadata` removed from every JSON chunk. */
export function stripProviderMetadata(res: Response): Response {
  if (!res.body) return res;

  let buffer = "";
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      // Keep the trailing partial line in the buffer; flush the rest.
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        controller.enqueue(encoder.encode(scrub(line) + "\n"));
      }
    },
    flush(controller) {
      if (buffer.length > 0) {
        controller.enqueue(encoder.encode(scrub(buffer)));
        buffer = "";
      }
    },
  });

  return new Response(res.body.pipeThrough(transform), {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

/** Strip `providerMetadata` from a single SSE line ("data: {...}"). Other
 *  lines (event:, id:, blank lines) pass through untouched. */
function scrub(line: string): string {
  const prefix = "data: ";
  if (!line.startsWith(prefix)) return line;
  const json = line.slice(prefix.length);
  if (!json || json === "[DONE]") return line;
  try {
    const obj = JSON.parse(json);
    if (obj && typeof obj === "object" && "providerMetadata" in obj) {
      delete (obj as Record<string, unknown>).providerMetadata;
      return prefix + JSON.stringify(obj);
    }
    return line;
  } catch {
    // Not JSON — pass through unchanged.
    return line;
  }
}
