import { useState } from 'react';
import { ChevronDown, Loader2, Users } from 'lucide-react';
import type { Board, BoardRecipients } from '@/types';
import { EmailChipInput } from './EmailChipInput';

interface BoardRecipientsCardProps {
  boards: Board[];
  boardRecipients: Record<string, BoardRecipients>;
  onSave: (boardId: string, config: BoardRecipients | null) => Promise<void>;
}

/**
 * Per-board overrides: send a board's notifications to a specific inbox, either
 * in addition to the company-wide list or instead of it.
 */
export function BoardRecipientsCard({
  boards,
  boardRecipients,
  onSave,
}: BoardRecipientsCardProps) {
  const [openBoardId, setOpenBoardId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BoardRecipients>({ recipients: [], replaceCompany: false });
  const [savingBoardId, setSavingBoardId] = useState<string | null>(null);

  const openBoard = (board: Board) => {
    if (openBoardId === board.id) {
      setOpenBoardId(null);
      return;
    }
    setOpenBoardId(board.id);
    setDraft(boardRecipients[board.id] ?? { recipients: [], replaceCompany: false });
  };

  const handleSave = async (boardId: string) => {
    try {
      setSavingBoardId(boardId);
      await onSave(boardId, draft.recipients.length ? draft : null);
      setOpenBoardId(null);
    } finally {
      setSavingBoardId(null);
    }
  };

  if (!boards.length) return null;

  return (
    <section className="rounded-2xl border border-[var(--c-be0d6cf)] bg-[var(--c-sffffff)] p-6">
      <div className="mb-1 flex items-center gap-2">
        <Users size={18} className="text-[var(--c-tc0694a)]" />
        <h2 className="text-base font-semibold text-[var(--c-t1c1917)]">Board-specific recipients</h2>
      </div>
      <p className="mb-5 text-sm leading-6 text-[var(--c-t78716c)]">
        Route one board&apos;s notifications to a different inbox — useful when HR, facilities and
        support each watch their own board.
      </p>

      <ul className="divide-y divide-[var(--c-bf2ece6)]">
        {boards.map(board => {
          const configured = boardRecipients[board.id];
          const isOpen = openBoardId === board.id;

          return (
            <li key={board.id} className="py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => openBoard(board)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--c-t1c1917)]">
                    {board.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--c-t78716c)]">
                    {configured?.recipients.length
                      ? `${configured.recipients.length} address${configured.recipients.length === 1 ? '' : 'es'}${configured.replaceCompany ? ' · instead of the default recipients' : ' · in addition to the default recipients'}`
                      : 'Uses the default recipients'}
                  </span>
                </span>
                <ChevronDown
                  size={17}
                  className={`shrink-0 text-[var(--c-t8f8680)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="mt-4 space-y-4 rounded-xl bg-[var(--c-sf5f0ec)] p-4">
                  <EmailChipInput
                    value={draft.recipients}
                    onChange={recipients => setDraft(prev => ({ ...prev, recipients }))}
                    hint="Leave empty to fall back to the default recipients."
                  />

                  <label className="flex items-start gap-2.5 text-sm text-[var(--c-t3c3632)]">
                    <input
                      type="checkbox"
                      checked={draft.replaceCompany ?? false}
                      onChange={event =>
                        setDraft(prev => ({ ...prev, replaceCompany: event.target.checked }))
                      }
                      className="mt-0.5 h-4 w-4 accent-[var(--c-sc0694a)]"
                    />
                    <span>
                      Only notify these addresses for this board
                      <span className="mt-0.5 block text-xs text-[var(--c-t78716c)]">
                        The roles and addresses above are skipped for {board.name}.
                      </span>
                    </span>
                  </label>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenBoardId(null)}
                      className="rounded-xl border border-[var(--c-bd6cabf)] px-3.5 py-2 text-sm font-semibold text-[var(--c-t3c3632)] transition-colors hover:bg-[var(--c-sffffff)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(board.id)}
                      disabled={savingBoardId === board.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--c-sc0694a)] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--c-sa85a3e)] disabled:opacity-50"
                    >
                      {savingBoardId === board.id && <Loader2 size={15} className="animate-spin" />}
                      Save
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
