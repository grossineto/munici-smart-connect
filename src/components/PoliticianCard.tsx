import React from 'react';
import { User, MapPin, Calendar, Shield, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Politician {
  nome: string;
  partido?: string;
  mandato?: string;
  cidade: string;
  uf: string;
  cargo?: string;
  avatar?: string;
}

interface PoliticianCardProps {
  politician: Politician;
  className?: string;
}

export function PoliticianCard({ politician, className = "" }: PoliticianCardProps) {
  const getCargoIcon = (cargo?: string) => {
    switch (cargo?.toLowerCase()) {
      case 'prefeito':
      case 'prefeita':
        return <Crown className="h-4 w-4" />;
      case 'governador':
      case 'governadora':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getCargoColor = (cargo?: string) => {
    switch (cargo?.toLowerCase()) {
      case 'prefeito':
      case 'prefeita':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'governador':
      case 'governadora':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Avatar do político vem do PoliticiansContext (página de gerenciamento)
  // Usamos politician.avatar diretamente, com fallback para iniciais.

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

  return (
    <Card className={`border-2 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-16 w-16 border-2 border-muted">
            <AvatarImage 
              src={politician.avatar}
              alt={`Foto de ${politician.nome}`}
            />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {politician.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          {/* Informações */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg leading-tight text-foreground">
                {politician.nome}
              </h3>
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1 text-xs font-medium ${getCargoColor(politician.cargo)}`}
              >
                {getCargoIcon(politician.cargo)}
                {politician.cargo || 'Político'}
              </Badge>
            </div>

            {/* Localização */}
            <div className="flex items-center gap-1 mt-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                {politician.cidade}, {politician.uf}
              </span>
            </div>

            {/* Informações adicionais */}
            <div className="flex items-center gap-3 mt-3">
              {politician.mandato && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Mandato {politician.mandato}</span>
                </div>
              )}
              
              {politician.partido && (
                <div className="flex items-center gap-2">
                  {getPartyLogo(politician.partido) && (
                    <img 
                      src={getPartyLogo(politician.partido)!} 
                      alt={`Logo ${politician.partido}`}
                      className="h-6 w-auto"
                    />
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {politician.partido}
                  </Badge>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="mt-3">
              <Badge 
                className="bg-green-500/10 text-green-700 border-green-200 text-xs font-medium"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Mandato Ativo
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}