import { API_BASE_URL, DEMO_MODE } from './config';
import { Medication } from './medications';
import { DoseStatusEntry, LogDosePayload } from './doses';
import { CheckIn, CheckInPayload } from './checkins';
import { DEMO_MEDICATIONS, DEMO_DOSES, DEMO_PATIENT_CHECKINS } from './demo';

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

// GET /api/medications?patientId=
export async function getPatientMedications(
  token: string,
  patientId: string | number,
): Promise<Medication[]> {
  if (DEMO_MODE) return Promise.resolve(DEMO_MEDICATIONS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/medications?patientId=${patientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => ({}));
    if (response.status === 403) throw new Error('You do not have permission to view this patient\'s data.');
    throw new Error(extractError(data, 'Failed to load medications.'));
  }
  return response.json() as Promise<Medication[]>;
}

// GET /api/doses/status?patientId=
export async function getPatientDoseStatus(
  token: string,
  patientId: string | number,
): Promise<DoseStatusEntry[]> {
  if (DEMO_MODE) return Promise.resolve(DEMO_DOSES);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/doses/status?patientId=${patientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => ({}));
    if (response.status === 403) throw new Error('You do not have permission to view this patient\'s data.');
    throw new Error(extractError(data, 'Failed to load dose schedule.'));
  }
  return response.json() as Promise<DoseStatusEntry[]>;
}

// POST /api/doses?patientId= — mark a dose as taken on the patient's behalf
export async function markDoseForPatient(
  token: string,
  patientId: string | number,
  payload: LogDosePayload,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/doses?patientId=${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...payload, takenAt: new Date().toISOString() }),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => ({}));
    if (response.status === 403) throw new Error('You do not have permission to log for this patient.');
    throw new Error(extractError(data, 'Failed to log dose.'));
  }
}

// POST /api/checkins?patientId= — record a check-in on the patient's behalf
export async function createCheckInForPatient(
  token: string,
  patientId: string | number,
  payload: CheckInPayload,
): Promise<CheckIn> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/checkins?patientId=${patientId}`, {
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
    if (response.status === 403) throw new Error('You do not have permission to log for this patient.');
    throw new Error(extractError(data, 'Failed to save check-in.'));
  }
  return data as CheckIn;
}

// GET /api/reports?period=&patientId= — patient PDF report (web only)
export async function downloadPatientReport(
  token: string,
  patientId: string | number,
  period: 'WEEKLY' | 'MONTHLY' | 'YEARLY',
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/reports?period=${period}&patientId=${patientId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let msg = 'Failed to generate report. Please try again.';
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json.error) msg = json.error;
    } catch { /* non-JSON */ }
    throw new Error(msg);
  }

  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `medtrace-patient-report-${period.toLowerCase()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
