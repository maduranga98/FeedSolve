import { useState } from "react";
import { Button } from "../Shared";

const MAX_COMMENT_LENGTH = 2000;

interface CommentInputProps {
  onSubmit: (body: string) => Promise<void> | void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  initialValue?: string;
  autoFocus?: boolean;
  loading?: boolean;
  compact?: boolean;
}

export function CommentInput({
  onSubmit,
  onCancel,
  placeholder = "Add an internal note...",
  submitLabel = "Post",
  initialValue = "",
  autoFocus = false,
  loading = false,
  compact = false,
}: CommentInputProps) {
  const [body, setBody] = useState(initialValue);
  const [focused, setFocused] = useState(autoFocus);
  const trimmed = body.trim();
  const shouldShowCancel = Boolean(onCancel) && (focused || body.length > 0);
  const showCharCount = body.length > 1500;

  const submit = async () => {
    if (!trimmed || body.length > MAX_COMMENT_LENGTH) return;
    await onSubmit(trimmed);
    if (!initialValue) setBody("");
  };

  return (
    <div className="space-y-2 sticky bottom-0 bg-[var(--c-sf1ebe5)] pt-2 pb-1 sm:static sm:bg-transparent sm:p-0">
      <textarea
        value={body}
        onChange={event => setBody(event.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={event => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        }}
        maxLength={MAX_COMMENT_LENGTH}
        rows={compact ? 2 : 3}
        autoFocus={autoFocus}
        placeholder={placeholder}
        disabled={loading}
        className="w-full resize-none rounded-lg border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] px-3.5 py-3 text-sm text-[var(--c-t1c1917)] placeholder:text-[var(--c-t78716c)] focus:border-[var(--c-bc0694a)] focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]/30 disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="min-h-5 text-xs">
          {showCharCount && (
            <span className={body.length >= MAX_COMMENT_LENGTH ? "text-[var(--c-tc0392b)]" : "text-[var(--c-t78716c)]"}>
              {body.length}/{MAX_COMMENT_LENGTH}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {shouldShowCancel && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setBody(initialValue);
                onCancel?.();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void submit()}
            disabled={!trimmed || body.length > MAX_COMMENT_LENGTH || loading}
            isLoading={loading}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
