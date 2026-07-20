import { Link } from 'react-router-dom';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function Offline() {
  return (
    <div className="min-h-screen bg-background-main flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-text-tertiary/10 rounded-full flex items-center justify-center text-text-tertiary mb-6">
        <WifiOff size={40} />
      </div>
      <h1 className="text-2xl font-bold text-text-main mb-2">Você está sem conexão</h1>
      <p className="text-text-secondary max-w-sm mb-8">
        Conecte-se à internet para atualizar seus dados ou importar uma planilha.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="flex items-center space-x-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-primary-dark transition-all"
      >
        <RefreshCw size={18} />
        <span>Tentar novamente</span>
      </button>
    </div>
  );
}
