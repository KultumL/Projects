import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { CareLink, CarePermission, getCareLinks } from '@/api/careLinks';

export interface ResolvedPatient {
  patientId: string | number;
  patientName: string;
  permission: CarePermission;
}

interface CareContextValue {
  patient: ResolvedPatient | null;   // first ACTIVE link, or null if none
  links: CareLink[];                  // all links — for the profile tab
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const CareContext = createContext<CareContextValue>({
  patient: null,
  links: [],
  loading: true,
  error: null,
  reload: () => {},
});

export function CareProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [links, setLinks]     = useState<CareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  async function fetchLinks() {
    setLoading(true);
    setError(null);
    try {
      const all = await getCareLinks(token!);
      setLinks(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load care links.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLinks(); }, [token]);

  const activeLink = links.find(l => l.status === 'ACTIVE') ?? null;
  const patient: ResolvedPatient | null = activeLink
    ? {
        patientId:   activeLink.patientId,
        patientName: activeLink.patientName,
        permission:  activeLink.permission,
      }
    : null;

  return (
    <CareContext.Provider value={{ patient, links, loading, error, reload: fetchLinks }}>
      {children}
    </CareContext.Provider>
  );
}

export function useCare(): CareContextValue {
  return useContext(CareContext);
}
