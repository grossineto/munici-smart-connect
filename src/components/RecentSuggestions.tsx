import React from 'react';
import { Clock, TrendingUp, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
      case 'PSD':
        return '/lovable-uploads/0db47da6-761a-4a1d-abff-33cd9d18d944.png';
      case 'PSB':
        return '/lovable-uploads/c1fc5a33-93d2-4978-b974-59917be945e0.png';
      case 'UNIÃO BRASIL':
      case 'UNIAO BRASIL':
        return '/lovable-uploads/80af8899-6d4a-4e09-9727-942aefbfc911.png';
      case 'PV':
      case 'PARTIDO VERDE':
        return '/lovable-uploads/c3695bb8-feda-48d4-beff-f390ac899551.png';
      case 'REPUBLICANOS':
        return '/lovable-uploads/5459eeca-7b7d-463c-b793-35eba82ba4f3.png';
      default:
        return null;
    }
  };

  // Função para obter avatar do político
  const getPoliticianAvatar = (nome: string) => {
    switch (nome) {
      case 'Ricardo Nunes':
        return '/lovable-uploads/6f653b9a-a318-4b80-955c-4f7b4de6634c.png';
      case 'João Campos':
        return '/lovable-uploads/990eb197-9e97-4050-9ad7-41f0539e7ba8.png';
      case 'José Sarto':
        return '/lovable-uploads/f6d35a9d-205a-4556-ac06-3f9fbd151298.png';
      case 'Tarcísio Gomes de Freitas':
        return '/lovable-uploads/9c090c37-0d6e-4699-9cc5-028de5640b9a.png';
      case 'Guto Issa':
        return '/lovable-uploads/dc683cc5-b8bf-4311-9698-3337b29889e5.png';
      case 'Suéllen Silva Rosim':
        return '/lovable-uploads/425f80f3-21ac-4eef-984d-ba432848be17.png';
      default:
        return undefined;
    }
  };

  // Principais políticos em destaque (os 6 cadastrados)
  const featuredPoliticians: Politician[] = [
    {
      nome: "Ricardo Nunes",
      cargo: "Prefeito",
      partido: "MDB",
      cidade: "São Paulo",
      uf: "SP"
    },
    {
      nome: "João Campos",
      cargo: "Prefeito",
      partido: "PSB",
      cidade: "Recife",
      uf: "PE"
    },
    {
      nome: "José Sarto",
      cargo: "Prefeito",
      partido: "UNIÃO BRASIL",
      cidade: "Fortaleza",
      uf: "CE"
    },
    {
      nome: "Tarcísio Gomes de Freitas",
      cargo: "Governador",
      partido: "REPUBLICANOS", 
      cidade: "São Paulo",
      uf: "SP"
    },
    {
      nome: "Guto Issa",
      cargo: "Prefeito",
      partido: "PV",
      cidade: "São Roque",
      uf: "SP"
    },
    {
      nome: "Suéllen Silva Rosim",
      cargo: "Prefeita",
      partido: "REPUBLICANOS",
      cidade: "Bauru",
      uf: "SP"
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
                <Avatar className="w-10 h-10 border border-muted">
                  <AvatarImage 
                    src={getPoliticianAvatar(politician.nome)} 
                    alt={`Foto de ${politician.nome}`}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {politician.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
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