import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { 
  PeriodPreset, 
  PeriodState, 
  DateKeyRange, 
  createPeriodState 
} from '../lib/date-range';

interface PeriodFilterContextValue {
  period: PeriodState;
  setPreset: (preset: Exclude<PeriodPreset, 'custom'>) => void;
  setCustomRange: (range: DateKeyRange) => void;
}

const PeriodFilterContext = createContext<PeriodFilterContextValue | undefined>(undefined);

const DEFAULT_PRESET: PeriodPreset = 'last30days';

export function PeriodFilterProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<PeriodState>(() => createPeriodState(DEFAULT_PRESET));

  const setPreset = useCallback((preset: Exclude<PeriodPreset, 'custom'>) => {
    const nextPeriod = createPeriodState(preset);
    setPeriod(nextPeriod);
  }, []);

  const setCustomRange = useCallback((range: DateKeyRange) => {
    const nextPeriod = createPeriodState('custom', range);
    setPeriod(nextPeriod);
  }, []);

  // Temporary log for debugging as requested
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' || true) {
      console.table({
        preset: period.preset,
        startDateKey: period.startDateKey,
        endDateKey: period.endDateKey,
        startUtc: period.startUtc,
        endUtcExclusive: period.endUtcExclusive,
        label: period.label,
      });
    }
  }, [period]);

  const value = useMemo(() => ({
    period,
    setPreset,
    setCustomRange,
  }), [period, setPreset, setCustomRange]);

  return (
    <PeriodFilterContext.Provider value={value}>
      {children}
    </PeriodFilterContext.Provider>
  );
}

export function usePeriodFilter() {
  const context = useContext(PeriodFilterContext);
  if (context === undefined) {
    throw new Error('usePeriodFilter must be used within a PeriodFilterProvider');
  }
  return context;
}
