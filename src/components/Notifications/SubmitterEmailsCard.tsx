import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import type { SubmitterPreferences } from '@/types';

interface SubmitterEmailsCardProps {
  preferences: SubmitterPreferences;
  onSave: (preferences: SubmitterPreferences) => Promise<void>;
}

const OPTIONS: Array<{
  key: keyof SubmitterPreferences;
  title: string;
  description: string;
}> = [
  {
    key: 'ack',
    title: 'Send a confirmation on submission',
    description:
      'The submitter gets a receipt with their tracking code and a link to follow progress.',
  },
  {
    key: 'updates',
    title: 'Send an update when you reply or resolve',
    description:
      'A follow-up email goes out when a public reply is added or the submission is resolved.',
  },
];

/** Emails sent to the person who submitted the feedback (never for anonymous submissions). */
export function SubmitterEmailsCard({ preferences, onSave }: SubmitterEmailsCardProps) {
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const toggle = async (key: keyof SubmitterPreferences) => {
    try {
      setSavingKey(key);
      await onSave({ ...preferences, [key]: !preferences[key] });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[#e0d6cf] bg-white p-6">
      <div className="mb-1 flex items-center gap-2">
        <Send size={18} className="text-[#c0694a]" />
        <h2 className="text-base font-semibold text-[#1c1917]">Emails to the submitter</h2>
      </div>
      <p className="mb-5 text-sm leading-6 text-[#78716c]">
        Sent from <strong>hello@feedsolve.com</strong>, and only when the submitter left an email
        address. Anonymous submissions are never emailed.
      </p>

      <ul className="space-y-3">
        {OPTIONS.map(option => {
          const active = preferences[option.key];
          return (
            <li
              key={option.key}
              className="flex items-start justify-between gap-4 rounded-xl border border-[#e0d6cf] p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1c1917]">{option.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-[#78716c]">{option.description}</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-label={option.title}
                onClick={() => toggle(option.key)}
                disabled={savingKey === option.key}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
                  active ? 'bg-[#c0694a]' : 'bg-[#d6cabf]'
                }`}
              >
                {savingKey === option.key ? (
                  <Loader2 size={13} className="mx-auto animate-spin text-white" />
                ) : (
                  <span
                    className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white transition-transform ${
                      active ? 'translate-x-[22px]' : 'translate-x-1'
                    }`}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
