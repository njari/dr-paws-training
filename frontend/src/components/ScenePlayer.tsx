import { useEffect, useMemo, useState } from 'react';
import type { Actor, ActorType, Question, Role } from '../types';
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

interface ScenePlayerProps {
  questionId: string;
  role: Role;
  email: string;
  onFinish: (questionId: string) => void;
  onBack: () => void;
}

export default function ScenePlayer({ questionId, role, email, onFinish, onBack }: ScenePlayerProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchQuestion(questionId);
        if (!cancelled) setQuestion(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load scenario');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [questionId]);

  const actorMap = useMemo(() => {
    if (!question) return new Map<string, Actor>();
    return new Map(question.actors.map((a) => [a.id, a]));
  }, [question]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-sm text-text-secondary text-center py-12">Loading scenario…</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error" role="alert">
          {error || 'Scenario not found'}
        </div>
      </div>
    );
  }

  const scene = question.scene;
  const event = scene[currentIndex];
  const actor = actorMap.get(event.actor);
  const actorName = actor?.name ?? 'Unknown';
  const actorType = actor?.type ?? 'client';
  const emoji = ACTOR_EMOJI[actorType] ?? '👤';
  const isUserActor = actorType === role;
  const isLast = currentIndex === scene.length - 1;

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
        Back to Scenario
      </button>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
          <span>Event {currentIndex + 1} of {scene.length}</span>
          <span>{Math.round(((currentIndex + 1) / scene.length) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / scene.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Event card */}
      <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-border p-6">
        {/* Actor header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl" aria-hidden="true">{emoji}</span>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {actorName}
              {isUserActor && (
                <span className="ml-1.5 text-xs font-medium text-primary">
                  — You ({email})
                </span>
              )}
            </p>
            <p className="text-xs text-text-secondary capitalize">
              {event.action.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {/* Lines */}
        <div
          className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
            isUserActor
              ? 'bg-primary/5 border border-primary/20 text-text-primary'
              : 'bg-background text-text-primary'
          }`}
        >
          {event.lines}
        </div>

        {isUserActor && (
          <p className="mt-3 text-xs text-primary font-medium">
            ℹ️ This is your turn — perform this action on your portal, then continue.
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex gap-3">
        {currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex((i) => i - 1)}
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-background cursor-pointer"
          >
            ← Previous
          </button>
        )}

        {isLast ? (
          <button
            onClick={() => onFinish(questionId)}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
          >
            ✓ Finish Scenario
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
