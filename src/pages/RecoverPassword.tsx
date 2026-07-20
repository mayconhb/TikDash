import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor, informe seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('E-mail de recuperação enviado!');
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao enviar e-mail. Verifique se o e-mail está correto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background-main text-center">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="bg-card p-8 rounded-[18px] shadow-soft border border-border-main space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
            <Mail size={32} />
          </div>

          {!sent ? (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-text-main">Recuperar senha</h1>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Informe o e-mail associado à sua conta e enviaremos um link para você criar uma nova senha.
                </p>
              </div>

              <form onSubmit={handleRecover} className="space-y-4">
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[46px] px-4 rounded-[12px] border border-border-main bg-background-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-center"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[46px] bg-primary hover:bg-primary-dark text-white font-bold rounded-[12px] transition-all flex items-center justify-center"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar link'}
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-text-main">Verifique seu e-mail</h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Enviamos as instruções de recuperação para <strong>{email}</strong>. 
                  Verifique também sua pasta de spam.
                </p>
              </div>
              <button 
                onClick={() => setSent(false)}
                className="text-primary font-bold text-sm hover:underline"
              >
                Tentar outro e-mail
              </button>
            </div>
          )}

          <Link to="/login" className="flex items-center justify-center text-sm font-medium text-text-tertiary hover:text-text-secondary transition-colors pt-2">
            <ArrowLeft size={16} className="mr-2" />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
