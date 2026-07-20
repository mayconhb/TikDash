import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONFIG } from '../config/app';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      let message = 'Falha ao entrar. Verifique suas credenciais.';
      if (error.message.includes('Invalid login credentials')) {
        message = 'E-mail ou senha incorretos.';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    toast.success('Entrando como administrador de demonstração...');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background-main">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl italic shadow-lg mb-2">T</div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">Bem-vindo de volta</h1>
          <p className="text-text-secondary">Entre para acompanhar seus resultados</p>
        </div>

        <div className="bg-card p-8 rounded-[18px] shadow-soft border border-border-main">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary ml-1">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[46px] px-4 rounded-[12px] border border-border-main bg-background-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-text-secondary">Senha</label>
                <Link to="/recuperar-senha" title="Esqueci minha senha" className="text-xs font-medium text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[46px] px-4 pr-12 rounded-[12px] border border-border-main bg-background-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                  title={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] bg-primary hover:bg-primary-dark text-white font-bold rounded-[12px] transition-all flex items-center justify-center shadow-md active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full h-[46px] bg-secondary hover:bg-secondary-dark text-white font-bold rounded-[12px] transition-all flex items-center justify-center shadow-md active:scale-[0.98] border-2 border-primary/20"
            >
              <ShieldCheck className="mr-2" size={20} />
              Acesso Rápido (Demo Admin)
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-main"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-text-tertiary font-medium">Ou</span>
            </div>
          </div>

          <p className="text-center text-sm text-text-secondary">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-primary font-bold hover:underline">
              Criar conta
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-text-tertiary px-8">
          {APP_CONFIG.footer}
        </p>
      </div>
    </div>
  );
}
