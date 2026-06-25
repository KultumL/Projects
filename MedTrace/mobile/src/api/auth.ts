import { API_BASE_URL } from './config';

export type UserRole = 'PATIENT' | 'CAREGIVER';

export type AgeRange =
  | 'UNDER_18'
  | 'AGE_18_29'
  | 'AGE_30_49'
  | 'AGE_50_64'
  | 'AGE_65_PLUS';

// Full user shape — returned by /api/auth/register, /api/users/me, and stored
// in the auth context.
export interface User {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  ageRange: AgeRange;
}

// Kept for backward compatibility with signup.tsx imports.
export type RegisteredUser = User;

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  ageRange: AgeRange;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractErrorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'string'
  ) {
    return (data as { error: string }).error;
  }
  return fallback;
}

// ── Register ─────────────────────────────────────────────────────────────────

export async function register(payload: RegisterPayload): Promise<User> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, 'Registration failed. Please try again.'));
  }

  return data as User;
}

// ── Login ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login → raw JWT string body on 200
//                      → 403 or 400 { "error": "..." } on failure

export async function loginRequest(email: string, password: string): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Incorrect email or password.');
    }
    const data: unknown = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(data, 'Login failed. Please try again.'));
  }

  return response.text(); // raw JWT string
}

// ── Current user ──────────────────────────────────────────────────────────────
// GET /api/users/me → user JSON
// If this call fails due to CORS on /api/users/me, that's a backend config
// issue — the endpoint needs the same CORS origin allowlist as /api/auth.

export async function fetchCurrentUser(token: string): Promise<User> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }

  if (!response.ok) {
    throw new Error('Session expired. Please log in again.');
  }

  const data: unknown = await response.json().catch(() => ({}));
  return data as User;
}
