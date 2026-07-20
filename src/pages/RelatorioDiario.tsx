import { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { PeriodFilter } from '../components/dashboard/PeriodFilter';
import { 
  formatCurrency, 
  formatNumber, 
  getPresetDateKeys,
  formatDateKeyDayMonth,
  formatDateKeyPtBr,
  formatDateRangeLabel,
  formatPercent
} from '../utils/formatters';
import { 
  Table as TableIcon,
  LayoutGrid,
  Calendar
} from 'lucide-react';

export default function RelatorioDiario() {
  const [dateRange, setDateRange] = useState(() => getPresetDateKeys('last30days'));
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const { data, loading } = useDashboardData(dateRange.startDateKey, dateRange.endDateKey);

  const handlePeriodChange = (startDateKey: string, endDateKey: string) => {
    setDateRange({ startDateKey, endDateKey });
  };

  if (loading || !data) {
    return <div className="animate-pulse space-y-8"><div className="h-64 bg-card rounded-2xl"></div></div>;
  }

  const sortedData = [...data.timeSeries].reverse();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Relatório diário</h1>
          <p className="text-text-secondary text-sm">Compare seus resultados por dia.</p>
        </div>
        <div className="flex bg-card rounded-xl p-1 border border-border-main">
          <button 
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-primary/10 text-primary' : 'text-text-tertiary'}`}
            title="Vista em Cards"
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-text-tertiary'}`}
            title="Vista em Tabela"
          >
            <TableIcon size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <PeriodFilter onPeriodChange={handlePeriodChange} defaultPeriod="last30days" />
        <div className="flex items-center space-x-2 text-xs text-text-secondary">
          <Calendar size={12} className="text-text-tertiary" />
          <span>Exibindo:</span>
          <span className="font-semibold text-text-primary">
            {formatDateRangeLabel(dateRange.startDateKey, dateRange.endDateKey)}
          </span>
        </div>
      </div>

      <div className="hidden md:block bg-card rounded-[18px] border border-border-main shadow-soft overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-background-secondary/50">
                <th className="sticky top-0 z-10 bg-background-secondary px-6 py-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider border-b border-border-main">Data</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-4 py-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-center border-b border-border-main">Liquidados</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-4 py-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-center border-b border-border-main">Pendentes</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-4 py-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-center border-b border-border-main">Aguardando pagamento</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-4 py-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-center border-b border-border-main">Inelegíveis</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-6 py-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right border-b border-border-main">GMV</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-6 py-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right border-b border-border-main">Comissão</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-6 py-4 text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right border-b border-border-main">Comissão não aproveitada</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((day) => (
                <tr key={day.date} className="border-b border-border-main hover:bg-background-secondary/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-text-main">
                    {formatDateKeyDayMonth(day.date)}
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-medium text-text-secondary">
                    {formatNumber(day.settledCount)}
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-medium text-text-secondary">
                    {formatNumber(day.pendingCount)}
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-medium text-text-secondary">
                    {formatNumber(day.awaitingCount)}
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-medium text-text-secondary">
                    {formatNumber(day.ineligibleCount)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-text-main">
                    {formatCurrency(day.gmv)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-status-commission">
                    {formatCurrency(day.commission)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      day.unexploitedPercentage > 10 ? 'bg-red-100 text-red-600' : 
                      day.unexploitedPercentage > 5 ? 'bg-amber-100 text-amber-600' : 
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {formatPercent(day.unexploitedPercentage)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedData.map((day) => (
          <div key={day.date} className="bg-card rounded-[18px] border border-border-main shadow-soft p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border-main pb-3">
              <span className="text-base font-bold text-text-main">{formatDateKeyPtBr(day.date)}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                day.unexploitedPercentage > 10 ? 'bg-red-100 text-red-600' : 
                day.unexploitedPercentage > 5 ? 'bg-amber-100 text-amber-600' : 
                'bg-emerald-100 text-emerald-600'
              }`}>
                {formatPercent(day.unexploitedPercentage)}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Liquidados</span>
                <span className="font-bold text-text-main">{formatNumber(day.settledCount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Pendentes</span>
                <span className="font-bold text-text-main">{formatNumber(day.pendingCount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Aguardando</span>
                <span className="font-bold text-text-main">{formatNumber(day.awaitingCount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Inelegíveis</span>
                <span className="font-bold text-text-main">{formatNumber(day.ineligibleCount)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border-main">
                <span className="text-text-tertiary">GMV</span>
                <span className="font-bold text-text-main">{formatCurrency(day.gmv)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Comissão</span>
                <span className="font-bold text-status-commission">{formatCurrency(day.commission)}</span>
              </div>
              <div className="flex flex-col pt-2">
                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Comissão não aproveitada</span>
                <span className={`text-lg font-black ${
                  day.unexploitedPercentage > 10 ? 'text-red-600' : 
                  day.unexploitedPercentage > 5 ? 'text-amber-600' : 
                  'text-emerald-600'
                }`}>
                  {formatPercent(day.unexploitedPercentage)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
