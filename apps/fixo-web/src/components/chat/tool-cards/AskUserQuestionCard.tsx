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
 * Renders in two states:
 *  - "active" — the most recent ask_user_question with no follow-up user
 *    message yet. Buttons are clickable.
 *  - "answered" — a previous turn where the user already responded. Buttons
 *    are disabled and the chosen option is dimly highlighted.
 */
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
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
      {input.header && (
        <div className="text-[11px] font-semibold uppercase tracking-wider text-accent/80">
          {input.header}
        </div>
      )}
      <p className="mt-1 text-sm font-medium text-foreground">
        {input.question}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {input.options.map((opt, i) => {
          const isChosen = isAnswered && answer === opt.label;
          // The agent occasionally emits an option with an empty label (when
          // it asks a yes/no with redundant phrasing). React keyed on opt.label
          // then sees two children with key="" → warning + reconciliation
          // bug. Index-based key is stable here because the option list is
          // built fresh per question turn and never reordered.
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: option list is fresh per turn, not reordered
              key={i}
              type="button"
              disabled={isAnswered}
              onClick={() => onAnswer(opt.label)}
              className={`group flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                isChosen
                  ? "border-accent bg-accent text-accent-foreground"
                  : isAnswered
                    ? "border-border bg-muted/40 text-muted-foreground"
                    : "border-border bg-card text-foreground hover:border-accent/40 hover:bg-accent/5"
              }`}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.description && (
                <span
                  className={`text-xs ${
                    isChosen
                      ? "text-accent-foreground/80"
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
