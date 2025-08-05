import React, { useState, useEffect } from 'react';
import { Plus, X, Tag, Search, TrendingUp, Shield, Heart, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Keyword {
  id: string;
  term: string;
  category: string;
  politicianId?: string;
  active: boolean;
}

interface KeywordCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

interface KeywordManagerProps {
  politicianId?: string;
  politicianName?: string;
  onKeywordsChange?: (keywords: Keyword[]) => void;
  className?: string;
}

const categories: KeywordCategory[] = [
  {
    id: 'geral',
    name: 'Geral',
    icon: Search,
    color: 'bg-blue-500',
    description: 'Termos gerais de monitoramento'
  },
  {
    id: 'educacao',
    name: 'Educação',
    icon: Building,
    color: 'bg-green-500', 
    description: 'Escolas, universidades, ensino'
  },
  {
    id: 'saude',
    name: 'Saúde',
    icon: Heart,
    color: 'bg-red-500',
    description: 'Hospitais, UBS, saúde pública'
  },
  {
    id: 'seguranca',
    name: 'Segurança',
    icon: Shield,
    color: 'bg-yellow-500',
    description: 'Policiamento, violência, segurança'
  },
  {
    id: 'economia',
    name: 'Economia',
    icon: TrendingUp,
    color: 'bg-purple-500',
    description: 'Orçamento, impostos, desenvolvimento'
  }
];

const defaultKeywords: Record<string, string[]> = {
  geral: ['administração', 'prefeitura', 'gestão', 'político'],
  educacao: ['escola', 'educação', 'universidade', 'creche', 'professores'],
  saude: ['hospital', 'saúde', 'UBS', 'posto de saúde', 'médicos'],
  seguranca: ['segurança', 'polícia', 'violência', 'crime', 'guarda municipal'],
  economia: ['orçamento', 'imposto', 'economia', 'desenvolvimento', 'investimento']
};

export function KeywordManager({ 
  politicianId, 
  politicianName = "Político",
  onKeywordsChange, 
  className = "" 
}: KeywordManagerProps) {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('geral');

  // Carregar palavras-chave padrão
  useEffect(() => {
    const defaultKeywordList: Keyword[] = [];
    Object.entries(defaultKeywords).forEach(([category, terms]) => {
      terms.forEach((term, index) => {
        defaultKeywordList.push({
          id: `${category}-${index}`,
          term,
          category,
          politicianId,
          active: true
        });
      });
    });
    setKeywords(defaultKeywordList);
  }, [politicianId]);

  // Notificar mudanças
  useEffect(() => {
    onKeywordsChange?.(keywords);
  }, [keywords, onKeywordsChange]);

  const addKeyword = () => {
    if (!newKeyword.trim()) return;

    const keyword: Keyword = {
      id: `custom-${Date.now()}`,
      term: newKeyword.trim().toLowerCase(),
      category: selectedCategory,
      politicianId,
      active: true
    };

    setKeywords(prev => [...prev, keyword]);
    setNewKeyword('');
    
    toast({
      title: "Palavra-chave adicionada",
      description: `"${keyword.term}" foi adicionada à categoria ${categories.find(c => c.id === selectedCategory)?.name}`,
      duration: 2000,
    });
  };

  const removeKeyword = (keywordId: string) => {
    const keyword = keywords.find(k => k.id === keywordId);
    setKeywords(prev => prev.filter(k => k.id !== keywordId));
    
    if (keyword) {
      toast({
        title: "Palavra-chave removida",
        description: `"${keyword.term}" foi removida do monitoramento`,
        duration: 2000,
      });
    }
  };

  const toggleKeyword = (keywordId: string) => {
    setKeywords(prev => prev.map(k => 
      k.id === keywordId ? { ...k, active: !k.active } : k
    ));
  };

  const getKeywordsByCategory = (categoryId: string) => {
    return keywords.filter(k => k.category === categoryId);
  };

  const getActiveKeywordsCount = () => {
    return keywords.filter(k => k.active).length;
  };

  const getCategoryData = (categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  };

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="h-12 gap-2 shadow-subtle border-2 hover:border-primary/30 transition-colors"
          >
            <Tag className="h-4 w-4" />
            <span className="font-medium">Palavras-chave</span>
            <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs">
              {getActiveKeywordsCount()}
            </Badge>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0 shadow-institutional" align="start">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-base heading-institutional">
                Monitoramento para {politicianName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure palavras-chave por categoria
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Adicionar nova palavra-chave */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova palavra-chave..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    className="flex-1"
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <category.icon className="h-3 w-3" />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={addKeyword}
                  disabled={!newKeyword.trim()}
                  className="w-full h-9"
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Adicionar
                </Button>
              </div>

              <Separator />

              {/* Lista de palavras-chave por categoria */}
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {categories.map((category) => {
                  const categoryKeywords = getKeywordsByCategory(category.id);
                  
                  if (categoryKeywords.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        <h4 className="font-medium text-sm">{category.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {categoryKeywords.filter(k => k.active).length}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {categoryKeywords.map((keyword) => (
                          <Badge
                            key={keyword.id}
                            variant={keyword.active ? "default" : "secondary"}
                            className="text-xs cursor-pointer hover:bg-opacity-80 transition-colors gap-1"
                            onClick={() => toggleKeyword(keyword.id)}
                          >
                            {keyword.term}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-3 w-3 p-0 hover:bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeKeyword(keyword.id);
                              }}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumo */}
              <Separator />
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Total de palavras-chave:</span>
                  <span className="font-medium">{keywords.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Palavras ativas:</span>
                  <span className="font-medium text-green-600">{getActiveKeywordsCount()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}