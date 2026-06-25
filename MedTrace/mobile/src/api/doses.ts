import { API_BASE_URL, DEMO_MODE } from './config';
import { DEMO_DOSES } from './demo';

// Status values are the backend enum literals — kept uppercase throughout
// so the type is always the canonical server representation.
export type DoseStatus = 'TAKEN' | 'UPCOMING' | 'OVERDUE' | 'MISSED';

export interface DoseStatusEntry {
  medicationId: string | number;
  scheduleId: string | number;
  medicationName: string;
  dosage?: string;           // present when backend includes it
  scheduledTime: string;     // e.g. "08:00" or "8:00 AM" — display as-is
  status: DoseStatus;
}

export interface LogDosePayload {
  medicationId: string | number;
  scheduleId: string | number;
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

// GET /api/doses/status — today's scheduled doses with TAKEN / MISSED / UPCOMING
export async function getTodayDoseStatus(token: string): Promise<DoseStatusEntry[]> {
  if (DEMO_MODE) return Promise.resolve(DEMO_DOSES);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/doses/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => ({}));
    throw new Error(extractError(data, 'Failed to load today\'s dose schedule.'));
  }
  return response.json() as Promise<DoseStatusEntry[]>;
}

// POST /api/doses — mark a specific scheduled dose as taken right now
export async function markDoseTaken(
  token: string,
  payload: LogDosePayload,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/doses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...payload,
        takenAt: new Date().toISOString(),
      }),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => ({}));
    throw new Error(extractError(data, 'Failed to log dose. Please try again.'));
  }
}
