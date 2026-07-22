import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  useDashboardSummary, 
  useStatusSummary, 
  useDashboardChart,
  useContentTypeComparison,
  useTopProducts
} from '../hooks/useDashboard';
import { PeriodFilter } from '../components/filters/PeriodFilter';
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
  Package,
  Medal
} from 'lucide-react';
import { 
  formatDateTime,
  getNowInAppTimeZone,
  formatCurrency
} from '../utils/formatters';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

import { getDailyQuote } from '../data/motivational-quotes';

export default function Dashboard() {
  const { profile } = useAuth();
  const motivationalQuote = useMemo(() => getDailyQuote(), []);
  
  const { data: summary, isLoading: summaryLoading, isFetching: summaryFetching } = useDashboardSummary();
  const { data: statusMetrics, isLoading: statusLoading, isFetching: statusFetching } = useStatusSummary();
  const { data: chartData, isLoading: chartLoading, isFetching: chartFetching } = useDashboardChart();
  const { data: contentComparison, isLoading: contentLoading, isFetching: contentFetching } = useContentTypeComparison();
  const { data: topProducts, isLoading: topProductsLoading, isFetching: topProductsFetching } = useTopProducts();

  const loading = summaryLoading || statusLoading || chartLoading || contentLoading || topProductsLoading;
  const isFetching = summaryFetching || statusFetching || chartFetching || contentFetching || topProductsFetching;

  const greeting = useMemo(() => {
    const hour = getNowInAppTimeZone().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const metrics = useMemo(() => statusMetrics || {
    settled: { count: 0, gmv: 0, commission: 0 },
    pending: { count: 0, gmv: 0, commission: 0 },
    awaiting_payment: { count: 0, gmv: 0, commission: 0 },
    ineligible: { count: 0, gmv: 0, commission: 0 },
  }, [statusMetrics]);

  const lostPercentage = useMemo(() => {
    const commissionTotal = metrics.pending.commission + metrics.awaiting_payment.commission + metrics.ineligible.commission + metrics.settled.commission;
    const lostCommissionIneligible = metrics.ineligible.commission;
    const lostCommissionAwaiting = metrics.awaiting_payment.commission;
    return commissionTotal > 0 ? ((lostCommissionIneligible + lostCommissionAwaiting) / commissionTotal) * 100 : 0;
  }, [metrics]);

  if (loading && !summary) {
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

  if (!loading && (!summary || summary.hasAnyData === false)) {
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
          className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]"
        >
          Importar planilha
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Background Fetching Indicator */}
      {isFetching && !loading && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1">
          <div className="h-full bg-primary animate-[loading_1s_ease-in-out_infinite] origin-left"></div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-main tracking-tight">
            {greeting}, {profile?.name?.split(' ')[0]}
          </h1>
          <p className="text-text-secondary text-base">{motivationalQuote}</p>
          {summary?.lastUpdate && (
            <p className="text-[12px] text-text-tertiary font-medium">
              Atualizado {formatDateTime(summary.lastUpdate)}
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
      <PeriodFilter />

      {/* Summary Card */}
      <SummaryCard 
        gmvTotal={metrics.pending.gmv + metrics.awaiting_payment.gmv + metrics.ineligible.gmv + metrics.settled.gmv} 
        commissionTotal={metrics.pending.commission + metrics.awaiting_payment.commission + metrics.ineligible.commission + metrics.settled.commission}
        gmvReal={metrics.pending.gmv + metrics.settled.gmv}
        commissionReal={metrics.pending.commission + metrics.settled.commission}
      />

      {/* Taxa de Cancelamento Card */}
      <div className="bg-card p-5 rounded-2xl border border-border-main shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h3 className="text-[14px] font-bold text-text-tertiary uppercase tracking-widest leading-none mb-1.5">Taxa de Cancelamento</h3>
            <p className="text-[14px] text-text-secondary font-medium leading-tight">Pedidos não pagos, cancelados ou reembolsados</p>
          </div>
          <span className="text-2xl font-black text-text-main leading-none">{lostPercentage.toFixed(1)}%</span>
        </div>
      </div>

      {/* Status Metrics Title */}
      <div className="pt-6 pb-0">
        <h2 className="text-[16px] font-bold text-text-tertiary uppercase tracking-[0.1em] leading-none">Status dos Pedidos</h2>
      </div>

      {/* Status Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatusMetricCard 
          title="Pendentes" 
          count={metrics.pending.count} 
          color="yellow"
          icon={<Timer size={16} />}
        />
        <StatusMetricCard 
          title={"Aguardando\nPagamento"} 
          count={metrics.awaiting_payment.count} 
          color="blue"
          icon={<Hourglass size={16} />}
        />
        <StatusMetricCard 
          title="Inelegíveis" 
          count={metrics.ineligible.count} 
          color="red"
          icon={<AlertCircle size={16} />}
        />
        <StatusMetricCard 
          title="Liquidados" 
          count={metrics.settled.count} 
          color="green"
          icon={<CheckCircle2 size={16} />}
        />
      </div>

      {/* Main Chart */}
      <GmvCommissionChart data={chartData || []} />

      {/* Top Products */}
      <div className="space-y-4">
        <h3 className="font-bold text-text-main text-lg tracking-tight">Produtos mais vendidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(topProducts || []).slice(0, 3).map((product: any, index: number) => (
            <div key={product.id} className="bg-card p-6 rounded-[18px] border border-border-main shadow-soft space-y-4 relative overflow-hidden group">
              <div className={`absolute -right-2 -top-2 w-16 h-16 opacity-10 flex items-center justify-center rotate-12 transition-transform group-hover:scale-110`}>
                <Medal size={64} />
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                  index === 1 ? 'bg-slate-300 text-slate-700' : 
                  'bg-orange-300 text-orange-800'
                }`}>
                  {index + 1}
                </div>
                <div className="w-10 h-10 bg-background-secondary rounded-lg flex items-center justify-center text-text-tertiary">
                  <Package size={20} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-text-main line-clamp-2 leading-tight h-10">{product.name}</p>
                <p className="text-[12px] text-text-tertiary font-bold uppercase tracking-wider">{product.sold} unidades vendidas</p>
              </div>
              <div className="pt-3 border-t border-border-main flex justify-between">
                <div>
                  <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">GMV</p>
                  <p className="text-sm font-bold text-text-main">{formatCurrency(product.gmv)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Comissão</p>
                  <p className="text-sm font-bold text-status-commission">{formatCurrency(product.commission)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video vs Live */}
      <div className="bg-card p-6 rounded-[18px] border border-border-main shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-main">Vídeo vs Live</h3>
          <span className="text-[12px] bg-background-secondary px-2 py-1 rounded-full font-bold text-text-tertiary uppercase">Comparativo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(contentComparison || {}).map(([type, stats]: [string, any]) => (
            <div key={type} className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold capitalize text-text-secondary">{type}</span>
                <span className="text-sm font-medium text-text-tertiary">{stats.orders} pedidos</span>
              </div>
              <div className="w-full h-2 bg-background-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full ${type === 'video' ? 'bg-primary' : type === 'live' ? 'bg-status-commission' : 'bg-text-tertiary'}`} 
                  style={{ width: `${summary?.gmvTotal > 0 ? (stats.gmv / summary.gmvTotal) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-text-main">{formatCurrency(stats.gmv)} GMV</span>
                <span className="font-bold text-status-commission">{formatCurrency(stats.commission)} Comissão</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Relatorio */}
      <Link to="/relatorio-diario" className="group block bg-card p-6 rounded-[18px] border border-border-main shadow-soft hover:border-primary/30 transition-all">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-text-main">Quer analisar dia por dia?</h3>
            <p className="text-base text-text-secondary">Veja os resultados diários em uma tabela completa e comparável.</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
            <ArrowRight size={20} />
          </div>
        </div>
      </Link>
    </div>
  );
}
