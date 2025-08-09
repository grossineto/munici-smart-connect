import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SEO from "@/components/SEO";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Mock data
const AREAS = ["Saúde", "Educação", "Infraestrutura", "Meio Ambiente", "Assistência Social"] as const;

type Opportunity = {
  id: string;
  nome: string;
  orgao: string;
  valor: string;
  prazo: string; // YYYY-MM-DD
  area: typeof AREAS[number];
  link: string;
};

const opportunities: Opportunity[] = [
  { id: "o1", nome: "PAB - Ampliação UBS", orgao: "Ministério da Saúde", valor: "R$ 1.200.000", prazo: "2025-09-30", area: "Saúde", link: "#" },
  { id: "o2", nome: "FNDE - Ônibus Escolar", orgao: "Ministério da Educação", valor: "R$ 800.000", prazo: "2025-10-15", area: "Educação", link: "#" },
  { id: "o3", nome: "PAC - Pavimentação", orgao: "Casa Civil", valor: "R$ 3.500.000", prazo: "2025-11-05", area: "Infraestrutura", link: "#" },
  { id: "o4", nome: "Recuperação de Nascentes", orgao: "MMA", valor: "R$ 600.000", prazo: "2025-09-10", area: "Meio Ambiente", link: "#" },
  { id: "o5", nome: "Proteção Social Básica", orgao: "MDS", valor: "R$ 950.000", prazo: "2025-08-31", area: "Assistência Social", link: "#" },
];

const OportunidadesRecursos: React.FC = () => {
  const { toast } = useToast();
  const [idea, setIdea] = useState("");
  const [area, setArea] = useState<string>("Todas");
  const [termo, setTermo] = useState("");
  const [results, setResults] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const base = results.length ? results : opportunities;
    return base.filter(o => (area === "Todas" || o.area === area) && (!termo || (o.nome + o.orgao).toLowerCase().includes(termo.toLowerCase())));
  }, [area, termo, results]);

  const handleBuscar = async () => {
    if (!idea.trim()) {
      toast({ title: "Descreva o projeto", description: "Digite sua ideia para buscar oportunidades.", variant: "default" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('find-opportunities', {
        body: { 
          idea, 
          area: area !== 'Todas' ? area : undefined,
          providers: ['caixa', 'bndes']
        }
      });
      if (error) throw error;
      const items = (data?.opportunities || []) as any[];
      const mapped: Opportunity[] = items.map((it, idx) => ({
        id: it.id || `${Date.now()}-${idx}`,
        nome: it.name || it.nome || it.titulo || 'Oportunidade',
        orgao: it.agency || it.orgao || it.instituicao || 'Instituição',
        valor: it.value || it.valor || '—',
        prazo: it.deadline || it.prazo || '',
        area: (it.area || it.areaTag || it.tags?.[0] || 'Infraestrutura') as Opportunity['area'],
        link: it.link || it.url || '#',
      }));
      setResults(mapped);
      toast({ title: "Busca executada", description: `${mapped.length} oportunidades encontradas` });
    } catch (err) {
      console.error('Erro ao buscar oportunidades:', err);
      toast({ title: "Falha na busca", description: "Utilizando dados de exemplo.", variant: "destructive" });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Portal de Oportunidades e Recursos',
    itemListElement: filtered.map((o, idx) => ({ '@type': 'ListItem', position: idx + 1, name: o.nome })),
  };

  return (
    <div className="space-y-4">
      <SEO 
        title="Oportunidades e Recursos | BRIAN"
        description="Descubra editais e linhas de crédito por área e projeto. Busca IA (mock) e filtros para prefeitos e gestores."
        canonical={window.location.origin + "/oportunidades"}
        jsonLd={jsonLd}
      />

      <header>
        <h1 className="text-2xl font-bold tracking-tight">Portal de Oportunidades e Recursos</h1>
        <p className="text-sm text-muted-foreground mt-1">Insira um projeto/ideia e filtre por área para encontrar fontes de financiamento. Dados de exemplo.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Descreva seu projeto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <Textarea 
              placeholder="Ex: Construção de nova UBS com energia solar e mobiliário acessível"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Área</label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {AREAS.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Buscar</label>
              <Input placeholder="Filtrar por nome/órgão" value={termo} onChange={(e) => setTermo(e.target.value)} />
            </div>
            <Button onClick={handleBuscar} className="mt-2" disabled={loading}>{loading ? "Buscando..." : "Buscar Oportunidades"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Órgão</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium">{o.nome}</div>
                      <div className="text-xs text-muted-foreground">ID: {o.id}</div>
                    </TableCell>
                    <TableCell>{o.orgao}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{o.area}</Badge>
                    </TableCell>
                    <TableCell>{o.valor}</TableCell>
                    <TableCell>{new Date(o.prazo).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <a href={o.link} target="_blank" rel="noopener noreferrer">Detalhes</a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Estrutura pronta para integrar IA (ChatGPT + Perplexity) e bases governamentais. Esta é uma versão de validação com dados fictícios.
      </div>
    </div>
  );
};

export default OportunidadesRecursos;
