import { 
  usePeriodFilter 
} from '../../contexts/PeriodFilterContext';
import { Calendar, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

const presets = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: 'last7days', label: '7 dias' },
  { id: 'last30days', label: '30 dias' },
] as const;

interface PeriodFilterProps {
  showPresets?: boolean;
  customLabel?: string;
  showLabel?: boolean;
}

export function PeriodFilter({ 
  showPresets = true, 
  customLabel = 'Personalizado',
  showLabel = true
}: PeriodFilterProps) {
  const { period, setPreset, setCustomRange } = usePeriodFilter();
  const [showCustom, setShowCustom] = useState(false);

  // Convert string keys to Date objects for DayPicker
  const initialRange: DateRange | undefined = useMemo(() => {
    if (period.preset === 'custom' && period.startDateKey && period.endDateKey) {
      return {
        from: parseISO(period.startDateKey),
        to: parseISO(period.endDateKey)
      };
    }
    return undefined;
  }, [period]);

  const [range, setRange] = useState<DateRange | undefined>(initialRange);

  const handleApplyCustom = () => {
    if (range?.from && range?.to) {
      setCustomRange({
        startDateKey: format(range.from, 'yyyy-MM-dd'),
        endDateKey: format(range.to, 'yyyy-MM-dd'),
      });
      setShowCustom(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className={`flex items-center gap-1 p-1 bg-background-secondary rounded-xl overflow-x-auto no-scrollbar whitespace-nowrap border border-border-main ${!showPresets ? 'w-full sm:w-auto' : ''}`}>
          {showPresets && presets.map((item) => (
            <button
              key={item.id}
              onClick={() => setPreset(item.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                period.preset === item.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setShowCustom(true)}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${!showPresets ? 'w-full justify-center py-3' : ''} ${
              period.preset === 'custom'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
            }`}
          >
            <Calendar size={18} />
            {customLabel}
            {!showPresets && period.preset === 'custom' && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                {period.label.replace('Exibindo: ', '')}
              </span>
            )}
          </button>
        </div>
      </div>

      {showLabel && (
        <div className="flex items-center space-x-2 text-sm text-text-secondary animate-in fade-in duration-500">
          <Calendar size={14} className="text-text-tertiary" />
          <span>Exibindo:</span>
          <span className="font-semibold text-text-primary">
            {period.label}
          </span>
        </div>
      )}

      {showCustom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card p-4 sm:p-6 rounded-3xl border border-border-main shadow-2xl max-w-[92vw] sm:max-w-fit w-full space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border-main pb-4 mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <h3 className="font-semibold text-base sm:text-lg">Selecionar Período</h3>
              </div>
              <button 
                onClick={() => setShowCustom(false)} 
                className="p-2 hover:bg-background-secondary rounded-full transition-colors text-text-tertiary hover:text-text-primary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex justify-center py-2 sm:py-4">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={setRange}
                locale={ptBR}
                numberOfMonths={1}
                className="!m-0 rdp-custom"
                showOutsideDays
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] uppercase font-bold tracking-wider text-text-tertiary">Período Selecionado</span>
                <div className="text-base font-semibold text-text-main">
                  {range?.from ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-primary">{format(range.from, 'dd/MM/yyyy')}</span>
                      {range.to ? (
                        <>
                          <span className="text-text-tertiary">→</span>
                          <span className="text-primary">{format(range.to, 'dd/MM/yyyy')}</span>
                        </>
                      ) : (
                        <span className="text-text-tertiary animate-pulse">...</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-text-tertiary">Selecione no calendário</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-xl transition-all active:scale-95"
                  onClick={() => setShowCustom(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/25 transition-all active:scale-95"
                  onClick={handleApplyCustom}
                  disabled={!range?.from || !range?.to}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
