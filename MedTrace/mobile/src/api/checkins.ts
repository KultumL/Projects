import { API_BASE_URL, DEMO_MODE } from './config';
import { DEMO_CHECKINS } from './demo';

export interface CheckInPayload {
  mood?: number;           // 1–10
  energy?: number;         // 1–10
  pain?: number;           // 1–10
  sleepHours?: number;
  medicationsTaken?: boolean;
  notes?: string;
}

// Response shape from the backend (field names differ from the POST payload).
export interface CheckIn {
  id: string | number;
  checkInDate: string;          // "YYYY-MM-DD" — backend returns "checkInDate"
  mood?: number;
  energy?: number;
  painLevel?: number;           // backend returns "painLevel", not "pain"
  sleepHours?: number;
  medicationsTaken?: boolean;
  journalEntry?: string | null;  // backend returns "journalEntry", not "notes"
  createdAt: string;            // ISO datetime
  enteredById?: string | number | null;
  enteredByName?: string | null;
}

function extractError(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' && data !== null &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'string'
  ) {
    return (data as { error: string }).error;
  }
  return fallback;
}

// GET /api/checkins/today — null when no check-in exists yet today
export async function getTodayCheckIn(token: string): Promise<CheckIn | null> {
  if (DEMO_MODE) return Promise.resolve(DEMO_CHECKINS[0]);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/checkins/today`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }

  if (response.status === 404) return null;
  if (!response.ok) return null; // treat other server errors as "none yet" so the form shows
  return response.json() as Promise<CheckIn>;
}

// POST /api/checkins
export async function createCheckIn(
  token: string,
  payload: CheckInPayload,
): Promise<CheckIn> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }

  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractError(data, 'Failed to save your check-in. Please try again.'));
  }
  return data as CheckIn;
}

// GET /api/checkins?patientId= — all check-ins for a linked patient (reverse chronological)
export async function getPatientCheckIns(
  token: string,
  patientId: string | number,
): Promise<CheckIn[]> {
  if (DEMO_MODE) { return Promise.resolve((await import('./demo')).DEMO_PATIENT_CHECKINS); }
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/checkins?patientId=${patientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => ({}));
    throw new Error(extractError(data, 'Failed to load check-ins.'));
  }
  return response.json() as Promise<CheckIn[]>;
}
