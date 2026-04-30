export type Role =
  | 'Admin'
  | 'Receptionist'
  | 'Doctor'
  | 'Lab Technician'
  | 'Practice Manager'
  | 'Groomer';

export interface RegistrationPayload {
  email: string;
  petName: string;
  role: Role;
}

export interface RoleOption {
  value: Role;
  label: string;
}

export type ExternalActorType = 'client' | 'client_pet1' | 'client_pet2';
export type ActorType = Role | ExternalActorType;

export interface RolesConfig {
  internal_roles: Role[];
  external_roles: ExternalActorType[];
}

export interface Actor {
  id: string;
  name: string;
  type: ActorType;
}

export type SceneAction =
  | 'walk_in'
  | 'greet'
  | 'speak'
  | 'ask'
  | 'respond'
  | 'examine'
  | 'check_in'
  | 'hand_over'
  | 'escort'
  | 'wait'
  | 'exit'
  | 'call_out';

export interface SceneEvent {
  id: number;
  actor: string;           // references Actor.id
  action: SceneAction;
  lines: string;
  requires_response: boolean;  // true = user playing this actor must act; false = auto-plays
}

export interface Question {
  question_id: string;
  roles: Role[];
  actors: Actor[];
  scene: SceneEvent[];
}

// ── Session (play-through) ──────────────────────────────────────────────────

export interface EventResponse {
  event_id: number;
  action: SceneAction;
  lines: string;
  is_correct: boolean;
  correct_action: SceneAction;
}

export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface QuestionSession {
  session_id: string;
  employee_email: string;
  question_id: string;
  actor_id: string;          // which Actor.id the user is playing
  status: SessionStatus;
  responses: EventResponse[];
  score?: number;            // 0-100, set on completion
  started_at: string;
  completed_at?: string;
}
