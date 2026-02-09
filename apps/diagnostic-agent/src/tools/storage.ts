import { z } from "zod";
import { getMedia, uploadMedia } from "../lib/r2.ts";
import { toolResult } from "../lib/tool-result.ts";

const saveMediaSchema = z.object({
  data: z.string().describe("Base64-encoded media data"),
  filename: z.string().describe("Filename for the media"),
  contentType: z.string().describe("MIME type of the media"),
  sessionId: z.string().describe("Session ID for organizing storage"),
});

const getMediaSchema = z.object({
  r2Key: z.string().describe("R2 storage key for the media"),
});

export const saveMediaTool = {
  name: "saveMedia",
  description: "Save uploaded media (photo, audio, video) to cloud storage",
  schema: saveMediaSchema,
  execute: async (params: z.infer<typeof saveMediaSchema>) => {
    const { data, filename, contentType, sessionId } = params;

    // Decode base64 to Uint8Array
    const binaryData = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

    const result = await uploadMedia(
      binaryData,
      filename,
      contentType,
      sessionId,
    );

    return toolResult({
      success: true,
      r2Key: result.key,
      url: result.url,
    });
  },
};

export const getMediaTool = {
  name: "getMedia",
  description: "Retrieve media from cloud storage",
  schema: getMediaSchema,
  execute: async (params: z.infer<typeof getMediaSchema>) => {
    const { r2Key } = params;

    const data = await getMedia(r2Key);

    return toolResult({
      success: true,
      data: btoa(String.fromCharCode(...data)),
      size: data.length,
    });
  },
};
