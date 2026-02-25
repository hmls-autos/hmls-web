/**
 * Gemini-compatible OpenAI model provider.
 *
 * Patches Zypher's OpenAIModelProvider to handle two Gemini-specific issues:
 * 1. Missing `index` field in streaming tool call delta events
 * 2. Empty `tool_calls` in finalChatCompletion (SDK doesn't accumulate them for Gemini)
 *
 * We manually accumulate tool calls from streaming chunks and inject them
 * into the FinalMessage so the Zypher agent loop can execute them.
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

/** Accumulated tool call from streaming chunks */
interface AccumulatedToolCall {
  id: string;
  name: string;
  arguments: string;
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

    // Accumulate tool calls from streaming chunks since Gemini's
    // finalChatCompletion returns empty tool_calls
    const accumulatedToolCalls = new Map<number, AccumulatedToolCall>();
    let accumulatedText = "";

    const observable = new Observable<ModelEvent>((subscriber) => {
      const emittedToolCalls = new Set<string>();
      const toolCallIds = new Map<number, string>();
      const toolCallIdsByName = new Map<string, string>();
      let nextAutoIndex = 0;

      stream.on("content.delta", (event) => {
        accumulatedText += event.delta;
        subscriber.next({ type: "text", content: event.delta });
      });

      stream.on("chunk", (chunk) => {
        const toolCalls = chunk.choices[0]?.delta?.tool_calls;
        if (toolCalls) {
          for (let i = 0; i < toolCalls.length; i++) {
            const tc = toolCalls[i];
            const index = tc.index ?? i;
            if (tc.id) {
              toolCallIds.set(index, tc.id);
              // Initialize accumulated tool call (arguments accumulated by delta handler)
              if (!accumulatedToolCalls.has(index)) {
                accumulatedToolCalls.set(index, {
                  id: tc.id,
                  name: tc.function?.name ?? "",
                  arguments: "",
                });
              }
              if (tc.function?.name) {
                toolCallIdsByName.set(tc.function.name, tc.id);
                const acc = accumulatedToolCalls.get(index)!;
                if (!acc.name) acc.name = tc.function.name;
              }
            }
          }
        }
      });

      stream.on("tool_calls.function.arguments.delta", (event) => {
        const toolName = event.name;
        const toolIndex = event.index ?? nextAutoIndex;
        const toolKey = `${toolIndex}`;

        const toolUseId = toolCallIds.get(toolIndex) ??
          toolCallIdsByName.get(toolName) ??
          `fallback_${toolIndex}`;

        // Accumulate the full arguments string
        if (!accumulatedToolCalls.has(toolIndex)) {
          accumulatedToolCalls.set(toolIndex, {
            id: toolUseId,
            name: toolName,
            arguments: "",
          });
        }
        accumulatedToolCalls.get(toolIndex)!.arguments +=
          event.arguments_delta;

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
        // Use SDK's tool_calls if available, otherwise use our accumulated ones
        const hasToolCalls = message.tool_calls && message.tool_calls.length > 0;
        const finalMsg = hasToolCalls
          ? mapToFinalMessage(message, completion.usage)
          : buildFinalMessage(
            accumulatedText,
            accumulatedToolCalls,
            message.role,
            completion.usage,
          );
        subscriber.next({ type: "message", message: finalMsg });
      });

      stream.on("end", () => {
        subscriber.complete();
      });
    });

    return {
      events: observable,
      finalMessage: async (): Promise<FinalMessage> => {
        const completion = await stream.finalChatCompletion();
        const message = completion.choices[0].message;
        const hasToolCalls = message.tool_calls && message.tool_calls.length > 0;
        return hasToolCalls
          ? mapToFinalMessage(message, completion.usage)
          : buildFinalMessage(
            accumulatedText,
            accumulatedToolCalls,
            message.role,
            completion.usage,
          );
      },
    };
  }
}

/** Build FinalMessage from our manually accumulated streaming data */
function buildFinalMessage(
  text: string,
  toolCalls: Map<number, AccumulatedToolCall>,
  role: string,
  usage?: OpenAI.Completions.CompletionUsage,
): FinalMessage {
  const toolUseBlocks = Array.from(toolCalls.values()).map((tc) => ({
    type: "tool_use" as const,
    toolUseId: tc.id,
    name: tc.name,
    input: JSON.parse(tc.arguments || "{}"),
  }));

  return {
    role: role as "assistant",
    content: [
      { type: "text", text },
      ...toolUseBlocks,
    ],
    stop_reason: toolUseBlocks.length > 0 ? "tool_use" : "end_turn",
    timestamp: new Date(),
    usage: usage ? mapUsage(usage) : undefined,
  };
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
