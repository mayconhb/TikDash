import { useState } from 'react';
import { Calendar } from 'lucide-react';

import { 
  getPresetDateKeys,
  PeriodPreset
} from '../../utils/formatters';

export type PeriodType = PeriodPreset;

interface PeriodFilterProps {
  onPeriodChange: (startDateKey: string, endDateKey: string, type: PeriodType) => void;
  defaultPeriod?: PeriodType;
}

export function PeriodFilter({ onPeriodChange, defaultPeriod = 'last30days' }: PeriodFilterProps) {
  const [selected, setSelected] = useState<PeriodType>(defaultPeriod);

  const handleSelect = (type: PeriodType) => {
    setSelected(type);
    
    if (type === 'custom') {
      // In a real app, this would open a calendar sheet
      return;
    }

    const { startDateKey, endDateKey } = getPresetDateKeys(type);
    onPeriodChange(startDateKey, endDateKey, type);
  };

  const options: { id: PeriodType; label: string }[] = [
    { id: 'today', label: 'Hoje' },
    { id: 'yesterday', label: 'Ontem' },
    { id: 'last7days', label: '7 dias' },
    { id: 'last30days', label: '30 dias' },
    { id: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => handleSelect(opt.id)}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
            selected === opt.id 
              ? 'bg-primary text-white border-primary shadow-md' 
              : 'bg-card text-text-secondary border-border-main hover:bg-background-secondary'
          }`}
        >
          {opt.id === 'custom' && <Calendar size={14} className="inline mr-1.5 -mt-0.5" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
