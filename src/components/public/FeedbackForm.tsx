import { useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Star } from "lucide-react";
import type { Board, FeedbackAnswerValue, FeedbackContact, FeedbackField, Submission } from "../../types";
import { Button, Input, Select } from "../Shared";
import { SatisfactionRating } from "./SatisfactionRating";
import type { SatisfactionScore } from "./SatisfactionRating";
import { submitFeedbackResponse } from "../../lib/firestore";
import {
  MAX_FEEDBACK_LONG_TEXT_LENGTH,
  MAX_FEEDBACK_SHORT_TEXT_LENGTH,
  buildFeedbackAnswers,
  getFeedbackConfig,
  sortFeedbackFields,
  validateFeedbackAnswers,
} from "../../lib/feedback";
import type { FeedbackAnswers } from "../../lib/feedback";

interface FeedbackFormProps {
  board: Board;
  submission: Submission;
}

function FieldLabel({ field, children }: { field: FeedbackField; children?: ReactNode }) {
  return (
    <p id={`feedback-label-${field.id}`} className="block text-sm font-medium text-[var(--c-t1c1917)] mb-1.5">
      {field.label}
      {field.required && <span className="text-[var(--c-tc0392b)]"> *</span>}
      {children}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-[var(--c-tc0392b)] mt-1.5">{message}</p>;
}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function ContactToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-[var(--c-t1c1917)]">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]/30 ${
          checked ? "bg-[var(--c-sc0694a)]" : "bg-[var(--c-bd6cabf)]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
    </label>
  );
}

export function FeedbackForm({ board, submission }: FeedbackFormProps) {
  const fields = sortFeedbackFields(getFeedbackConfig(board).fields);
  const [answers, setAnswers] = useState<FeedbackAnswers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shareName, setShareName] = useState(false);
  const [shareEmail, setShareEmail] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const setAnswer = (fieldId: string, value: FeedbackAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateFeedbackAnswers(fields, answers);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const contactErrors: Record<string, string> = {};
    const trimmedName = shareName ? name.trim() : "";
    const trimmedEmail = shareEmail ? email.trim() : "";
    if (shareName && !trimmedName) contactErrors.contactName = "Enter your name or turn this off.";
    if (shareEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      contactErrors.contactEmail = "Enter a valid email or turn this off.";
    }
    setErrors({ ...validationErrors, ...contactErrors });
    if (Object.keys(contactErrors).length > 0) return;

    const contact: FeedbackContact = {};
    if (trimmedName) contact.name = trimmedName;
    if (trimmedEmail) contact.email = trimmedEmail;

    setSubmitting(true);
    try {
      await submitFeedbackResponse({
        trackingCode: submission.trackingCode,
        boardId: submission.boardId,
        submissionId: submission.id,
        responses: buildFeedbackAnswers(fields, answers),
        contact,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to send your feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[var(--c-seaf9f2)] border border-[var(--c-ba8dfc4)] rounded-2xl shadow-sm px-6 py-5">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 size={15} className="text-[var(--c-t1d8a57)]" />
          <h2 className="text-sm font-bold text-[var(--c-t1d6b45)]">Thank you for your feedback</h2>
        </div>
        <p className="text-sm text-[var(--c-t1d6b45)] leading-relaxed">
          Your response has been sent to the team and helps them improve.
        </p>
      </div>
    );
  }

  const renderInput = (field: FeedbackField) => {
    const value = answers[field.id];
    const error = errors[field.id];

    switch (field.type) {
      case "rating":
        return (
          <SatisfactionRating
            value={typeof value === "number" ? (value as SatisfactionScore) : null}
            onChange={(score) => setAnswer(field.id, score)}
            error={error}
          />
        );
      case "text":
        return (
          <Input
            aria-labelledby={`feedback-label-${field.id}`}
            value={typeof value === "string" ? value : ""}
            maxLength={MAX_FEEDBACK_SHORT_TEXT_LENGTH}
            onChange={(e) => setAnswer(field.id, e.target.value)}
            error={error}
          />
        );
      case "textarea":
        return (
          <>
            <textarea
              aria-labelledby={`feedback-label-${field.id}`}
              value={typeof value === "string" ? value : ""}
              maxLength={MAX_FEEDBACK_LONG_TEXT_LENGTH}
              onChange={(e) => setAnswer(field.id, e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-[var(--c-sffffff)] text-[var(--c-t1c1917)] resize-none focus:outline-none focus:ring-2 ${
                error
                  ? "border-[var(--c-bc0392b)] focus:ring-[var(--c-bc0392b)]/30"
                  : "border-[var(--c-bd6cabf)] focus:ring-[var(--c-bc0694a)]/30 focus:border-[var(--c-bc0694a)]"
              }`}
            />
            <FieldError message={error} />
          </>
        );
      case "dropdown":
        return (
          <Select
            aria-labelledby={`feedback-label-${field.id}`}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(field.id, e.target.value)}
            options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
            placeholder="Select an option"
            error={error}
          />
        );
      case "yesno":
        return (
          <>
            <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby={`feedback-label-${field.id}`}>
              {([true, false] as const).map((option) => {
                const selected = value === option;
                return (
                  <button
                    key={String(option)}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAnswer(field.id, option)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]/30 ${
                      selected
                        ? "border-[var(--c-bc0694a)] bg-[var(--c-sf5e6df)] text-[var(--c-tc0694a)]"
                        : "border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] text-[var(--c-t78716c)] hover:border-[var(--c-bc0694a)]/50"
                    }`}
                  >
                    {option ? "Yes" : "No"}
                  </button>
                );
              })}
            </div>
            <FieldError message={error} />
          </>
        );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-[var(--c-sffffff)] rounded-2xl border border-[var(--c-be9e0d9)] shadow-sm px-6 py-5"
    >
      <div className="flex items-center gap-2 mb-1">
        <Star size={14} className="text-[var(--c-tc0694a)]" />
        <h2 className="text-sm font-semibold text-[var(--c-t1c1917)]">How did we do?</h2>
      </div>
      <p className="text-xs text-[var(--c-t78716c)] mb-5">
        Your request is {submission.status === "closed" ? "closed" : "resolved"}. Tell us how it went — this is optional
        and can only be sent once.
      </p>

      <div className="space-y-5">
        {fields.map((field) => (
          <div key={field.id}>
            <FieldLabel field={field} />
            {renderInput(field)}
          </div>
        ))}
      </div>

      <fieldset className="mt-5 space-y-3 rounded-xl border border-[var(--c-be9e0d9)] bg-[var(--c-sf5f0ec)] p-4">
        <legend className="px-1 text-xs font-semibold text-[var(--c-t78716c)]">
          Share your details (optional)
        </legend>
        <p className="text-xs text-[var(--c-t78716c)]">
          Leave both off to stay anonymous. Turn on only what you're comfortable sharing.
        </p>

        <div>
          <ContactToggle label="Share my name" checked={shareName} onChange={setShareName} />
          {shareName && (
            <Input
              aria-label="Your name"
              autoComplete="name"
              maxLength={100}
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("contactName");
              }}
              error={errors.contactName}
              className="mt-2"
            />
          )}
        </div>

        <div>
          <ContactToggle label="Share my email" checked={shareEmail} onChange={setShareEmail} />
          {shareEmail && (
            <Input
              aria-label="Your email"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("contactEmail");
              }}
              error={errors.contactEmail}
              className="mt-2"
            />
          )}
        </div>
      </fieldset>

      {submitError && (
        <div className="mt-5 p-3 bg-[var(--c-sfdecea)] border border-[var(--c-bfadbd8)] rounded-xl">
          <p className="text-sm text-[var(--c-tc0392b)]">{submitError}</p>
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" isLoading={submitting} className="w-full mt-5">
        Send feedback
      </Button>
    </form>
  );
}
