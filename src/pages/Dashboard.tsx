import { useState, useMemo } from 'react';
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
  getNowInAppTimeZone,
  formatCurrency,
  formatNumber
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
  const [showAllTopProducts, setShowAllTopProducts] = useState(false);

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
    const totalOrders = metrics.pending.count + metrics.awaiting_payment.count + metrics.ineligible.count + metrics.settled.count;
    const lostOrdersIneligible = metrics.ineligible.count;
    const lostOrdersAwaiting = metrics.awaiting_payment.count;
    return totalOrders > 0 ? ((lostOrdersIneligible + lostOrdersAwaiting) / totalOrders) * 100 : 0;
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

      {/* Video vs Live */}
      <div className="bg-card p-6 rounded-[18px] border border-border-main shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-text-main text-lg tracking-tight">Vídeo vs Live</h3>
            <p className="text-sm text-text-tertiary">Comparativo de performance por canal</p>
          </div>
        </div>

        {(() => {
          const video = contentComparison?.video || { commission: 0, orders: 0, gmv: 0, gmvReal: 0, commissionReal: 0 };
          const live = contentComparison?.live || { commission: 0, orders: 0, gmv: 0, gmvReal: 0, commissionReal: 0 };
          
          const videoCommReal = video.commissionReal || 0;
          const liveCommReal = live.commissionReal || 0;
          const videoGmvReal = video.gmvReal || 0;
          const liveGmvReal = live.gmvReal || 0;

          const totalComm = videoCommReal + liveCommReal;
          const videoPercent = totalComm > 0 ? (videoCommReal / totalComm) * 100 : 50;
          const livePercent = 100 - videoPercent;

          return (
            <div className="space-y-6 pt-2">
              <div className="flex justify-between items-end mb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm font-bold text-text-main uppercase tracking-tight">Vídeo</span>
                  </div>
                  <p className="text-2xl font-black text-text-main leading-none">
                    {totalComm > 0 ? videoPercent.toFixed(1) : "0"}%
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-bold text-text-main uppercase tracking-tight">Live</span>
                    <div className="w-3 h-3 rounded-full bg-status-commission" />
                  </div>
                  <p className="text-2xl font-black text-text-main leading-none">
                    {totalComm > 0 ? livePercent.toFixed(1) : "0"}%
                  </p>
                </div>
              </div>

              <div className="relative h-3 w-full bg-background-secondary rounded-full overflow-hidden flex shadow-inner border border-border-main/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${videoPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-primary relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                </motion.div>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${livePercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-status-commission relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-l from-white/10 to-transparent" />
                </motion.div>
                
                {/* Center Divider/Indicator */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white/30 backdrop-blur-sm z-10 transition-all duration-1000"
                  style={{ left: `calc(${videoPercent}% - 0.5px)` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-8 pt-2 px-1">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Pedidos</p>
                    <p className="text-xl font-black text-text-main leading-none">{formatNumber(video.orders || 0)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">GMV Real</p>
                    <p className="text-base font-bold text-text-secondary leading-none">{formatCurrency(videoGmvReal)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Comissão Real</p>
                    <p className="text-base font-bold text-status-commission leading-none">{formatCurrency(videoCommReal)}</p>
                  </div>
                </div>
                <div className="space-y-4 text-right">
                  <div className="space-y-1">
                    <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Pedidos</p>
                    <p className="text-xl font-black text-text-main leading-none">{formatNumber(live.orders || 0)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">GMV Real</p>
                    <p className="text-base font-bold text-text-secondary leading-none">{formatCurrency(liveGmvReal)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">Comissão Real</p>
                    <p className="text-base font-bold text-status-commission leading-none">{formatCurrency(liveCommReal)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Top Products - Leaderboard Redesign */}
      <div className="bg-card p-6 rounded-[24px] border border-border-main shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-text-main text-lg tracking-tight">Produtos mais vendidos</h3>
            <p className="text-sm text-text-tertiary">Performance de elite do período</p>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-black shadow-sm ${
                i === 1 ? 'bg-amber-400 text-white z-30' : 
                i === 2 ? 'bg-slate-300 text-white z-20' : 
                'bg-orange-300 text-white z-10'
              }`}>
                {i}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {(() => {
            const products = (topProducts || []).slice(0, 3);
            const extendedProducts = (topProducts || []).slice(3, 10);
            const maxSold = products.length > 0 ? products[0].sold : 1;

            return (
              <>
                {/* Top 3 Elite */}
                {products.map((product: any, index: number) => (
                  <div key={product.id} className="relative group">
                    {/* Relative Progress Bar (Background) */}
                    <div className="absolute inset-0 bg-background-secondary/20 rounded-2xl overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(product.sold / maxSold) * 100}%` }}
                        transition={{ duration: 1.2, ease: "circOut", delay: index * 0.1 }}
                        className={`h-full opacity-10 ${
                          index === 0 ? 'bg-amber-500' : 
                          index === 1 ? 'bg-slate-400' : 
                          'bg-orange-500'
                        }`}
                      />
                    </div>

                    <div className="relative flex items-center p-4 rounded-2xl border border-transparent hover:border-border-main/50 hover:bg-white/50 transition-all duration-300">
                      {/* Rank Avatar */}
                      <div className="relative flex-shrink-0 mr-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shadow-sm transform transition-transform group-hover:scale-105 ${
                          index === 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                          index === 1 ? 'bg-slate-50 text-slate-500 border border-slate-100' : 
                          'bg-orange-50 text-orange-600 border border-orange-100'
                        }`}>
                          {index + 1}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                            <Medal size={10} className="text-white" />
                          </div>
                        )}
                      </div>

                      {/* Content Grid */}
                      <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center">
                        {/* Info */}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-text-main truncate mb-1 group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <Package size={12} className="text-text-tertiary" />
                            <span className="text-[11px] font-black text-text-secondary uppercase tracking-tight">
                              {formatNumber(product.sold)} <span className="text-text-tertiary font-medium lowercase">vendas</span>
                            </span>
                          </div>
                        </div>

                        {/* Financials */}
                        <div className="flex gap-4 sm:gap-6 items-center justify-end">
                          <div className="text-right">
                            <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest mb-0.5">GMV</p>
                            <p className="text-sm font-bold text-text-main tabular-nums tracking-tight whitespace-nowrap">
                              {formatCurrency(product.gmv)}
                            </p>
                          </div>
                          <div className="text-right min-w-[100px] bg-white/60 px-3 py-2 rounded-xl border border-border-main/30">
                            <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest mb-0.5">Comissão</p>
                            <p className="text-sm font-black text-status-commission tabular-nums tracking-tight whitespace-nowrap">
                              {formatCurrency(product.commission)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Expanded List (4-10) */}
                {showAllTopProducts && extendedProducts.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 space-y-2"
                  >
                    <div className="px-4 py-2 text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] border-b border-border-main/40 mb-2">
                      Ranking Complementar
                    </div>
                    {extendedProducts.map((product: any, idx: number) => {
                      const rank = idx + 4;
                      return (
                        <div key={product.id} className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-background-secondary/50 transition-all group border border-transparent hover:border-border-main/30">
                          <span className="w-6 text-xs font-black text-text-tertiary/60 group-hover:text-primary/70 transition-colors">{rank}</span>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-text-main truncate group-hover:text-primary transition-colors mb-0.5">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-text-secondary uppercase tracking-tighter">
                                {formatNumber(product.sold)} <span className="text-text-tertiary font-medium">vendas</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-right">
                            <div className="hidden sm:block">
                              <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest mb-0.5">GMV</p>
                              <p className="text-xs font-bold text-text-secondary tabular-nums">{formatCurrency(product.gmv)}</p>
                            </div>
                            <div className="min-w-[90px]">
                              <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest mb-0.5">Comissão</p>
                              <p className="text-sm font-black text-status-commission tabular-nums">{formatCurrency(product.commission)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {/* Toggle Button */}
                {(topProducts || []).length > 3 && (
                  <button 
                    onClick={() => setShowAllTopProducts(!showAllTopProducts)}
                    className="w-full py-3 mt-2 text-sm font-bold text-text-tertiary hover:text-primary hover:bg-primary/5 rounded-xl transition-all border border-dashed border-border-main hover:border-primary/30 flex items-center justify-center gap-2"
                  >
                    {showAllTopProducts ? 'Ver menos' : `Ver mais (${(topProducts || []).length - 3} produtos)`}
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
