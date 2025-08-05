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
      className="w-full h-12 text-sm font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <div className="flex items-center justify-center gap-3 w-full">
        {isLoading ? (
          <>
            <div className="relative">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <span className="font-medium">
              Coletando e Analisando...
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
              <Brain className="h-4 w-4 transition-transform group-hover:scale-110" />
            </div>
            <span className="flex-1 text-center font-medium">
              {politician ? (
                `Iniciar Análise para ${politician.nome}`
              ) : (
                "Iniciar Coleta e Análise"
              )}
            </span>
            <Rocket className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:translate-x-1" />
          </>
        )}
      </div>
    </Button>
  );
}