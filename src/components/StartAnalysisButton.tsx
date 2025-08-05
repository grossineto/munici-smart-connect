import React from 'react';
import { Rocket, Loader2, Search, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StartAnalysisButtonProps {
  isLoading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  politician?: {
    nome: string;
    cidade: string;
  };
}

export function StartAnalysisButton({ 
  isLoading = false, 
  disabled = false, 
  onClick,
  politician 
}: StartAnalysisButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      size="lg"
      className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
          Coletando e Analisando...
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mr-3">
            <Search className="h-4 w-4" />
            <Brain className="h-4 w-4" />
          </div>
          {politician ? (
            <span>
              Iniciar Análise para {politician.nome}
            </span>
          ) : (
            <span>
              Iniciar Coleta e Análise
            </span>
          )}
          <Rocket className="h-5 w-5 ml-3" />
        </>
      )}
    </Button>
  );
}