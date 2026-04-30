import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Role } from '../types';
import { ROLES } from '../data/roles';
import { registerUser } from '../data/api';

interface RegistrationFormProps {
  onRegistered: (session: { email: string; role: Role; questionsDone: string[] }) => void;
}

export default function RegistrationForm({ onRegistered }: RegistrationFormProps) {
  const [email, setEmail] = useState('');
  const [petName, setPetName] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !petName || !role) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const result = await registerUser({ email, petName, role });
      onRegistered({
        email,
        role,
        questionsDone: result.data.questions_done,
      });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  const isDisabled = status === 'loading';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl mb-3 block" role="img" aria-label="paw">
            🐾
          </span>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Dr. Paws Training
          </h1>
          <p className="mt-2 text-text-secondary text-sm">
            Join our community of pet lovers and start your training journey
            today.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-border p-8">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Register for Training
          </h2>

          {status === 'success' && (
            <div
              className="mb-6 rounded-lg bg-primary/10 border border-primary/30 px-4 py-3 text-sm text-primary-dark"
              role="alert"
            >
              Registration successful! We&apos;ll be in touch soon.
            </div>
          )}

          {status === 'error' && errorMsg && (
            <div
              className="mb-6 rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error"
              role="alert"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={isDisabled}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 outline-none transition-shadow focus:ring-2 focus:ring-focus-ring focus:border-primary disabled:opacity-50"
              />
            </div>

            {/* Pet Name */}
            <div>
              <label
                htmlFor="petName"
                className="block text-sm font-medium text-text-primary mb-1.5"
              >
                Pet Name
              </label>
              <input
                id="petName"
                type="text"
                required
                disabled={isDisabled}
                placeholder="What's your pet called?"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 outline-none transition-shadow focus:ring-2 focus:ring-focus-ring focus:border-primary disabled:opacity-50"
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-text-primary mb-1.5"
              >
                Your Role
              </label>
              <select
                id="role"
                required
                disabled={isDisabled}
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-shadow focus:ring-2 focus:ring-focus-ring focus:border-primary disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.75rem_center] bg-no-repeat pr-10"
              >
                <option value="" disabled>
                  Select your role
                </option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isDisabled}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Registering…' : 'Register Now'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already registered?{' '}
          <a
            href="#"
            className="font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
