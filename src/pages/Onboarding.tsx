import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowRight, 
  ChevronRight, 
  FileSpreadsheet, 
  BarChart3, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STEPS = [
  {
    title: 'Bem-vindo ao TikDash',
    description: 'Aqui, sua planilha de pedidos se transforma em uma visão clara do seu negócio.',
    icon: Sparkles,
    color: 'bg-primary',
  },
  {
    title: 'Exporte sua planilha',
    description: 'Baixe o relatório de pedidos de afiliado dentro do TikTok Shop.',
    icon: FileSpreadsheet,
    color: 'bg-blue-500',
    list: [
      'Acesse seus pedidos de afiliado',
      'Escolha o período',
      'Exporte em Excel',
      'Envie o arquivo ao TikDash',
    ]
  },
  {
    title: 'Importe e analise',
    description: 'Seus dados serão organizados automaticamente em poucos segundos.',
    icon: BarChart3,
    color: 'bg-green-500',
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (user) {
        await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        await refreshProfile();
        navigate('/importacoes');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      await refreshProfile();
      navigate('/dashboard');
    }
  };

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background-main p-6">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full text-center space-y-8"
          >
            <div className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mx-auto shadow-lg text-white`}>
              <Icon size={40} />
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-text-main tracking-tight">{step.title}</h1>
              <p className="text-text-secondary leading-relaxed">{step.description}</p>
            </div>

            {step.list && (
              <div className="bg-card p-6 rounded-2xl border border-border-main text-left space-y-3 shadow-sm">
                {step.list.map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-primary-light rounded-full flex items-center justify-center text-primary text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm text-text-secondary font-medium">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="max-w-md mx-auto w-full space-y-6 pb-8">
        <div className="flex justify-center space-x-2">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-border-main'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleNext}
            className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl transition-all flex items-center justify-center shadow-lg active:scale-[0.98] group"
          >
            {currentStep === STEPS.length - 1 ? 'Começar agora' : 'Próximo'}
            <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex justify-between items-center px-2">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`text-sm font-medium transition-colors flex items-center ${
                currentStep === 0 ? 'text-transparent cursor-default' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <ArrowLeft size={16} className="mr-1" />
              Voltar
            </button>
            <button
              onClick={handleSkip}
              className="text-sm font-medium text-text-tertiary hover:text-primary transition-colors"
            >
              Fazer isso depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
