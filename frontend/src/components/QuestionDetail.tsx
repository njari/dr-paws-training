import { useEffect, useState } from 'react';
import type { ActorType, Question, Role } from '../types';
import { fetchQuestion } from '../data/api';

const ACTOR_EMOJI: Record<ActorType, string> = {
  Admin: '🛡️',
  Receptionist: '💁',
  Doctor: '🩺',
  'Lab Technician': '🔬',
  'Practice Manager': '📋',
  Groomer: '✂️',
  client: '🧑',
  client_pet1: '🐶',
  client_pet2: '🐱',
};

interface QuestionDetailProps {
  questionId: string;
  role: Role;
  email: string;
  onBack: () => void;
  onStart: (questionId: string) => void;
}

export default function QuestionDetail({ questionId, role, email, onBack, onStart }: QuestionDetailProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchQuestion(questionId);
        if (!cancelled) setQuestion(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load question');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [questionId]);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {/* Back link */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6 cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Scenarios
      </button>

      {loading && (
        <p className="text-sm text-text-secondary text-center py-12">Loading scenario…</p>
      )}

      {error && (
        <div className="rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && question && (
        <>
          <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-border p-6">
            <h2 className="text-lg font-bold text-text-primary mb-1">
              Scenario: {question.question_id.toUpperCase()}
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              {question.scene.length} events &middot; {question.actors.length} participants
            </p>

            {/* Start button */}
            <button
              onClick={() => onStart(question.question_id)}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
            >
              ▶ Start Scenario
            </button>
          </div>

          {/* Actors */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Cast</h3>
            <ul className="space-y-2">
              {question.actors.map((actor) => {
                const isUser = actor.type === role;
                const emoji = ACTOR_EMOJI[actor.type] ?? '👤';

                return (
                  <li
                    key={actor.id}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                      isUser
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <span className="text-lg" aria-hidden="true">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-text-primary">{actor.name}</span>
                      <span className="ml-1.5 text-text-secondary">— {actor.type}</span>
                    </div>
                    {isUser && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        You ({email})
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
