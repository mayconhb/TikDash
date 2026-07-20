import { 
  useContentTypeComparison, 
  useTrafficSourceComparison, 
  useTopProducts,
  useDashboardSummary
} from '../hooks/useDashboard';
import { PeriodFilter } from '../components/filters/PeriodFilter';
import { 
  Package, 
  Medal
} from 'lucide-react';
import { 
  formatCurrency
} from '../utils/formatters';

export default function Analises() {
  const { data: summary, isLoading: summaryLoading, isFetching: summaryFetching } = useDashboardSummary();
  const { data: contentComparison, isLoading: contentLoading, isFetching: contentFetching } = useContentTypeComparison();
  const { data: trafficComparison, isLoading: trafficLoading, isFetching: trafficFetching } = useTrafficSourceComparison();
  const { data: topProducts, isLoading: topProductsLoading, isFetching: topProductsFetching } = useTopProducts();

  const loading = summaryLoading || contentLoading || trafficLoading || topProductsLoading;
  const isFetching = summaryFetching || contentFetching || trafficFetching || topProductsFetching;

  if (loading && !summary) {
    return <div className="animate-pulse space-y-8"><div className="h-40 bg-card rounded-2xl"></div></div>;
  }

  return (
    <div className="space-y-8 relative">
      {/* Background Fetching Indicator */}
      {isFetching && !loading && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1">
          <div className="h-full bg-primary animate-[loading_1s_ease-in-out_infinite] origin-left"></div>
        </div>
      )}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-main tracking-tight">Análises</h1>
        <p className="text-text-secondary text-sm">Mergulhe nos detalhes do seu desempenho.</p>
      </div>

      {/* Period Filter */}
      <PeriodFilter />

      {/* Video vs Live */}
      <div className="bg-card p-6 rounded-[18px] border border-border-main shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-main">Vídeo vs Live</h3>
          <span className="text-[10px] bg-background-secondary px-2 py-1 rounded-full font-bold text-text-tertiary uppercase">Comparativo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(contentComparison || {}).map(([type, stats]: [string, any]) => (
            <div key={type} className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold capitalize text-text-secondary">{type}</span>
                <span className="text-xs font-medium text-text-tertiary">{stats.orders} pedidos</span>
              </div>
              <div className="w-full h-2 bg-background-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full ${type === 'video' ? 'bg-primary' : type === 'live' ? 'bg-status-commission' : 'bg-text-tertiary'}`} 
                  style={{ width: `${summary.gmvTotal > 0 ? (stats.gmv / summary.gmvTotal) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-text-main">{formatCurrency(stats.gmv)} GMV</span>
                <span className="font-bold text-status-commission">{formatCurrency(stats.commission)} Comissão</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Traffic Source */}
      <div className="bg-card p-6 rounded-[18px] border border-border-main shadow-soft space-y-6">
        <h3 className="font-bold text-text-main">Orgânico vs Anúncios</h3>
        <div className="space-y-6">
          {Object.entries(trafficComparison || {}).map(([source, stats]: [string, any]) => (
            <div key={source} className="flex items-center space-x-4">
              <div className="w-24 text-xs font-bold text-text-secondary capitalize">
                {source === 'shop_ads' ? 'Anúncios' : source === 'organic' ? 'Orgânico' : 'Outros'}
              </div>
              <div className="flex-1 h-3 bg-background-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full ${source === 'shop_ads' ? 'bg-status-awaiting' : source === 'organic' ? 'bg-status-settled' : 'bg-text-tertiary'}`} 
                  style={{ width: `${summary.gmvTotal > 0 ? (stats.gmv / summary.gmvTotal) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="w-24 text-right text-xs font-bold text-text-main">
                {summary.gmvTotal > 0 ? ((stats.gmv / summary.gmvTotal) * 100).toFixed(1) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>

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
                <p className="text-sm font-bold text-text-main line-clamp-2 leading-tight h-10">{product.name}</p>
                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">{product.sold} unidades vendidas</p>
              </div>
              <div className="pt-3 border-t border-border-main flex justify-between">
                <div>
                  <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">GMV</p>
                  <p className="text-sm font-bold text-text-main">{formatCurrency(product.gmv)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">Comissão</p>
                  <p className="text-sm font-bold text-status-commission">{formatCurrency(product.commission)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
