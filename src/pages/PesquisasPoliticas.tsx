import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

// Mock data
const INSTITUTOS = ["Datafolha", "Quaest", "Ipec", "AtlasIntel"] as const;
const TEMAS = ["Popularidade", "Intenção de voto", "Avaliação de gestão"] as const;

type Instituto = typeof INSTITUTOS[number];

type Survey = {
  id: string;
  date: string; // YYYY-MM-DD
  instituto: Instituto | string;
  localidade: string; // nacional, estadual, municipal
  tema: typeof TEMAS[number];
  valor: number; // índice ou %
};

const surveys: Survey[] = [
  { id: "s1", date: "2025-07-15", instituto: "Quaest", localidade: "Nacional", tema: "Popularidade", valor: 48 },
  { id: "s2", date: "2025-07-10", instituto: "Datafolha", localidade: "São Paulo", tema: "Intenção de voto", valor: 36 },
  { id: "s3", date: "2025-06-25", instituto: "Ipec", localidade: "Nacional", tema: "Avaliação de gestão", valor: 58 },
  { id: "s4", date: "2025-06-20", instituto: "AtlasIntel", localidade: "Curitiba", tema: "Popularidade", valor: 52 },
  { id: "s5", date: "2025-06-12", instituto: "Quaest", localidade: "Nacional", tema: "Intenção de voto", valor: 41 },
];

const series = [
  { date: "2025-03", popularidade: 44, aprovacao: 55 },
  { date: "2025-04", popularidade: 46, aprovacao: 56 },
  { date: "2025-05", popularidade: 47, aprovacao: 57 },
  { date: "2025-06", popularidade: 49, aprovacao: 58 },
  { date: "2025-07", popularidade: 48, aprovacao: 59 },
];

const PesquisasPoliticas: React.FC = () => {
  const [periodo, setPeriodo] = useState<string>("6m");
  const [tema, setTema] = useState<string>("Todos");
  const [instituto, setInstituto] = useState<string>("Todos");

  const filtered = useMemo(() => {
    return surveys.filter(s => (tema === "Todos" || s.tema === tema) && (instituto === "Todos" || s.instituto === instituto));
  }, [tema, instituto]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Painel de Pesquisas Políticas',
    description: 'Painel agregador de pesquisas políticas nacionais e locais',
    creator: { '@type': 'Organization', name: 'BRIAN' },
  };

  return (
    <div className="space-y-4">
      <SEO 
        title="Pesquisas Políticas | BRIAN"
        description="Painel com pesquisas políticas do Brasil: evolução, comparativos, filtros por instituto e tema."
        canonical={window.location.origin + "/pesquisas-politicas"}
        jsonLd={jsonLd}
      />

      <header>
        <h1 className="text-2xl font-bold tracking-tight">Pesquisas Políticas</h1>
        <p className="text-sm text-muted-foreground mt-1">Compare pesquisas por período, instituto e tema. Dados de exemplo para validação de layout.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-muted-foreground">Período</label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="12m">Últimos 12 meses</SelectItem>
                <SelectItem value="ytd">Ano atual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Tema</label>
            <Select value={tema} onValueChange={setTema}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {TEMAS.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Instituto</label>
            <Select value={instituto} onValueChange={setInstituto}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Instituto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {INSTITUTOS.map(i => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Evolução temporal</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="popularidade" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Popularidade" />
                <Line type="monotone" dataKey="aprovacao" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} name="Aprovação" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>KPIs</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-card border">
              <div className="text-xs text-muted-foreground">Última popularidade</div>
              <div className="text-2xl font-bold mt-1">{series[series.length - 1].popularidade}%</div>
            </div>
            <div className="p-3 rounded-md bg-card border">
              <div className="text-xs text-muted-foreground">Última aprovação</div>
              <div className="text-2xl font-bold mt-1">{series[series.length - 1].aprovacao}%</div>
            </div>
            <div className="p-3 rounded-md bg-card border">
              <div className="text-xs text-muted-foreground">Pesquisas no período</div>
              <div className="text-2xl font-bold mt-1">{filtered.length}</div>
            </div>
            <div className="p-3 rounded-md bg-card border">
              <div className="text-xs text-muted-foreground">Institutos</div>
              <div className="text-2xl font-bold mt-1">{new Set(filtered.map(f => f.instituto)).size}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pesquisas recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Instituto</TableHead>
                  <TableHead>Localidade</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                      <TableCell>{s.instituto}</TableCell>
                      <TableCell>{s.localidade}</TableCell>
                      <TableCell>{s.tema}</TableCell>
                      <TableCell className="text-right">{s.valor}%</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Separator />
      <div className="text-xs text-muted-foreground">
        Estrutura pronta para integrar APIs externas (Datafolha, Quaest, etc.). Estes dados são fictícios para validação visual.
      </div>
    </div>
  );
};

export default PesquisasPoliticas;
