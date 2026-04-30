import type { Role } from '../types';

interface TopNavProps {
  email: string;
  role: Role;
  onNavigate: (page: 'home' | 'questions') => void;
  currentPage: string;
}

export default function TopNav({ email, role, onNavigate, currentPage }: TopNavProps) {
  return (
    <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur border-b border-border">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        {/* Brand */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-primary transition-colors cursor-pointer"
        >
          <span role="img" aria-label="paw">🐾</span>
          Dr. Paws Training
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('questions')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              currentPage === 'questions'
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-border/50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Scenarios
          </button>

          {/* User pill */}
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs text-text-secondary">
            <span className="font-medium text-text-primary">{email.split('@')[0]}</span>
            &middot;
            <span className="text-primary">{role}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
