import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background-main p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8 bg-card p-8 md:p-12 rounded-[24px] shadow-soft border border-border-main">
        <Link to={-1 as any} className="inline-flex items-center text-sm font-bold text-primary hover:underline">
          <ArrowLeft size={16} className="mr-2" />
          Voltar
        </Link>

        <div className="flex items-center space-x-3 text-primary">
          <Shield size={32} />
          <h1 className="text-3xl font-bold tracking-tight">Política de Privacidade</h1>
        </div>

        <div className="prose prose-sm text-text-secondary space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-main">1. Coleta de Dados</h2>
            <p>
              O TikDash coleta apenas os dados necessários para o funcionamento do dashboard: seu nome, e-mail e os dados contidos nas planilhas de pedidos que você envia voluntariamente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-main">2. Processamento de Arquivos</h2>
            <p>
              Suas planilhas são processadas diretamente no seu navegador. Os dados extraídos são enviados de forma segura para nossos servidores (Firebase) para persistência e análise. O arquivo original não é armazenado em nossos servidores.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-main">3. Uso de Dados</h2>
            <p>
              Utilizamos seus dados exclusivamente para gerar os relatórios e dashboards que você visualiza no aplicativo. Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins publicitários.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-main">4. Exclusão de Dados</h2>
            <p>
              Você pode solicitar a exclusão de todos os seus dados e de sua conta a qualquer momento através das configurações do aplicativo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-main">5. Vínculo com Terceiros</h2>
            <p>
              O TikDash é uma ferramenta independente e não possui qualquer vínculo oficial, parceria ou afiliação com o TikTok ou TikTok Shop.
            </p>
          </section>

          <footer className="pt-8 text-[10px] text-text-tertiary border-t border-border-main">
            Última atualização: 20 de Julho de 2026.
          </footer>
        </div>
      </div>
    </div>
  );
}
