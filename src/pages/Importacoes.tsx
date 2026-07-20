import { useState, useEffect } from 'react';
import { 
  FileUp, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { demoStorage } from '../lib/demo-storage';
import { ImportRecord } from '../types';
import { processSpreadsheet } from '../lib/spreadsheet/service';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { toast } from 'sonner';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export default function Importacoes() {
  const { user } = useAuth();
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ progress: 0, message: '' });

  useEffect(() => {
    if (!user) return;

    const isDemo = user.id === DEMO_USER_ID;

    const fetchImports = async () => {
      if (isDemo) {
        setImports(demoStorage.getImports());
        return;
      }

      const { data, error } = await supabase
        .from('imports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching imports:', error);
      } else {
        setImports(data as unknown as ImportRecord[]);
      }
    };

    fetchImports();

    if (!isDemo) {
      // Real-time subscription only for non-demo
      const channel = supabase
        .channel('imports-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'imports',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchImports();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Por favor, envie um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 25MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ progress: 0, message: 'Iniciando...' });

    try {
      await processSpreadsheet(file, user.id, (progress, message) => {
        setUploadProgress({ progress, message });
      });
      toast.success('Importação concluída com sucesso!');
      
      if (user.id === DEMO_USER_ID) {
        setImports(demoStorage.getImports());
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao processar planilha.');
    } finally {
      setIsUploading(false);
      setUploadProgress({ progress: 0, message: '' });
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Importações</h1>
          <p className="text-text-secondary text-base">Gerencie suas planilhas do TikTok Shop.</p>
        </div>
        <label className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold shadow-md cursor-pointer transition-all active:scale-[0.98] flex items-center space-x-2">
          <FileUp size={20} />
          <span>Nova importação</span>
          <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={isUploading} />
        </label>
      </div>

      {isUploading && (
        <div className="bg-card p-8 rounded-[18px] border border-primary/30 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary animate-pulse">
                <FileSpreadsheet size={24} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-text-main">{uploadProgress.message}</p>
                <p className="text-sm text-text-secondary">Processando planilha... Não feche esta página.</p>
              </div>
            </div>
            <span className="text-xl font-black text-primary">{uploadProgress.progress}%</span>
          </div>
          <div className="w-full h-3 bg-background-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${uploadProgress.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-text-secondary text-sm uppercase tracking-widest ml-1">Histórico de importações</h3>
        
        {imports.length === 0 ? (
          <div className="bg-card p-12 rounded-[18px] border border-dashed border-border-main flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center text-text-tertiary">
              <FileSpreadsheet size={32} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-text-main">Nenhuma planilha importada</p>
              <p className="text-base text-text-secondary max-w-xs">Seus dados aparecerão aqui assim que você realizar sua primeira importação.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {imports.map((item) => (
              <div key={item.id} className="bg-card p-5 rounded-[18px] border border-border-main shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/20 transition-all">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    item.status === 'completed' || item.status === 'completed_with_warnings' 
                      ? 'bg-status-settled-light text-status-settled' 
                      : item.status === 'failed' ? 'bg-status-ineligible-light text-status-ineligible' : 'bg-status-awaiting-light text-status-awaiting'
                  }`}>
                    {item.status === 'completed' || item.status === 'completed_with_warnings' ? <CheckCircle2 size={24} /> : item.status === 'failed' ? <AlertCircle size={24} /> : <Loader2 className="animate-spin" size={24} />}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-text-main truncate pr-2">{item.original_filename}</p>
                    <div className="flex items-center space-x-2 text-[12px] text-text-tertiary font-bold uppercase tracking-wider">
                      <span className="flex items-center"><Clock size={14} className="mr-1" /> {formatDateTime(item.created_at)}</span>
                      <span>•</span>
                      <span>{item.inserted_rows} linhas</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8">
                  <div className="space-y-0.5">
                    <p className="text-[12px] text-text-tertiary font-bold uppercase tracking-wider">GMV Total</p>
                    <p className="text-base font-bold text-text-main">{formatCurrency(item.gmv_total)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[12px] text-text-tertiary font-bold uppercase tracking-wider">Comissão</p>
                    <p className="text-base font-bold text-text-main">{formatCurrency(item.estimated_commission_total)}</p>
                  </div>
                  <ChevronRight size={20} className="hidden md:block text-text-tertiary group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
