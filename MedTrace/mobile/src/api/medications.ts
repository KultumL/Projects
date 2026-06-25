import { API_BASE_URL, DEMO_MODE } from './config';
import { DEMO_MEDICATIONS } from './demo';

export interface Medication {
  id: string | number;
  name: string;
  dosage: string;
  frequency: string;
  scheduledTimes?: string[];   // e.g. ["08:00", "21:00"] — backend auto-enriched via OpenFDA
  description?: string;        // backend auto-enriched via OpenFDA
}

export interface CreateMedicationPayload {
  name: string;
  dosage: string;
  frequency: string;
}

export interface Dose {
  id: string | number;
  medicationId: string | number;
  takenAt: string;             // ISO datetime
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

// GET /api/medications
export async function getMedications(token: string): Promise<Medication[]> {
  if (DEMO_MODE) return Promise.resolve(DEMO_MEDICATIONS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/medications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => ({}));
    throw new Error(extractError(data, 'Failed to load medications.'));
  }
  return response.json() as Promise<Medication[]>;
}

// POST /api/medications — backend enriches name/description via OpenFDA
export async function createMedication(
  token: string,
  payload: CreateMedicationPayload,
): Promise<Medication> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/medications`, {
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
    throw new Error(extractError(data, 'Failed to add medication. Please try again.'));
  }
  return data as Medication;
}

// POST /api/doses — log that a dose was taken now
export async function logDose(
  token: string,
  medicationId: string | number,
): Promise<Dose> {
  const takenAt = new Date().toISOString();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/doses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ medicationId, takenAt }),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractError(data, 'Failed to log dose. Please try again.'));
  }
  return data as Dose;
}
