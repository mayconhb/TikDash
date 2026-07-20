import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Shield, 
  Trash2, 
  LogOut, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { APP_CONFIG } from '../config/app';

export default function Configuracoes() {
  const { profile, user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDeleteData = async () => {
    // In a real app, this would delete Firestore docs
    // For this MVP, we just show a toast
    toast.info('Funcionalidade em desenvolvimento.');
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-text-main tracking-tight">Configurações</h1>
        <p className="text-text-secondary text-sm">Gerencie seu perfil e preferências.</p>
      </div>

      {/* Profile Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest ml-1">Perfil</h3>
        <div className="bg-card rounded-[18px] border border-border-main shadow-soft divide-y divide-border-main">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-lg">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-text-main">{profile?.name}</p>
                <p className="text-xs text-text-tertiary">{user?.email}</p>
              </div>
            </div>
            <button className="text-xs font-bold text-primary hover:underline">Editar</button>
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest ml-1">Dados</h3>
        <div className="bg-card rounded-[18px] border border-border-main shadow-soft divide-y divide-border-main">
          <button 
            onClick={handleDeleteData}
            className="w-full p-5 flex items-center justify-between hover:bg-red-50/50 transition-colors text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                <Trash2 size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-text-main">Limpar todos os dados</p>
                <p className="text-[10px] text-text-tertiary font-medium">Exclui permanentemente todas as suas importações.</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-text-tertiary" />
          </button>
        </div>
      </section>

      {/* Account Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest ml-1">Conta</h3>
        <div className="bg-card rounded-[18px] border border-border-main shadow-soft divide-y divide-border-main">
          <button 
            onClick={() => signOut()}
            className="w-full p-5 flex items-center justify-between hover:bg-background-secondary transition-colors text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-background-secondary rounded-xl flex items-center justify-center text-text-secondary">
                <LogOut size={20} />
              </div>
              <p className="text-sm font-bold text-text-main">Sair da conta</p>
            </div>
            <ChevronRight size={18} className="text-text-tertiary" />
          </button>

          <button 
            className="w-full p-5 flex items-center justify-between hover:bg-red-50/50 transition-colors text-left"
          >
            <div className="flex items-center space-x-4 text-red-600">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <p className="text-sm font-bold">Excluir minha conta</p>
            </div>
            <ChevronRight size={18} className="text-text-tertiary" />
          </button>
        </div>
      </section>

      <div className="text-center space-y-4 pt-8">
        <div className="flex items-center justify-center space-x-2 text-text-tertiary">
          <Shield size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Sua privacidade é nossa prioridade</span>
        </div>
        <p className="text-[10px] text-text-tertiary leading-relaxed px-12">
          {APP_CONFIG.footer}
        </p>
      </div>
    </div>
  );
}
