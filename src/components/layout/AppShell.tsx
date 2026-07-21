import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ChartNoAxesCombined, 
  FileUp, 
  UserRound,
  LogOut,
  Settings,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { APP_CONFIG } from '../../config/app';

interface NavItemProps {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
}

function MobileNavItem({ to, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
        active ? 'text-primary' : 'text-text-tertiary'
      }`}
    >
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[11px] font-medium leading-none">{label}</span>
    </Link>
  );
}

function DesktopNavItem({ to, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link 
      to={to} 
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-primary/10 text-primary font-semibold' 
          : 'text-text-secondary hover:bg-background-secondary'
      }`}
    >
      <Icon size={20} />
      <span className="text-base">{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Início' },
    { to: '/relatorio-diario', icon: CalendarDays, label: 'Diário' },
    { to: '/importacoes', icon: FileUp, label: 'Importações' },
    { to: '/configuracoes', icon: Settings, label: 'Conta' },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background-main flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[248px] bg-card border-r border-border-main sticky top-0 h-screen p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-10 px-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold italic">T</div>
          <span className="text-xl font-bold tracking-tight">{APP_CONFIG.name}</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <DesktopNavItem 
              key={item.to} 
              {...item} 
              active={currentPath === item.to} 
            />
          ))}
        </nav>

        <div className="pt-6 border-t border-border-main space-y-4">
          <div className="px-2">
            <p className="text-base font-semibold text-text-main truncate">{profile?.name || 'Usuário'}</p>
            <p className="text-sm text-text-tertiary truncate">{profile?.id.substring(0, 8)}...</p>
          </div>
          <button 
            onClick={() => signOut()}
            className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-base font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-[68px] md:pb-0 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 bg-card border-b border-border-main sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs italic">T</div>
            <span className="text-xl font-bold tracking-tight">{APP_CONFIG.name}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-xs">
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>

        <footer className="mt-auto p-4 text-center text-[12px] text-text-tertiary md:px-8 max-w-7xl mx-auto w-full">
          {APP_CONFIG.footer}
        </footer>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-card border-t border-border-main flex items-center justify-around z-20 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <MobileNavItem 
            key={item.to} 
            {...item} 
            active={currentPath === item.to} 
          />
        ))}
      </nav>
    </div>
  );
}
