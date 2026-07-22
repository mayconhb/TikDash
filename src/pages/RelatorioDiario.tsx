import { useState } from 'react';
import { useDailyReport } from '../hooks/useDashboard';
import { PeriodFilter } from '../components/filters/PeriodFilter';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercent
} from '../utils/formatters';
import { 
  formatDateKeyPtBr
} from '../lib/date-range';
import { 
  ChevronDown
} from 'lucide-react';

export default function RelatorioDiario() {
  const [visibleCount, setVisibleCount] = useState(7);
  const { data: dailyData, isLoading: loading, isFetching } = useDailyReport();

  if (loading && !dailyData) {
    return <div className="animate-pulse space-y-8"><div className="h-64 bg-card rounded-2xl"></div></div>;
  }

  const sortedData = [...(dailyData || [])];
  const displayedData = sortedData.slice(0, visibleCount);
  const hasMore = visibleCount < sortedData.length;

  const loadMore = () => {
    setVisibleCount(prev => prev + 7);
  };

  return (
    <div className="space-y-8 relative pb-10">
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
      </div>

      {/* Period Filter */}
      <PeriodFilter showPresets={false} customLabel="Filtrar Dias" showLabel={false} />

      {/* Cards View (Main View) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedData.map((day) => {
          const awaitingComm = Number(day.awaiting_commission || 0);
          const ineligibleComm = Number(day.ineligible_commission || 0);
          const totalComm = Number(day.commission || 0);
          const lostPercentage = totalComm > 0 ? ((awaitingComm + ineligibleComm) / totalComm) * 100 : 0;
          
          return (
            <div key={day.date} className="bg-card rounded-[24px] border border-border-main shadow-soft p-6 space-y-5 flex flex-col transition-all hover:shadow-md">
              <div className="flex justify-between items-start border-b border-border-main pb-4">
                <span className="text-lg font-extrabold text-text-main tracking-tight">{formatDateKeyPtBr(day.date)}</span>
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] text-text-tertiary uppercase tracking-wider leading-tight">Taxa de cancelamento</span>
                  <span className={`text-sm font-medium ${
                    lostPercentage > 10 ? 'text-red-500' : 
                    lostPercentage > 5 ? 'text-amber-500' : 
                    'text-emerald-500'
                  }`}>
                    {formatPercent(lostPercentage)}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-background-secondary/30 p-2 rounded-lg">
                    <span className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Total de pedidos</span>
                    <p className="text-sm font-bold text-text-main">{formatNumber(day.orders)}</p>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Pendentes</span>
                    <p className="text-sm font-bold text-text-main">{formatNumber(day.pending)}</p>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Aguardando pagamento</span>
                    <p className="text-sm font-bold text-text-main">{formatNumber(day.awaiting)}</p>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Inelegíveis</span>
                    <p className="text-sm font-bold text-text-main">{formatNumber(day.ineligible)}</p>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Liquidados</span>
                    <p className="text-sm font-bold text-text-main">{formatNumber(day.settled)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-main grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[12px] text-text-tertiary font-bold uppercase tracking-wider">GMV Total</span>
                    <p className="text-lg font-bold text-text-main">{formatCurrency(day.gmv)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[12px] text-text-tertiary font-bold uppercase tracking-wider">Comissão</span>
                    <p className="text-xl font-black text-status-commission">{formatCurrency(day.commission)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={loadMore}
            className="flex flex-col items-center gap-2 text-primary font-bold hover:opacity-80 transition-opacity group"
          >
            <span className="text-base">Ver mais dias</span>
            <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
              <ChevronDown size={24} className="animate-bounce" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
