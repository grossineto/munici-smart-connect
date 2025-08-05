import React from 'react';
import { Clock, TrendingUp, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Politician {
  nome: string;
  partido?: string;
  cidade: string;
  uf: string;
  cargo?: string;
}

interface RecentSuggestionsProps {
  onSelectPolitician: (politician: Politician) => void;
  className?: string;
}

export function RecentSuggestions({ onSelectPolitician, className = "" }: RecentSuggestionsProps) {
  // Função para obter logo do partido
  const getPartyLogo = (partido?: string) => {
    switch (partido?.toUpperCase()) {
      case 'MDB':
        return '/lovable-uploads/84ee407e-7a09-419b-8cc6-122b525ecb78.png';
      default:
        return null;
    }
  };

  // Principais cidades/prefeitos em destaque
  const featuredPoliticians: Politician[] = [
    {
      nome: "Ricardo Nunes",
      cargo: "Prefeito",
      partido: "MDB",
      cidade: "São Paulo",
      uf: "SP"
    },
    {
      nome: "Eduardo Paes",
      cargo: "Prefeito", 
      partido: "PSD",
      cidade: "Rio de Janeiro",
      uf: "RJ"
    },
    {
      nome: "João Campos",
      cargo: "Prefeito",
      partido: "PSB", 
      cidade: "Recife",
      uf: "PE"
    },
    {
      nome: "Bruno Reis",
      cargo: "Prefeito",
      partido: "União Brasil",
      cidade: "Salvador", 
      uf: "BA"
    }
  ];

  return (
    <Card className={`border-2 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Políticos em Destaque
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Principais políticos sendo monitorados
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {featuredPoliticians.map((politician, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full justify-start p-4 h-auto text-left hover:bg-muted/80 border border-transparent hover:border-muted-foreground/20 transition-all duration-200"
            onClick={() => onSelectPolitician(politician)}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {politician.nome}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {politician.cargo}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{politician.cidade}, {politician.uf}</span>
                  {politician.partido && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {getPartyLogo(politician.partido) && (
                          <img 
                            src={getPartyLogo(politician.partido)!} 
                            alt={`Logo ${politician.partido}`}
                            className="h-3 w-auto"
                          />
                        )}
                        <span>{politician.partido}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}