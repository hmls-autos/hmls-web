/**
 * Gemini-compatible OpenAI model provider.
 *
 * Patches Zypher's OpenAIModelProvider to handle Gemini's streaming format
 * where tool call `index` fields may be missing from delta events.
 *
 * @see https://github.com/spinsirr/zypher-agent/commit/9204733
 */
import { Observable } from "rxjs";
import type {
  FinalMessage,
  ModelEvent,
  ModelProvider,
  ModelStream,
  ProviderInfo,
  StreamChatParams,
  TokenUsage,
} from "@corespeed/zypher";
import type { FileAttachmentCacheMap } from "@corespeed/zypher";
import { type ClientOptions, OpenAI } from "openai";
import * as z from "zod";

export interface GeminiOpenAIProviderOptions {
  model: string;
  apiKey: string;
  baseUrl: string;
  openaiClientOptions?: ClientOptions;
}

export class GeminiOpenAIProvider implements ModelProvider {
  readonly #model: string;
  #client: OpenAI;

  constructor(options: GeminiOpenAIProviderOptions) {
    this.#model = options.model;
    this.#client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
      ...options.openaiClientOptions,
    });
  }

  get info(): ProviderInfo {
    return {
      name: "gemini-openai",
      version: "1.0.0",
      capabilities: ["vision", "tool_calling"],
    };
  }

  get modelId(): string {
    return this.#model;
  }

  streamChat(
    params: StreamChatParams,
    _fileAttachmentCacheMap?: FileAttachmentCacheMap,
  ): ModelStream {
    const openaiTools: OpenAI.Chat.ChatCompletionTool[] | undefined = params
      .tools?.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: z.toJSONSchema(tool.schema) as OpenAI.FunctionParameters,
          strict: false,
        },
      }));

    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = params
      .messages.map((m) => {
        if (m.role === "user") {
          const toolMessages: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];
          const textParts: OpenAI.Chat.ChatCompletionContentPartText[] = [];

          for (const c of m.content) {
            if (c.type === "text") {
              textParts.push({ type: "text", text: c.text });
            } else if (c.type === "tool_result") {
              const resultText = c.content
                .filter(
                  (b): b is { type: "text"; text: string } => b.type === "text",
                )
                .map((b) => b.text)
                .join("\n");
              toolMessages.push({
                role: "tool",
                content: resultText,
                tool_call_id: c.toolUseId,
              });
            }
          }

          const result: OpenAI.Chat.ChatCompletionMessageParam[] = [];
          if (toolMessages.length > 0) result.push(...toolMessages);
          if (textParts.length > 0) {
            result.push({ role: "user", content: textParts });
          }
          return result;
        }

        // Assistant message
        const toolCalls = m.content.filter((c) => c.type === "tool_use");
        return {
          role: m.role as "assistant",
          content: m.content
            .filter((c) => c.type === "text")
            .map((c) => ({
              type: "text" as const,
              text: (c as { type: "text"; text: string }).text,
            })),
          ...(toolCalls.length > 0
            ? {
              tool_calls: toolCalls.map((c) => ({
                id: (c as { toolUseId: string }).toolUseId,
                type: "function" as const,
                function: {
                  name: (c as { name: string }).name,
                  arguments: JSON.stringify(
                    (c as { input: unknown }).input,
                  ),
                },
              })),
            }
            : {}),
        };
      }).flat();

    const stream = this.#client.chat.completions.stream(
      {
        model: this.#model,
        messages: [
          { role: "system", content: params.system },
          ...formattedMessages,
        ],
        max_completion_tokens: params.maxTokens,
        tools: openaiTools,
      },
      { signal: params.signal },
    );

    const observable = new Observable<ModelEvent>((subscriber) => {
      const emittedToolCalls = new Set<string>();
      const toolCallIds = new Map<number, string>();
      // Track tool call ids by name for Gemini (which may omit index)
      const toolCallIdsByName = new Map<string, string>();
      let nextAutoIndex = 0;

      stream.on("content.delta", (event) => {
        subscriber.next({ type: "text", content: event.delta });
      });

      stream.on("chunk", (chunk) => {
        const toolCalls = chunk.choices[0]?.delta?.tool_calls;
        if (toolCalls) {
          for (let i = 0; i < toolCalls.length; i++) {
            const tc = toolCalls[i];
            // Fall back to array position when index is missing (Gemini)
            const index = tc.index ?? i;
            if (tc.id) {
              toolCallIds.set(index, tc.id);
              if (tc.function?.name) {
                toolCallIdsByName.set(tc.function.name, tc.id);
              }
            }
          }
        }
      });

      stream.on("tool_calls.function.arguments.delta", (event) => {
        const toolName = event.name;
        // Fall back to auto-index when index is missing (Gemini)
        const toolIndex = event.index ?? nextAutoIndex;
        const toolKey = `${toolIndex}`;

        // Try index map, then name map, then fallback
        const toolUseId = toolCallIds.get(toolIndex) ??
          toolCallIdsByName.get(toolName) ??
          `fallback_${toolIndex}`;

        if (!emittedToolCalls.has(toolKey)) {
          emittedToolCalls.add(toolKey);
          nextAutoIndex = toolIndex + 1;
          subscriber.next({
            type: "tool_use",
            toolUseId,
            toolName,
          });
        }

        subscriber.next({
          type: "tool_use_input",
          toolUseId,
          toolName,
          partialInput: event.arguments_delta,
        });
      });

      stream.on("error", (error) => {
        subscriber.error(error);
      });

      stream.on("finalChatCompletion", (completion) => {
        const message = completion.choices[0].message;
        subscriber.next({
          type: "message",
          message: mapToFinalMessage(message, completion.usage),
        });
      });

      stream.on("end", () => {
        subscriber.complete();
      });
    });

    return {
      events: observable,
      finalMessage: async (): Promise<FinalMessage> => {
        const completion = await stream.finalChatCompletion();
        return mapToFinalMessage(
          completion.choices[0].message,
          completion.usage,
        );
      },
    };
  }
}

function mapToFinalMessage(
  message: OpenAI.Chat.Completions.ChatCompletionMessage,
  usage?: OpenAI.Completions.CompletionUsage,
): FinalMessage {
  return {
    role: message.role,
    content: [
      { type: "text", text: message.content ?? "" },
      ...(message.tool_calls?.filter((c) => c.type === "function").map(
        (c) => ({
          type: "tool_use" as const,
          toolUseId: c.id,
          name: c.function.name,
          input: JSON.parse(c.function.arguments),
        }),
      ) ?? []),
    ],
    stop_reason: message.tool_calls?.length ? "tool_use" : "end_turn",
    timestamp: new Date(),
    usage: usage ? mapUsage(usage) : undefined,
  };
}

function mapUsage(usage: OpenAI.Completions.CompletionUsage): TokenUsage {
  return {
    input: {
      total: usage.prompt_tokens,
      cacheRead: usage.prompt_tokens_details?.cached_tokens ?? undefined,
    },
    output: {
      total: usage.completion_tokens,
      thinking: usage.completion_tokens_details?.reasoning_tokens ?? undefined,
    },
    total: usage.total_tokens,
  };
}
