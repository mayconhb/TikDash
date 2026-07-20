import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { PeriodFilter, PeriodType } from '../components/dashboard/PeriodFilter';
import { SummaryCard, StatusMetricCard } from '../components/dashboard/MetricCards';
import { GmvCommissionChart } from '../components/dashboard/GmvCommissionChart';
import { 
  Timer, 
  Hourglass, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  ArrowRight,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  getPresetDateKeys,
  formatDateRangeLabel,
  PeriodPreset,
  getNowInAppTimeZone,
  formatDateTime
} from '../utils/formatters';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [dateRange, setDateRange] = useState(() => getPresetDateKeys('last30days'));
  
  const { data, loading, error } = useDashboardData(dateRange.startDateKey, dateRange.endDateKey);

  const getGreeting = () => {
    const hour = getNowInAppTimeZone().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handlePeriodChange = (startDateKey: string, endDateKey: string) => {
    setDateRange({ startDateKey, endDateKey });
  };

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-card rounded-2xl"></div>
        <div className="h-40 bg-card rounded-2xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-32 bg-card rounded-2xl"></div>
          <div className="h-32 bg-card rounded-2xl"></div>
          <div className="h-32 bg-card rounded-2xl"></div>
          <div className="h-32 bg-card rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.hasAnyData && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <TrendingUp size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-text-main">Seu dashboard começa com uma planilha</h2>
          <p className="text-text-secondary max-w-sm">Importe seus pedidos para visualizar GMV, comissão, status e desempenho das vendas.</p>
        </div>
        <Link 
          to="/importacoes" 
          className="hidden md:inline-block bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]"
        >
          Importar planilha
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-main tracking-tight">
            {getGreeting()}, {profile?.name?.split(' ')[0]}
          </h1>
          <p className="text-text-secondary text-sm">Veja como estão suas vendas.</p>
          {data.lastUpdate && (
            <p className="text-[10px] text-text-tertiary font-medium">
              Atualizado {formatDateTime(data.lastUpdate)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <Link 
            to="/importacoes" 
            className="hidden md:flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"
          >
            <Plus size={16} />
            <span>Importar planilha</span>
          </Link>
        </div>
      </div>

      {/* Period Filter */}
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

      {/* Summary Card */}
      <SummaryCard gmv={data.gmvTotal} commission={data.commissionTotal} />

      {/* Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusMetricCard 
          title="Pendentes" 
          count={data.ordersByStatus.pending.count} 
          gmv={data.ordersByStatus.pending.gmv} 
          commission={data.ordersByStatus.pending.commission}
          color="yellow"
          icon={<Timer size={18} />}
        />
        <StatusMetricCard 
          title="Aguardando" 
          count={data.ordersByStatus.awaiting_payment.count} 
          gmv={data.ordersByStatus.awaiting_payment.gmv} 
          commission={data.ordersByStatus.awaiting_payment.commission}
          color="blue"
          icon={<Hourglass size={18} />}
        />
        <StatusMetricCard 
          title="Inelegíveis" 
          count={data.ordersByStatus.ineligible.count} 
          gmv={data.ordersByStatus.ineligible.gmv} 
          commission={data.ordersByStatus.ineligible.commission}
          color="red"
          icon={<AlertCircle size={18} />}
        />
        <StatusMetricCard 
          title="Liquidados" 
          count={data.ordersByStatus.settled.count} 
          gmv={data.ordersByStatus.settled.gmv} 
          commission={data.ordersByStatus.settled.commission}
          color="green"
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {/* Lost Commission Card */}
      <div className="bg-card p-6 rounded-[18px] border border-border-main shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Comissão não aproveitada</h3>
            <p className="text-[10px] text-text-tertiary font-medium italic">Percentual concentrado em pedidos inelegíveis ou aguardando pagamento.</p>
          </div>
          <span className="text-3xl font-black text-text-main">{data.lostCommission.percentage.toFixed(1)}%</span>
        </div>

        <div className="w-full h-3 bg-background-secondary rounded-full overflow-hidden flex">
          <div className="bg-status-ineligible transition-all" style={{ width: `${(data.lostCommission.ineligible / data.commissionTotal) * 100}%` }}></div>
          <div className="bg-status-awaiting transition-all" style={{ width: `${(data.lostCommission.awaiting / data.commissionTotal) * 100}%` }}></div>
        </div>

        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-status-ineligible">Inelegíveis: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.lostCommission.ineligible)}</span>
          <span className="text-status-awaiting">Aguardando: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.lostCommission.awaiting)}</span>
        </div>
      </div>

      {/* Main Chart */}
      <GmvCommissionChart data={data.timeSeries} />

      {/* CTA Relatorio */}
      <Link to="/relatorio-diario" className="group block bg-card p-6 rounded-[18px] border border-border-main shadow-soft hover:border-primary/30 transition-all">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-text-main">Quer analisar dia por dia?</h3>
            <p className="text-sm text-text-secondary">Veja os resultados diários em uma tabela completa e comparável.</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
            <ArrowRight size={20} />
          </div>
        </div>
      </Link>
    </div>
  );
}
