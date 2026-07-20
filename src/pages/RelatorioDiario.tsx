import { useState } from 'react';
import { useDailyReport } from '../hooks/useDashboard';
import { PeriodFilter } from '../components/filters/PeriodFilter';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercent
} from '../utils/formatters';
import { 
  formatDateKeyDayMonth,
  formatDateKeyPtBr
} from '../lib/date-range';
import { 
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';

export default function RelatorioDiario() {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const { data: dailyData, isLoading: loading, isFetching } = useDailyReport();

  if (loading && !dailyData) {
    return <div className="animate-pulse space-y-8"><div className="h-64 bg-card rounded-2xl"></div></div>;
  }

  const sortedData = [...(dailyData || [])];

  return (
    <div className="space-y-8 relative">
      {/* Background Fetching Indicator */}
      {isFetching && !loading && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1">
          <div className="h-full bg-primary animate-[loading_1s_ease-in-out_infinite] origin-left"></div>
        </div>
      )}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Relatório diário</h1>
          <p className="text-text-secondary text-base">Compare seus resultados por dia.</p>
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

      {/* Period Filter */}
      <PeriodFilter />

      <div className="hidden md:block bg-card rounded-[18px] border border-border-main shadow-soft overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-background-secondary/50">
                <th className="sticky top-0 z-10 bg-background-secondary px-6 py-4 text-[12px] font-bold text-text-tertiary uppercase tracking-wider border-b border-border-main">Data</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-4 py-4 text-[12px] font-bold text-text-tertiary uppercase tracking-wider text-center border-b border-border-main">Liquidados</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-4 py-4 text-[12px] font-bold text-text-tertiary uppercase tracking-wider text-center border-b border-border-main">Pendentes</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-4 py-4 text-[12px] font-bold text-text-tertiary uppercase tracking-wider text-center border-b border-border-main">Aguardando pagamento</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-4 py-4 text-[12px] font-bold text-text-tertiary uppercase tracking-wider text-center border-b border-border-main">Inelegíveis</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-6 py-4 text-[12px] font-bold text-text-tertiary uppercase tracking-wider text-right border-b border-border-main">GMV</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-6 py-4 text-[12px] font-bold text-text-tertiary uppercase tracking-wider text-right border-b border-border-main">Comissão</th>
                <th className="sticky top-0 z-10 bg-background-secondary px-6 py-4 text-[12px] font-bold text-text-tertiary uppercase tracking-wider text-right border-b border-border-main">Comissão não aproveitada</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((day) => {
                const unexploited = day.awaiting + day.ineligible;
                const unexploitedPercentage = day.commission > 0 ? (unexploited / day.commission) * 100 : 0;
                
                return (
                  <tr key={day.date} className="border-b border-border-main hover:bg-background-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-base font-bold text-text-main">
                      {formatDateKeyDayMonth(day.date)}
                    </td>
                    <td className="px-4 py-4 text-center text-base font-medium text-text-secondary">
                      {formatNumber(day.settled)}
                    </td>
                    <td className="px-4 py-4 text-center text-base font-medium text-text-secondary">
                      {formatNumber(day.pending)}
                    </td>
                    <td className="px-4 py-4 text-center text-base font-medium text-text-secondary">
                      {formatNumber(day.awaiting)}
                    </td>
                    <td className="px-4 py-4 text-center text-base font-medium text-text-secondary">
                      {formatNumber(day.ineligible)}
                    </td>
                    <td className="px-6 py-4 text-right text-base font-bold text-text-main">
                      {formatCurrency(day.gmv)}
                    </td>
                    <td className="px-6 py-4 text-right text-base font-bold text-status-commission">
                      {formatCurrency(day.commission)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${
                        unexploitedPercentage > 10 ? 'bg-red-100 text-red-600' : 
                        unexploitedPercentage > 5 ? 'bg-amber-100 text-amber-600' : 
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {formatPercent(unexploitedPercentage)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedData.map((day) => {
          const unexploited = day.awaiting + day.ineligible;
          const unexploitedPercentage = day.commission > 0 ? (unexploited / day.commission) * 100 : 0;
          
          return (
            <div key={day.date} className="bg-card rounded-[18px] border border-border-main shadow-soft p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-border-main pb-3">
                <span className="text-lg font-bold text-text-main">{formatDateKeyPtBr(day.date)}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${
                  unexploitedPercentage > 10 ? 'bg-red-100 text-red-600' : 
                  unexploitedPercentage > 5 ? 'bg-amber-100 text-amber-600' : 
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {formatPercent(unexploitedPercentage)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-base">
                  <span className="text-text-tertiary">Liquidados</span>
                  <span className="font-bold text-text-main">{formatNumber(day.settled)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-text-tertiary">Pendentes</span>
                  <span className="font-bold text-text-main">{formatNumber(day.pending)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-text-tertiary">Aguardando</span>
                  <span className="font-bold text-text-main">{formatNumber(day.awaiting)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-text-tertiary">Inelegíveis</span>
                  <span className="font-bold text-text-main">{formatNumber(day.ineligible)}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-border-main">
                  <span className="text-text-tertiary">GMV</span>
                  <span className="font-bold text-text-main">{formatCurrency(day.gmv)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-text-tertiary">Comissão</span>
                  <span className="font-bold text-status-commission">{formatCurrency(day.commission)}</span>
                </div>
                <div className="flex flex-col pt-2">
                  <span className="text-[12px] text-text-tertiary font-bold uppercase tracking-wider">Comissão não aproveitada</span>
                  <span className={`text-xl font-black ${
                    unexploitedPercentage > 10 ? 'text-red-600' : 
                    unexploitedPercentage > 5 ? 'text-amber-600' : 
                    'text-emerald-600'
                  }`}>
                    {formatPercent(unexploitedPercentage)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
