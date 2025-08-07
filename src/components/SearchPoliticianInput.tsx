import React, { useState, useEffect } from 'react';
import { Search, MapPin, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdvancedSearchFilters } from '@/components/AdvancedSearchFilters';

interface Politician {
  id?: any;
  nome: string;
  partido?: string;
  mandato?: string;
  cidade: string;
  uf: string;
  cargo?: string;
}

interface SearchPoliticianInputProps {
  onSelectPolitician: (politician: Politician) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchPoliticianInput({ 
  onSelectPolitician, 
  placeholder = "Selecione um dos políticos cadastrados...",
  disabled = false 
}: SearchPoliticianInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Função para buscar apenas os 3 políticos cadastrados
  const searchPoliticians = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    
    try {
      const queryLower = query.toLowerCase();
      
      // Buscar apenas nos 3 políticos registrados
      const registeredPoliticians = ["Ricardo Nunes", "João Campos", "José Sarto"];
      
      const localResults = Object.entries(mayorData)
        .filter(([cityName, mayor]) => {
          // Filtrar apenas os 3 políticos cadastrados
          const isRegistered = registeredPoliticians.some(regName => 
            mayor.nome.includes(regName) || cityName === regName
          );
          
          if (!isRegistered) return false;
          
          return (
            cityName.toLowerCase().includes(queryLower) ||
            mayor.nome.toLowerCase().includes(queryLower) ||
            mayor.partido?.toLowerCase().includes(queryLower) ||
            mayor.uf.toLowerCase().includes(queryLower)
          );
        })
        .slice(0, 3)
        .map(([cityName, mayor]) => ({
          id: cityName,
          nome: cityName,
          uf: mayor.uf,
          mayor: mayor,
          source: 'local'
        }));

      setSearchResults(localResults);
      
    } catch (error) {
      console.error('Erro ao buscar políticos:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPoliticians(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Base limitada aos 3 políticos cadastrados na plataforma
  const mayorData: Record<string, Politician> = {
    "Ricardo Nunes": { 
      nome: "Ricardo Nunes", 
      partido: "MDB", 
      mandato: "2021-2024", 
      cidade: "São Paulo", 
      uf: "SP",
      cargo: "Prefeito"
    },
    "Recife": { 
      nome: "João Campos", 
      partido: "PSB", 
      mandato: "2021-2024", 
      cidade: "Recife", 
      uf: "PE",
      cargo: "Prefeito"
    },
    "João Campos": { 
      nome: "João Campos", 
      partido: "PSB", 
      mandato: "2021-2024", 
      cidade: "Recife", 
      uf: "PE",
      cargo: "Prefeito"
    },
    "Fortaleza": { 
      nome: "José Sarto", 
      partido: "PDT", 
      mandato: "2021-2024", 
      cidade: "Fortaleza", 
      uf: "CE",
      cargo: "Prefeito"
    },
    "José Sarto": { 
      nome: "José Sarto", 
      partido: "PDT", 
      mandato: "2021-2024", 
      cidade: "Fortaleza", 
      uf: "CE",
      cargo: "Prefeito"
    }
  };

  // Função para obter logo do partido (expandida)
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
      case 'PDT':
        return '/lovable-uploads/425f80f3-21ac-4eef-984d-ba432848be17.png';
      case 'PT':
        return '/lovable-uploads/990eb197-9e97-4050-9ad7-41f0539e7ba8.png';
      case 'PL':
        return '/lovable-uploads/67267154-40d4-465f-aa9d-fcca131002f0.png';
      case 'DEM':
      case 'DEMOCRATAS':
        return '/lovable-uploads/eceb707c-015a-4cb2-b488-493c9c6b5cac.png';
      case 'REDE':
        return '/lovable-uploads/9c090c37-0d6e-4699-9cc5-028de5640b9a.png';
      default:
        return null;
    }
  };

  // Função para obter avatar do político (simulando busca de imagem)
  const getPoliticianAvatar = (nome: string) => {
    // Em uma implementação real, isso faria uma busca na API do Twitter
    // por agora, retornamos um avatar baseado no nome
    const avatarMap: Record<string, string> = {
      "Ricardo Nunes": "/lovable-uploads/6f653b9a-a318-4b80-955c-4f7b4de6634c.png",
      "João Campos": "/lovable-uploads/990eb197-9e97-4050-9ad7-41f0539e7ba8.png",
      "José Sarto": "/lovable-uploads/f6d35a9d-205a-4556-ac06-3f9fbd151298.png",
      "Tarcísio Gomes de Freitas": "/lovable-uploads/9c090c37-0d6e-4699-9cc5-028de5640b9a.png",
      "Guto Issa": "/lovable-uploads/dc683cc5-b8bf-4311-9698-3337b29889e5.png",
      "Suéllen Silva Rosim": "/lovable-uploads/425f80f3-21ac-4eef-984d-ba432848be17.png"
    };
    
    return avatarMap[nome] || null;
  };

  const handlePoliticianSelect = (result: any) => {
    const mayor = result.mayor || mayorData[result.nome];
    if (mayor) {
      onSelectPolitician({
        ...mayor,
        cidade: result.nome,
        uf: result.uf
      });
    }
    setSearchQuery('');
    setShowResults(false);
  };

  // Função removida - não permitimos busca direta

  // Função para lidar com Enter - apenas seleção de resultados
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handlePoliticianSelect(searchResults[0]);
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={disabled}
          className="pl-10 pr-10 h-12 text-base border-2 border-muted focus:border-primary transition-colors"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Resultados da busca */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-2">
          <CardContent className="p-2">
            <div className="space-y-1">
              {searchResults.map((result) => {
                const mayor = result.mayor || mayorData[result.nome];
                if (!mayor) return null;
                
                return (
                   <Button
                    key={result.id}
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto text-left hover:bg-muted/80"
                    onClick={() => handlePoliticianSelect(result)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        {getPoliticianAvatar(mayor.nome) ? (
                          <img 
                            src={getPoliticianAvatar(mayor.nome)!}
                            alt={`Avatar ${mayor.nome}`}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <span className="text-xs font-bold">
                              {mayor.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {mayor.nome} - {mayor.cargo}
                          {result.source === 'twitter' && (
                            <Badge variant="secondary" className="text-xs">
                              Twitter
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {result.nome}, {result.uf}
                          {mayor.partido && (
                            <div className="flex items-center gap-1">
                              {getPartyLogo(mayor.partido) && (
                                <img 
                                  src={getPartyLogo(mayor.partido)!} 
                                  alt={`Logo ${mayor.partido}`}
                                  className="h-3 w-auto"
                                />
                              )}
                              <Badge variant="outline" className="text-xs">
                                {mayor.partido}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              }).filter(Boolean)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há resultados */}
      {showResults && !isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-2">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground text-center">
              Político não encontrado. Apenas Ricardo Nunes, João Campos e José Sarto estão disponíveis.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}