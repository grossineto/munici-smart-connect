import React from 'react';
import { User, MapPin, Calendar, Shield, Crown, X, Eye, Hash, TrendingUp, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { KeywordManager } from '@/components/KeywordManager';

interface Politician {
  nome: string;
  partido?: string;
  mandato?: string;
  cidade: string;
  uf: string;
  cargo?: string;
  avatar?: string;
  addedAt?: string;
  isActive?: boolean;
  newsCount?: number;
}

interface SocialPoliticianCardProps {
  politician: Politician;
  onRemove?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  showKeywords?: boolean;
  className?: string;
}

export function SocialPoliticianCard({ 
  politician, 
  onRemove,
  onSelect,
  isSelected = false,
  showKeywords = false,
  className = "" 
}: SocialPoliticianCardProps) {
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
        return politician.avatar;
    }
  };

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
    <Card 
      className={`border-2 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      } ${className}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12 border-2 border-muted flex-shrink-0">
            <AvatarImage 
              src={getPoliticianAvatar(politician.nome)} 
              alt={`Foto de ${politician.nome}`}
            />
            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
              {politician.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          {/* Informações */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm leading-tight text-foreground truncate">
                {politician.nome}
              </h4>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {showKeywords && (
                  <KeywordManager 
                    politicianId={`${politician.nome}-${politician.cidade}`}
                    politicianName={politician.nome}
                  />
                )}
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Cargo e Localização */}
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="outline" 
                className={`text-xs ${getCargoColor(politician.cargo)}`}
              >
                {getCargoIcon(politician.cargo)}
                <span className="ml-1">{politician.cargo || 'Político'}</span>
              </Badge>
            </div>

            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs truncate">
                {politician.cidade}, {politician.uf}
              </span>
            </div>

            {/* Informações adicionais */}
            <div className="flex items-center gap-2 mt-2">
              {politician.partido && (
                <div className="flex items-center gap-1">
                  {getPartyLogo(politician.partido) && (
                    <img 
                      src={getPartyLogo(politician.partido)!} 
                      alt={`Logo ${politician.partido}`}
                      className="h-4 w-auto"
                    />
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {politician.partido}
                  </Badge>
                </div>
              )}
            </div>

            {/* Status e Mini Métricas */}
            <div className="mt-3 flex items-center justify-between">
              <Badge 
                className="bg-success/10 text-success border-success/20 text-xs"
              >
                <div className="w-1.5 h-1.5 bg-success rounded-full mr-1"></div>
                Monitorando
              </Badge>
              
              {/* Mini estatísticas */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{politician.newsCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}