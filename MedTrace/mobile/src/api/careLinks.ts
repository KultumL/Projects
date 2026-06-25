import { API_BASE_URL, DEMO_MODE } from './config';
import { DEMO_CARE_LINKS } from './demo';

export type CarePermission = 'VIEW_ONLY' | 'VIEW_AND_INPUT';
export type CareLinkStatus = 'ACTIVE' | 'PENDING' | 'REVOKED';

export interface CareLink {
  id: string | number;
  patientId: string | number;
  patientName: string;
  caregiverId: string | number;
  caregiverName: string;
  permission: CarePermission;
  status: CareLinkStatus;
  createdAt: string;
  updatedAt: string;
}

// GET /api/care-links/as-caregiver — all care links where the caller is the caregiver
export async function getCareLinks(token: string): Promise<CareLink[]> {
  if (DEMO_MODE) return Promise.resolve(DEMO_CARE_LINKS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/care-links/as-caregiver`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }
  if (!response.ok) {
    throw new Error('Failed to load care links.');
  }
  return response.json() as Promise<CareLink[]>;
}
