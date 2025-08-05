import React, { useState, useEffect } from 'react';
import { Search, Brain, Rocket, Database, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Politician {
  nome: string;
  partido?: string;
  cidade: string;
  uf: string;
  cargo?: string;
}

interface AnalysisStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: number;
}

interface StartAnalysisButtonProps {
  politician?: Politician;
  onClick: () => void;
  disabled?: boolean;
}

export function StartAnalysisButton({ politician, onClick, disabled = false }: StartAnalysisButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const analysisSteps: AnalysisStep[] = [
    {
      id: 'collecting',
      label: 'Coletando notícias...',
      icon: Database,
      duration: 3000
    },
    {
      id: 'analyzing', 
      label: 'Analisando sentimento...',
      icon: Brain,
      duration: 4000
    },
    {
      id: 'generating',
      label: 'Gerando relatório...',
      icon: TrendingUp,
      duration: 2000
    },
    {
      id: 'complete',
      label: 'Análise concluída!',
      icon: Rocket,
      duration: 1000
    }
  ];

  const startAnalysis = async () => {
    setIsLoading(true);
    setCurrentStep(0);
    setProgress(0);

    for (let i = 0; i < analysisSteps.length; i++) {
      setCurrentStep(i);
      
      // Simular progresso suave durante cada etapa
      const step = analysisSteps[i];
      const stepProgress = (i / analysisSteps.length) * 100;
      const nextStepProgress = ((i + 1) / analysisSteps.length) * 100;
      
      // Animar progresso gradualmente
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const increment = (nextStepProgress - stepProgress) / (step.duration / 100);
          const newProgress = prev + increment;
          
          if (newProgress >= nextStepProgress) {
            clearInterval(progressInterval);
            return nextStepProgress;
          }
          return newProgress;
        });
      }, 100);

      // Aguardar duração da etapa
      await new Promise(resolve => setTimeout(resolve, step.duration));
      clearInterval(progressInterval);
      setProgress(nextStepProgress);
    }

    // Finalizar análise
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
      setCurrentStep(0);
      onClick();
    }, 500);
  };

  const currentStepData = analysisSteps[currentStep];
  const CurrentIcon = currentStepData?.icon || Search;

  return (
    <div className="w-full space-y-3">
      <Button
        onClick={startAnalysis}
        disabled={disabled || isLoading}
        size="lg"
        className="w-full h-14 text-base font-semibold gradient-primary hover:opacity-90 text-primary-foreground border-0 rounded-xl shadow-institutional hover:shadow-card transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <div className="flex items-center justify-center gap-3 w-full">
          {isLoading ? (
            <>
              <div className="relative">
                <CurrentIcon className="h-5 w-5 animate-pulse" />
              </div>
              <span className="font-semibold text-institutional">
                {currentStepData?.label || "Processando..."}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 transition-transform group-hover:scale-110" />
                <Brain className="h-5 w-5 transition-transform group-hover:scale-110" />
              </div>
              <span className="flex-1 text-center font-semibold text-institutional">
                {politician ? (
                  <>Iniciar Análise para {politician.nome}</>
                ) : (
                  "Iniciar Coleta e Análise"
                )}
              </span>
              <Rocket className="h-5 w-5 transition-transform group-hover:scale-110 group-hover:translate-x-1" />
            </>
          )}
        </div>
      </Button>

      {/* Barra de Progresso e Status */}
      {isLoading && (
        <div className="space-y-2">
          <Progress 
            value={progress} 
            className="h-2 shadow-subtle" 
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CurrentIcon className="h-3 w-3" />
              <span className="text-institutional">
                Etapa {currentStep + 1} de {analysisSteps.length}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {Math.round(progress)}%
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}