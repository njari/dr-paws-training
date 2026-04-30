import { useEffect, useState } from 'react';
import type { Question, Role } from '../types';
import { fetchQuestions } from '../data/api';

interface QuestionListProps {
  role: Role;
  questionsDone: string[];
  onSelectQuestion: (questionId: string) => void;
}

export default function QuestionList({ role, questionsDone, onSelectQuestion }: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchQuestions(role);
        if (!cancelled) setQuestions(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [role]);

  const doneSet = new Set(questionsDone);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary tracking-tight">
          Training Scenarios
        </h2>
        <p className="mt-1 text-text-secondary text-sm">
          Complete each scenario to finish your training.
        </p>
      </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-border p-6">
          {loading && (
            <p className="text-sm text-text-secondary text-center py-8">Loading questions…</p>
          )}

          {error && (
            <div
              className="rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {!loading && !error && questions.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-8">
              No scenarios available for your role yet.
            </p>
          )}

          {!loading && !error && questions.length > 0 && (
            <ul className="divide-y divide-border" role="list">
              {questions.map((q, idx) => {
                const isDone = doneSet.has(q.question_id);
                const actorNames = q.actors.map((a) => a.name).join(', ');

                return (
                  <li
                    key={q.question_id}
                    className="flex items-start gap-3 py-4 first:pt-0 last:pb-0 cursor-pointer hover:bg-background/60 -mx-2 px-2 rounded-lg transition-colors"
                    onClick={() => onSelectQuestion(q.question_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectQuestion(q.question_id); }}
                  >
                    {/* Checkbox */}
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        isDone
                          ? 'bg-primary border-primary text-white'
                          : 'border-border bg-surface'
                      }`}
                      aria-hidden="true"
                    >
                      {isDone && (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${isDone ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                        Scenario {idx + 1}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5 truncate">
                        {actorNames} &middot; {q.scene.length} events
                      </p>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        isDone
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent/10 text-accent-hover'
                      }`}
                    >
                      {isDone ? 'Done' : 'Pending'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      {/* Progress summary */}
      {!loading && questions.length > 0 && (
        <p className="text-center text-sm text-text-secondary mt-4">
          {questionsDone.length} of {questions.length} completed
        </p>
      )}
    </div>
  );
}
