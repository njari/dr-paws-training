import type {
  EventResponse,
  Question,
  QuestionSession,
  RegistrationPayload,
  Role,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const USE_MOCK = !API_URL;

// ── Registration ───────────────────────────────────────────────────────────────

interface RegisterResponse {
  message: string;
  data: RegistrationPayload & { status: string; questions_done: string[] };
}

async function mockRegister(payload: RegistrationPayload): Promise<RegisterResponse> {
  await delay(800);
  return {
    message: 'Registration successful',
    data: { ...payload, status: 'inprogress', questions_done: [] },
  };
}

export async function registerUser(payload: RegistrationPayload): Promise<RegisterResponse> {
  if (USE_MOCK) return mockRegister(payload);

  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return expectOk(res, 'Registration failed');
}

// ── Questions ──────────────────────────────────────────────────────────────────

// Actors are referenced by id in scene events.
// requires_response=true marks events where the user playing that actor must act.
const MOCK_QUESTIONS: Question[] = [
  {
    question_id: 'q1',
    roles: ['Receptionist', 'Admin'],
    actors: [
      { id: 'a1', name: 'Sarah',       type: 'Receptionist' },
      { id: 'a2', name: 'Mr. Thompson', type: 'client' },
      { id: 'a3', name: 'Buddy',        type: 'client_pet1' },
    ],
    scene: [
      { id: 1, actor: 'a2', action: 'walk_in',  lines: 'Walks into the clinic with Buddy on a leash.', requires_response: false },
      { id: 2, actor: 'a1', action: 'greet',    lines: 'Good morning! Welcome to Dr. Paws. How can I help you today?', requires_response: true },
      { id: 3, actor: 'a2', action: 'respond',  lines: 'Hi, I have a 10 AM appointment for Buddy.', requires_response: false },
      { id: 4, actor: 'a1', action: 'check_in', lines: 'Let me pull that up… Yes, I see it. Buddy is here for his annual checkup.', requires_response: true },
      { id: 5, actor: 'a1', action: 'escort',   lines: 'Please have a seat. The doctor will be with you shortly.', requires_response: true },
    ],
  },
  {
    question_id: 'q2',
    roles: ['Doctor', 'Lab Technician'],
    actors: [
      { id: 'a4', name: 'Dr. Chen',   type: 'Doctor' },
      { id: 'a5', name: 'Lisa',       type: 'Lab Technician' },
      { id: 'a6', name: 'Mrs. Garcia', type: 'client' },
      { id: 'a7', name: 'Mittens',    type: 'client_pet1' },
    ],
    scene: [
      { id: 1, actor: 'a4', action: 'greet',     lines: 'Hello Mrs. Garcia, let us take a look at Mittens today.', requires_response: true },
      { id: 2, actor: 'a4', action: 'examine',   lines: 'Examines Mittens and notices some signs of lethargy.', requires_response: true },
      { id: 3, actor: 'a4', action: 'speak',     lines: 'I would like to run some blood work to rule out anything serious.', requires_response: true },
      { id: 4, actor: 'a4', action: 'hand_over', lines: 'Lisa, could you take Mittens for a blood draw?', requires_response: true },
      { id: 5, actor: 'a5', action: 'respond',   lines: 'Of course, doctor. Come on, Mittens.', requires_response: true },
      { id: 6, actor: 'a5', action: 'escort',    lines: 'Takes Mittens to the lab area.', requires_response: true },
    ],
  },
  {
    question_id: 'q3',
    roles: ['Groomer', 'Receptionist'],
    actors: [
      { id: 'a8',  name: 'Jake',     type: 'Groomer' },
      { id: 'a9',  name: 'Sarah',    type: 'Receptionist' },
      { id: 'a10', name: 'Ms. Patel', type: 'client' },
      { id: 'a11', name: 'Coco',     type: 'client_pet1' },
    ],
    scene: [
      { id: 1, actor: 'a9',  action: 'call_out', lines: 'Jake, your 2 PM grooming appointment is here — Coco.', requires_response: true },
      { id: 2, actor: 'a8',  action: 'greet',    lines: 'Hi Ms. Patel! Hey Coco, ready for a bath?', requires_response: true },
      { id: 3, actor: 'a10', action: 'speak',    lines: 'She needs a full groom and nail trim, please.', requires_response: false },
      { id: 4, actor: 'a8',  action: 'respond',  lines: 'Absolutely, I will take great care of her. Pick-up in about an hour?', requires_response: true },
      { id: 5, actor: 'a8',  action: 'hand_over', lines: 'Takes Coco to the grooming station.', requires_response: true },
    ],
  },
];

async function mockFetchQuestions(role: Role): Promise<Question[]> {
  await delay(600);
  return MOCK_QUESTIONS.filter((q) => q.roles.includes(role));
}

export async function fetchQuestions(role: Role): Promise<Question[]> {
  if (USE_MOCK) return mockFetchQuestions(role);

  const res = await fetch(`${API_URL}/questions?role=${encodeURIComponent(role)}`);
  return expectOk(res, 'Failed to fetch questions');
}

export async function fetchQuestion(questionId: string): Promise<Question> {
  if (USE_MOCK) {
    await delay(300);
    const q = MOCK_QUESTIONS.find((q) => q.question_id === questionId);
    if (!q) throw new Error('Question not found');
    return q;
  }

  const res = await fetch(`${API_URL}/questions/${questionId}`);
  return expectOk(res, 'Failed to fetch question');
}

// ── Sessions ───────────────────────────────────────────────────────────────────

const MOCK_SESSIONS = new Map<string, QuestionSession>();

async function mockStartSession(
  questionId: string,
  actorId: string,
  employeeEmail: string,
): Promise<QuestionSession> {
  await delay(400);
  const session: QuestionSession = {
    session_id: `mock-session-${Date.now()}`,
    employee_email: employeeEmail,
    question_id: questionId,
    actor_id: actorId,
    status: 'active',
    responses: [],
    started_at: new Date().toISOString(),
  };
  MOCK_SESSIONS.set(session.session_id, session);
  return session;
}

async function mockRespondToEvent(
  sessionId: string,
  eventId: number,
  action: string,
  lines: string,
): Promise<RespondResult> {
  await delay(300);
  const session = MOCK_SESSIONS.get(sessionId);
  if (!session) throw new Error('Session not found');

  const question = MOCK_QUESTIONS.find((q) => q.question_id === session.question_id);
  if (!question) throw new Error('Question not found');

  const event = question.scene.find((e) => e.id === eventId);
  if (!event) throw new Error('Event not found');

  const is_correct = action === event.action;
  const response: EventResponse = {
    event_id: eventId,
    action: action as EventResponse['action'],
    lines,
    is_correct,
    correct_action: event.action,
  };

  session.responses.push(response);

  const interactive = question.scene.filter(
    (e) => e.actor === session.actor_id && e.requires_response,
  );
  const respondedIds = new Set(session.responses.map((r) => r.event_id));
  const allDone = interactive.every((e) => respondedIds.has(e.id));

  if (allDone) {
    const correct = session.responses.filter((r) => r.is_correct).length;
    session.status = 'completed';
    session.score = interactive.length ? Math.round((correct / interactive.length) * 100) : 100;
    session.completed_at = new Date().toISOString();
  }

  return {
    event_id: eventId,
    is_correct,
    correct_action: event.action,
    correct_lines: event.lines,
    session_status: session.status,
    ...(session.score !== undefined ? { score: session.score } : {}),
  };
}

export interface RespondResult {
  event_id: number;
  is_correct: boolean;
  correct_action: string;
  correct_lines: string;
  session_status: QuestionSession['status'];
  score?: number;
}

export async function startSession(
  questionId: string,
  actorId: string,
  employeeEmail: string,
): Promise<QuestionSession> {
  if (USE_MOCK) return mockStartSession(questionId, actorId, employeeEmail);

  const res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_id: questionId, actor_id: actorId, employee_email: employeeEmail }),
  });
  return expectOk(res, 'Failed to start session');
}

export async function getSession(sessionId: string): Promise<QuestionSession> {
  if (USE_MOCK) {
    await delay(200);
    const session = MOCK_SESSIONS.get(sessionId);
    if (!session) throw new Error('Session not found');
    return session;
  }

  const res = await fetch(`${API_URL}/sessions/${sessionId}`);
  return expectOk(res, 'Failed to fetch session');
}

export async function respondToEvent(
  sessionId: string,
  eventId: number,
  action: string,
  lines: string,
): Promise<RespondResult> {
  if (USE_MOCK) return mockRespondToEvent(sessionId, eventId, action, lines);

  const res = await fetch(`${API_URL}/sessions/${sessionId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: eventId, action, lines }),
  });
  return expectOk(res, 'Failed to submit response');
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function expectOk<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail ?? fallbackMessage);
  }
  return res.json();
}
