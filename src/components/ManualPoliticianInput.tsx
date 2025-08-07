import React, { useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ManualPoliticianInputProps {
  onAddPolitician: (politician: any) => void;
  onClose: () => void;
}

export function ManualPoliticianInput({ onAddPolitician, onClose }: ManualPoliticianInputProps) {
  const [formData, setFormData] = useState({
    nome: '',
    partido: '',
    cargo: '',
    cidade: '',
    uf: '',
    mandato: '',
    avatarUrl: '',
    keywords: [] as string[]
  });
  
  const [newKeyword, setNewKeyword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cidade || !formData.uf) {
      toast.error('Nome, cidade e UF são obrigatórios!');
      return;
    }

    const newPolitician = {
      ...formData,
      id: Date.now().toString(),
      avatar: formData.avatarUrl || null,
      keywords: formData.keywords.length > 0 ? formData.keywords : [formData.nome]
    };

    onAddPolitician(newPolitician);
    toast.success(`${formData.nome} adicionado com sucesso!`);
    onClose();
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const partidos = [
    'MDB', 'PT', 'PSB', 'PDT', 'PL', 'PSDB', 'PSD', 'UNIÃO BRASIL',
    'REPUBLICANOS', 'PP', 'PSL', 'DEM', 'PSOL', 'PV', 'PCdoB',
    'AVANTE', 'SOLIDARIEDADE', 'NOVO', 'REDE', 'CIDADANIA'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            Adicionar Novo Político
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: João da Silva"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                  placeholder="Ex: Prefeito, Deputado, Senador"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  placeholder="Ex: São Paulo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="uf">Estado *</Label>
                <Select value={formData.uf} onValueChange={(value) => setFormData(prev => ({ ...prev, uf: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map(estado => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mandato">Mandato</Label>
                <Input
                  id="mandato"
                  value={formData.mandato}
                  onChange={(e) => setFormData(prev => ({ ...prev, mandato: e.target.value }))}
                  placeholder="Ex: 2021-2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partido">Partido</Label>
              <Select value={formData.partido} onValueChange={(value) => setFormData(prev => ({ ...prev, partido: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o partido" />
                </SelectTrigger>
                <SelectContent>
                  {partidos.map(partido => (
                    <SelectItem key={partido} value={partido}>{partido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Avatar */}
            <div className="space-y-2">
              <Label htmlFor="avatar">URL do Avatar (Opcional)</Label>
              <Input
                id="avatar"
                value={formData.avatarUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                placeholder="https://exemplo.com/avatar.jpg"
              />
              {formData.avatarUrl && (
                <div className="mt-2">
                  <img 
                    src={formData.avatarUrl} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-full object-cover border"
                    onError={() => setFormData(prev => ({ ...prev, avatarUrl: '' }))}
                  />
                </div>
              )}
            </div>

            {/* Palavras-chave */}
            <div className="space-y-2">
              <Label>Palavras-chave para Monitoramento</Label>
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Digite uma palavra-chave"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" onClick={addKeyword} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Se nenhuma palavra-chave for adicionada, será usado apenas o nome do político.
              </p>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Político
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}