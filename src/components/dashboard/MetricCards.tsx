import { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface MetricCardProps {
  title: string;
  count: number;
  color: string;
  icon?: ReactNode;
}

export function StatusMetricCard({ title, count, color, icon }: MetricCardProps) {
  const colorMap: Record<string, string> = {
    yellow: 'text-status-pending',
    blue: 'text-status-awaiting',
    red: 'text-status-ineligible',
    green: 'text-status-settled',
  };

  const bgMap: Record<string, string> = {
    yellow: 'bg-status-pending-light',
    blue: 'bg-status-awaiting-light',
    red: 'bg-status-ineligible-light',
    green: 'bg-status-settled-light',
  };

  return (
    <div className="bg-card p-3.5 rounded-[20px] border border-border-main shadow-sm flex flex-col gap-3 transition-all hover:shadow-md hover:border-primary/20 group h-full">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center ${bgMap[color]} ${colorMap[color]} transition-transform group-hover:scale-105`}>
          {icon}
        </div>
        <p className="text-[13px] sm:text-[14px] uppercase font-bold text-text-tertiary tracking-wider leading-tight whitespace-pre-line">
          {title}
        </p>
      </div>
      
      <div className="flex items-baseline gap-1 mt-auto">
        <p className="text-2xl font-black text-text-main leading-none">{formatNumber(count)}</p>
        <span className="text-[14px] font-medium text-text-tertiary truncate">pedidos</span>
      </div>
    </div>
  );
}

export function SummaryCard({ 
  gmvTotal, 
  commissionTotal, 
  gmvReal, 
  commissionReal 
}: { 
  gmvTotal: number; 
  commissionTotal: number;
  gmvReal: number;
  commissionReal: number;
}) {
  return (
    <div className="bg-primary p-4 rounded-2xl shadow-lg text-white relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold opacity-90 uppercase tracking-wider">Resumo</h2>
          <button title="Informação sobre valores">
            <Info size={18} className="opacity-70" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 relative">
          {/* Separator */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/20 -translate-x-1/2"></div>
          
          {/* Left Side: Todos Pedidos */}
          <div className="space-y-4">
            <p className="text-[12px] font-bold opacity-70 uppercase tracking-widest">Todos pedidos</p>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-medium opacity-60 uppercase">GMV Total</p>
                <p className="text-xl md:text-2xl font-black">{formatCurrency(gmvTotal)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium opacity-60 uppercase">Comissão Total</p>
                <p className="text-lg md:text-xl font-bold opacity-90">{formatCurrency(commissionTotal)}</p>
              </div>
            </div>
          </div>

          {/* Right Side: Pedidos Pagos */}
          <div className="space-y-4 pl-2">
            <p className="text-[12px] font-bold opacity-70 uppercase tracking-widest">Pedidos Pagos</p>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-medium opacity-60 uppercase">GMV Real</p>
                <p className="text-xl md:text-2xl font-black">{formatCurrency(gmvReal)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium opacity-60 uppercase">Comissão Real</p>
                <p className="text-lg md:text-xl font-bold opacity-90">{formatCurrency(commissionReal)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
