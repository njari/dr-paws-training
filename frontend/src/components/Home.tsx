interface HomeProps {
  email: string;
  onGoToQuestions: () => void;
}

export default function Home({ email, onGoToQuestions }: HomeProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <span className="text-5xl mb-4 block" role="img" aria-label="paw">🐾</span>
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">
        Welcome, {email.split('@')[0]}!
      </h1>
      <p className="mt-2 text-text-secondary text-sm max-w-md">
        Your registration is complete. Start practicing by working through your
        training scenarios.
      </p>
      <button
        onClick={onGoToQuestions}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        View Scenarios
      </button>
    </div>
  );
}
