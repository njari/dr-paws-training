import type { Role, SceneAction } from '../types';

export interface SceneActionMeta {
  value: SceneAction;
  label: string;
  applicableTo: Role[] | 'all';
}

export const SCENE_ACTIONS: SceneActionMeta[] = [
  { value: 'walk_in',   label: 'Walk In',   applicableTo: 'all' },
  { value: 'greet',     label: 'Greet',     applicableTo: ['Receptionist', 'Doctor', 'Groomer', 'Practice Manager'] },
  { value: 'speak',     label: 'Speak',     applicableTo: 'all' },
  { value: 'ask',       label: 'Ask',       applicableTo: 'all' },
  { value: 'respond',   label: 'Respond',   applicableTo: 'all' },
  { value: 'examine',   label: 'Examine',   applicableTo: ['Doctor', 'Lab Technician'] },
  { value: 'check_in',  label: 'Check In',  applicableTo: ['Receptionist', 'Admin'] },
  { value: 'hand_over', label: 'Hand Over', applicableTo: ['Receptionist', 'Doctor', 'Lab Technician', 'Groomer'] },
  { value: 'escort',    label: 'Escort',    applicableTo: ['Receptionist', 'Doctor', 'Groomer'] },
  { value: 'wait',      label: 'Wait',      applicableTo: 'all' },
  { value: 'exit',      label: 'Exit',      applicableTo: 'all' },
  { value: 'call_out',  label: 'Call Out',  applicableTo: ['Receptionist', 'Admin', 'Practice Manager'] },
];
