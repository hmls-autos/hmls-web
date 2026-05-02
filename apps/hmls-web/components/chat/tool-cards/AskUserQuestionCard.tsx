"use client";

interface AskUserQuestionInput {
  question: string;
  header: string;
  options: Array<{ label: string; description?: string }>;
}

/** Interactive card that mirrors the `ask_user_question` tool. The agent's
 * tool call args drive the UI; tapping an option submits its label as the
 * next user message — bypassing the textbox entirely.
 *
 * Two states:
 *  - "active" — most recent ask_user_question with no follow-up user message
 *    yet. Buttons are clickable.
 *  - "answered" — a previous turn where the user already responded. Buttons
 *    are disabled and the chosen option is highlighted. */
export function AskUserQuestionCard({
  input,
  isAnswered,
  answer,
  onAnswer,
}: {
  input: AskUserQuestionInput;
  isAnswered: boolean;
  answer?: string;
  onAnswer: (label: string) => void;
}) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
      {input.header && (
        <div className="text-xs font-semibold uppercase tracking-wide text-primary/80">
          {input.header}
        </div>
      )}
      <p className="mt-1 text-sm font-medium text-foreground">
        {input.question}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {input.options.map((opt) => {
          const isChosen = isAnswered && answer === opt.label;
          return (
            <button
              key={opt.label}
              type="button"
              disabled={isAnswered}
              onClick={() => onAnswer(opt.label)}
              className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                isChosen
                  ? "border-primary bg-primary text-primary-foreground"
                  : isAnswered
                    ? "border-border bg-muted/40 text-muted-foreground"
                    : "border-border bg-background hover:border-primary/40 hover:bg-primary/10 text-foreground"
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.description && (
                <span
                  className={`text-xs ${
                    isChosen
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {opt.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
