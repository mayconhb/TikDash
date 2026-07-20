import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../config/app';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    if (name.length < 2) {
      toast.error('O nome deve ter no mínimo 2 caracteres.');
      return;
    }

    if (password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    if (!acceptTerms) {
      toast.error('Você deve aceitar os termos e a política de privacidade.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // The profile will be created by the AuthContext or a trigger in Supabase
        // But for safety in a quick demo, we can also ensure it here if we want.
        // Usually, a trigger is better.
        navigate('/onboarding');
      }
    } catch (error: any) {
      console.error(error);
      let message = 'Falha ao criar conta. Tente novamente.';
      if (error.message.includes('User already registered')) {
        message = 'Este e-mail já está em uso.';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background-main">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl italic shadow-lg mb-2">T</div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">Criar conta</h1>
          <p className="text-text-secondary">Junte-se ao TikDash hoje</p>
        </div>

        <div className="bg-card p-8 rounded-[18px] shadow-soft border border-border-main">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary ml-1">Nome completo</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-[46px] px-4 rounded-[12px] border border-border-main bg-background-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={loading}
              />
            </div>

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
              <label className="text-sm font-semibold text-text-secondary ml-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
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

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary ml-1">Confirmar senha</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-[46px] px-4 rounded-[12px] border border-border-main bg-background-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={loading}
              />
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-border-main text-primary focus:ring-primary"
              />
              <label htmlFor="terms" className="text-xs text-text-secondary leading-normal">
                Eu aceito os <Link to="/termos" className="text-primary font-medium hover:underline">Termos de Uso</Link> e a{' '}
                <Link to="/privacidade" className="text-primary font-medium hover:underline">Política de Privacidade</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] bg-primary hover:bg-primary-dark text-white font-bold rounded-[12px] transition-all flex items-center justify-center shadow-md active:scale-[0.98] mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Criar minha conta'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-main"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-text-tertiary font-medium">Ou</span>
            </div>
          </div>

          <p className="text-center text-sm text-text-secondary">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
