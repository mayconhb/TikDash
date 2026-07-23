import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Package, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  DollarSign, 
  ArrowRight,
  Info,
  Calendar
} from 'lucide-react';
import { useProductSearch, useProductAnalytics } from '../hooks/useDashboard';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { usePeriodFilter } from '../contexts/PeriodFilterContext';
import { PeriodFilter } from '../components/filters/PeriodFilter';

interface StatusCardProps {
  label: string;
  count: number;
  gmv: number;
  commission: number;
  icon: any;
  color: string;
}

function StatusCard({ label, count, gmv, commission, icon: Icon, color }: StatusCardProps) {
  return (
    <div className="bg-card p-4 rounded-2xl border border-border-main shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${color} bg-opacity-10 text-current`}>
          <Icon size={16} />
        </div>
        <span className="text-xs font-black text-text-tertiary uppercase tracking-wider">{label}</span>
      </div>
      
      <div className="space-y-1">
        <p className="text-xl font-black text-text-main tabular-nums">{count}</p>
        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-tight">Pedidos</p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-main/50">
        <div>
          <p className="text-[9px] text-text-tertiary font-bold uppercase mb-0.5">GMV</p>
          <p className="text-xs font-bold text-text-secondary tabular-nums">{formatCurrency(gmv)}</p>
        </div>
        <div>
          <p className="text-[9px] text-text-tertiary font-bold uppercase mb-0.5">Comissão</p>
          <p className="text-xs font-bold text-text-main tabular-nums">{formatCurrency(commission)}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProductSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { period } = usePeriodFilter();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: suggestions, isLoading: searching } = useProductSearch(debouncedQuery);
  const { data: analytics, isLoading: loadingAnalytics, isError: hasError } = useProductAnalytics(selectedProducts);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleProduct = (name: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(name)) return prev.filter(p => p !== name);
      return [...prev, name];
    });
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const removeProduct = (name: string) => {
    setSelectedProducts(prev => prev.filter(p => p !== name));
  };

  const clearAll = () => {
    setSelectedProducts([]);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Period Filter */}
      <PeriodFilter />

      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-text-main tracking-tight">Pesquisa de Produtos</h1>
            <p className="text-text-secondary text-sm">Selecione um ou mais produtos para análise combinada</p>
          </div>
          {selectedProducts.length > 0 && (
            <button 
              onClick={clearAll}
              className="text-[11px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Limpar Tudo
            </button>
          )}
        </div>

        <div className="relative" ref={suggestionsRef}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={20} className="text-text-tertiary group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Digite para adicionar produtos..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-card border border-border-main rounded-[20px] py-4 pl-12 pr-4 text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searching && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Autocomplete Suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-50 left-0 right-0 mt-2 bg-card border border-border-main rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto"
              >
                {suggestions.map((name: any, index: number) => {
                  const isSelected = selectedProducts.includes(name);
                  return (
                    <button
                      key={index}
                      onClick={() => handleToggleProduct(name)}
                      className={`w-full text-left px-4 py-3.5 flex items-center gap-3 border-b border-border-main last:border-0 transition-colors ${
                        isSelected ? 'bg-primary/5 text-primary' : 'hover:bg-background-secondary text-text-main'
                      }`}
                    >
                      <div className={`p-1 rounded-md ${isSelected ? 'bg-primary text-white' : 'bg-background-secondary text-text-tertiary'}`}>
                        <Package size={14} />
                      </div>
                      <span className="text-sm font-semibold flex-1 truncate">{name}</span>
                      {isSelected ? (
                        <CheckCircle2 size={16} className="text-primary" />
                      ) : (
                        <ArrowRight size={14} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected Items Chips */}
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map((name) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              key={name}
              className="bg-white border border-border-main rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm group"
            >
              <Package size={12} className="text-primary" />
              <span className="text-xs font-bold text-text-main max-w-[200px] truncate">{name}</span>
              <button 
                onClick={() => removeProduct(name)}
                className="text-text-tertiary hover:text-rose-500 transition-colors"
              >
                <XCircle size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Results Content */}
      <AnimatePresence mode="wait">
        {selectedProducts.length > 0 && analytics ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary Title */}
            <div className="bg-background-secondary/30 px-4 py-2 rounded-xl border border-border-main/50 flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                Análise agregada de {selectedProducts.length} {selectedProducts.length === 1 ? 'produto' : 'produtos'}
              </p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary p-6 rounded-[24px] text-white shadow-lg shadow-primary/20 flex flex-col justify-between h-32">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80">Total de Pedidos</p>
                <div className="flex items-end justify-between">
                  <h2 className="text-4xl font-black tracking-tight tabular-nums">{formatNumber(analytics.totalOrders as any)}</h2>
                  <TrendingUp size={24} className="opacity-40" />
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-[24px] border border-border-main shadow-sm flex flex-col justify-between h-32">
                <p className="text-[11px] font-black text-text-tertiary uppercase tracking-[0.2em]">GMV Real Total</p>
                <div className="flex items-end justify-between">
                  <h2 className="text-2xl font-black text-text-main tracking-tight tabular-nums">{formatCurrency(analytics.totalGmvReal as any)}</h2>
                  <DollarSign size={20} className="text-text-tertiary opacity-40" />
                </div>
              </div>

              <div className="bg-card p-6 rounded-[24px] border border-border-main shadow-sm flex flex-col justify-between h-32">
                <p className="text-[11px] font-black text-text-tertiary uppercase tracking-[0.2em]">Comissão Real Total</p>
                <div className="flex items-end justify-between">
                  <h2 className="text-2xl font-black text-status-commission tracking-tight tabular-nums">{formatCurrency(analytics.totalCommissionReal as any)}</h2>
                  <CheckCircle2 size={20} className="text-status-commission opacity-40" />
                </div>
              </div>
            </div>

            {/* Cancellation Rate Card */}
            <div className="bg-card p-5 rounded-2xl border border-border-main shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <h3 className="text-[14px] font-bold text-text-tertiary uppercase tracking-widest leading-none mb-1.5">Taxa de Cancelamento Combinada</h3>
                  <p className="text-[14px] text-text-secondary font-medium leading-tight">Média ponderada dos produtos selecionados</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-text-main leading-none">
                    {(() => {
                      const total = analytics.settled.count + analytics.pending.count + analytics.awaiting_payment.count + analytics.ineligible.count;
                      const lost = analytics.ineligible.count + analytics.awaiting_payment.count;
                      return total > 0 ? ((lost / total) * 100).toFixed(1) : "0.0";
                    })()}%
                  </span>
                </div>
              </div>
            </div>

            {/* Status Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatusCard 
                label="Liquidados" 
                count={analytics.settled.count} 
                gmv={analytics.settled.gmv} 
                commission={analytics.settled.commission} 
                icon={CheckCircle2} 
                color="text-emerald-500" 
              />
              <StatusCard 
                label="Pendentes" 
                count={analytics.pending.count} 
                gmv={analytics.pending.gmv} 
                commission={analytics.pending.commission} 
                icon={Clock} 
                color="text-amber-500" 
              />
              <StatusCard 
                label="Aguardando" 
                count={analytics.awaiting_payment.count} 
                gmv={analytics.awaiting_payment.gmv} 
                commission={analytics.awaiting_payment.commission} 
                icon={Info} 
                color="text-blue-500" 
              />
              <StatusCard 
                label="Inelegíveis" 
                count={analytics.ineligible.count} 
                gmv={analytics.ineligible.gmv} 
                commission={analytics.ineligible.commission} 
                icon={XCircle} 
                color="text-rose-500" 
              />
            </div>

            {/* Real vs Potential Note */}
            <div className="bg-background-secondary/50 p-4 rounded-2xl border border-dashed border-border-main flex items-start gap-3">
              <Info size={18} className="text-text-tertiary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary leading-relaxed">
                <span className="font-bold">Informação:</span> O GMV e Comissão "Real" consideram apenas os pedidos com status <span className="font-bold text-emerald-600">Liquidado</span> ou <span className="font-bold text-amber-600">Pendente</span>. Pedidos aguardando pagamento ou inelegíveis não são contabilizados nos totais reais.
              </p>
            </div>
          </motion.div>
        ) : hasError ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
              <XCircle size={32} />
            </div>
            <div className="max-w-xs">
              <p className="text-text-main font-bold">Erro ao carregar dados</p>
              <p className="text-text-tertiary text-sm">Ocorreu um problema ao processar a análise dos produtos selecionados. Tente novamente.</p>
            </div>
          </div>
        ) : selectedProducts.length > 0 && loadingAnalytics ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-text-tertiary font-bold uppercase tracking-[0.2em] text-xs">Agregando dados de {selectedProducts.length} produtos...</p>
          </div>
        ) : selectedProducts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center text-text-tertiary">
              <Search size={32} />
            </div>
            <div className="max-w-xs">
              <p className="text-text-main font-bold">Inicie sua pesquisa</p>
              <p className="text-text-tertiary text-sm">Digite o nome de um produto e selecione-o para ver o detalhamento individual ou combinado.</p>
            </div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
