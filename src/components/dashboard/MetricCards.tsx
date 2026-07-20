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

export function SummaryCard({ gmv, commission }: { gmv: number; commission: number }) {
  return (
    <div className="bg-primary p-6 rounded-[18px] shadow-lg text-white relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold opacity-90">Resumo estimado</h2>
          <button title="Informação sobre valores estimados">
            <Info size={16} className="opacity-70" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-medium opacity-80">GMV estimado</p>
            <p className="text-3xl font-extrabold">{formatCurrency(gmv)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium opacity-80">Comissão estimada</p>
            <p className="text-3xl font-extrabold">{formatCurrency(commission)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
