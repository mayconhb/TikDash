import { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface MetricCardProps {
  title: string;
  count: number;
  gmv: number;
  commission: number;
  color: string;
  icon?: ReactNode;
}

export function StatusMetricCard({ title, count, gmv, commission, color, icon }: MetricCardProps) {
  const colorMap: Record<string, string> = {
    yellow: 'border-status-pending text-status-pending',
    blue: 'border-status-awaiting text-status-awaiting',
    red: 'border-status-ineligible text-status-ineligible',
    green: 'border-status-settled text-status-settled',
  };

  const bgMap: Record<string, string> = {
    yellow: 'bg-status-pending-light',
    blue: 'bg-status-awaiting-light',
    red: 'bg-status-ineligible-light',
    green: 'bg-status-settled-light',
  };

  return (
    <div className="bg-card p-5 rounded-[18px] border border-border-main shadow-soft flex flex-col space-y-4">
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgMap[color]} ${colorMap[color].split(' ')[1]}`}>
          {icon}
        </div>
        <span className="text-[13px] font-semibold text-text-secondary">{title}</span>
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold text-text-main">{formatNumber(count)} pedidos</p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-main">
        <div>
          <p className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">GMV</p>
          <p className="text-sm font-bold text-text-main truncate">{formatCurrency(gmv)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Comissão</p>
          <p className="text-sm font-bold text-text-main truncate">{formatCurrency(commission)}</p>
        </div>
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
          <h2 className="text-sm font-bold opacity-90 uppercase tracking-wider">Resumo</h2>
          <button title="Informação sobre valores">
            <Info size={16} className="opacity-70" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 relative">
          {/* Separator */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/20 -translate-x-1/2"></div>
          
          {/* Left Side: Todos Pedidos */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Todos pedidos</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-medium opacity-60 uppercase">GMV Total</p>
                <p className="text-xl md:text-2xl font-black">{formatCurrency(gmvTotal)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium opacity-60 uppercase">Comissão Total</p>
                <p className="text-lg md:text-xl font-bold opacity-90">{formatCurrency(commissionTotal)}</p>
              </div>
            </div>
          </div>

          {/* Right Side: Pedidos Pagos */}
          <div className="space-y-4 pl-2">
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Pedidos Pagos</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-medium opacity-60 uppercase">GMV Real</p>
                <p className="text-xl md:text-2xl font-black">{formatCurrency(gmvReal)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium opacity-60 uppercase">Comissão Real</p>
                <p className="text-lg md:text-xl font-bold opacity-90">{formatCurrency(commissionReal)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
