import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { setTutorialSeen } from '../api/storage';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  ref?: React.RefObject<View | null>;
}

interface TourContextValue {
  isActive: boolean;
  currentIndex: number;
  steps: TourStep[];
  startTour: (s: TourStep[]) => void;
  next: () => void;
  back: () => void;
  endTour: (userId: string) => void;
  skipTour: (userId: string) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps]       = useState<TourStep[]>([]);
  const [currentIndex, setIndex] = useState(0);
  const finishing = useRef(false);

  const startTour = useCallback((s: TourStep[]) => {
    if (!s.length) return;
    finishing.current = false;
    setSteps(s);
    setIndex(0);
    setIsActive(true);
  }, []);

  const next = useCallback(() => {
    setIndex(prev => {
      if (prev >= steps.length - 1) return prev;
      return prev + 1;
    });
  }, [steps.length]);

  const back = useCallback(() => {
    setIndex(prev => Math.max(0, prev - 1));
  }, []);

  const endTour = useCallback((userId: string) => {
    if (finishing.current) return;
    finishing.current = true;
    setIsActive(false);
    setIndex(0);
    void setTutorialSeen(userId);
  }, []);

  const skipTour = useCallback((userId: string) => {
    endTour(userId);
  }, [endTour]);

  return (
    <TourContext.Provider value={{ isActive, currentIndex, steps, startTour, next, back, endTour, skipTour }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside TourProvider');
  return ctx;
}
