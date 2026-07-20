import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background-main p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8 bg-card p-8 md:p-12 rounded-[24px] shadow-soft border border-border-main">
        <Link to={-1 as any} className="inline-flex items-center text-sm font-bold text-primary hover:underline">
          <ArrowLeft size={16} className="mr-2" />
          Voltar
        </Link>

        <div className="flex items-center space-x-3 text-primary">
          <FileText size={32} />
          <h1 className="text-3xl font-bold tracking-tight">Termos de Uso</h1>
        </div>

        <div className="prose prose-sm text-text-secondary space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-main">1. Aceitação dos Termos</h2>
            <p>
              Ao utilizar o TikDash, você concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-main">2. Uso do Serviço</h2>
            <p>
              O TikDash fornece uma ferramenta de análise para afiliados do TikTok Shop. Você é o único responsável pela precisão das planilhas enviadas e pelo uso das informações geradas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-main">3. Limitação de Responsabilidade</h2>
            <p>
              Os dados apresentados são estimativas baseadas em planilhas exportadas. O TikDash não se responsabiliza por eventuais divergências financeiras entre o dashboard e os valores reais pagos pelo TikTok Shop.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-text-main">4. Independência</h2>
            <p>
              Você reconhece que o TikDash não é um produto oficial do TikTok e que o uso desta ferramenta é de sua inteira responsabilidade.
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
