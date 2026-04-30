import { useState } from 'react';
import type { Role } from './types';
import RegistrationForm from './components/RegistrationForm';
import TopNav from './components/TopNav';
import Home from './components/Home';
import QuestionList from './components/QuestionList';
import QuestionDetail from './components/QuestionDetail';
import ScenePlayer from './components/ScenePlayer';

type Page =
  | { name: 'home' }
  | { name: 'questions' }
  | { name: 'question'; questionId: string }
  | { name: 'play'; questionId: string };

interface UserSession {
  email: string;
  role: Role;
  questionsDone: string[];
}

function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [page, setPage] = useState<Page>({ name: 'home' });

  if (!session) {
    return <RegistrationForm onRegistered={(s) => { setSession(s); setPage({ name: 'home' }); }} />;
  }

  function handleFinish(questionId: string) {
    setSession((prev) => {
      if (!prev) return prev;
      const done = prev.questionsDone.includes(questionId)
        ? prev.questionsDone
        : [...prev.questionsDone, questionId];
      return { ...prev, questionsDone: done };
    });
    setPage({ name: 'questions' });
  }

  const navPage = page.name === 'question' || page.name === 'play' ? 'questions' : page.name;

  return (
    <div className="min-h-screen">
      <TopNav
        email={session.email}
        role={session.role}
        onNavigate={(p) => setPage(p === 'home' ? { name: 'home' } : { name: 'questions' })}
        currentPage={navPage}
      />

      {page.name === 'home' && (
        <Home email={session.email} onGoToQuestions={() => setPage({ name: 'questions' })} />
      )}

      {page.name === 'questions' && (
        <QuestionList
          role={session.role}
          questionsDone={session.questionsDone}
          onSelectQuestion={(id) => setPage({ name: 'question', questionId: id })}
        />
      )}

      {page.name === 'question' && (
        <QuestionDetail
          questionId={page.questionId}
          role={session.role}
          email={session.email}
          onBack={() => setPage({ name: 'questions' })}
          onStart={(id) => setPage({ name: 'play', questionId: id })}
        />
      )}

      {page.name === 'play' && (
        <ScenePlayer
          questionId={page.questionId}
          role={session.role}
          email={session.email}
          onFinish={handleFinish}
          onBack={() => setPage({ name: 'question', questionId: page.questionId })}
        />
      )}
    </div>
  );
}

export default App;
