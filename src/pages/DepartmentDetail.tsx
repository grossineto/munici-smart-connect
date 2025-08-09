import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type LucideIcon,
  Stethoscope,
  BookOpen,
  Hammer,
  Shield,
  Leaf,
  Activity,
  AlertTriangle,
  CalendarClock,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

type DeptStatus = "ok" | "attention" | "urgent";
type Kpi = { label: string; value: string };
type EventItem = { icon: LucideIcon; title: string; time: string };
type AlertItem = { title: string; subtitle: string; level: DeptStatus };

const statusBadge = {
  ok: { class: "bg-success", label: "OK" },
  attention: { class: "bg-warning", label: "Atenção" },
  urgent: { class: "bg-destructive text-white", label: "Urgente" },
} as const;

const departmentsData = {
  saude: {
    name: "Saúde",
    icon: Stethoscope,
    status: "attention" as DeptStatus,
    kpis: [
      { label: "Ocupação hospitalar", value: "82%" },
      { label: "Tempo médio de atendimento", value: "34 min" },
      { label: "Estoque de medicamentos", value: "74%" },
      { label: "Casos monitorados", value: "126" },
      { label: "Fila de exames", value: "342" },
    ] as Kpi[],
    events: [
      { icon: Activity, title: "Pico de atendimento em UPA Central", time: "Hoje, 10:20" },
      { icon: AlertTriangle, title: "Estoque baixo de antibióticos", time: "Ontem, 17:40" },
      { icon: CalendarClock, title: "Mutirão de exames agendado", time: "Ontem, 09:00" },
    ] as EventItem[],
    alerts: [
      { title: "Unidade sem médico plantonista", subtitle: "UPA Zona Norte", level: "urgent" as DeptStatus },
      { title: "Fila de exames acima da média", subtitle: "Ortopedia", level: "attention" as DeptStatus },
    ] as AlertItem[],
    projections: [
      "Demanda por atendimentos deve subir 12% nas próximas 2 semanas.",
      "Reposição de antibióticos necessária em 5 dias para evitar rupturas.",
    ],
  },
  educacao: {
    name: "Educação",
    icon: BookOpen,
    status: "ok" as DeptStatus,
    kpis: [
      { label: "Presença escolar", value: "94%" },
      { label: "Obras em escolas", value: "6" },
      { label: "Merenda disponível", value: "98%" },
    ],
    events: [
      { icon: CalendarClock, title: "Avaliação bimestral iniciada", time: "Hoje, 08:00" },
      { icon: Activity, title: "Entrega de tablets em 2 escolas", time: "Ontem, 16:10" },
    ],
    alerts: [
      { title: "Falta de professores", subtitle: "2 unidades", level: "attention" },
    ],
    projections: [
      "Aumento de 3% na presença com ações de engajamento.",
    ],
  },
  obras: {
    name: "Obras",
    icon: Hammer,
    status: "attention" as DeptStatus,
    kpis: [
      { label: "Andamento médio", value: "67%" },
      { label: "Obras paralisadas", value: "2" },
      { label: "Emergências", value: "1" },
    ],
    events: [
      { icon: Activity, title: "Concretagem final no viaduto central", time: "Hoje, 11:30" },
    ],
    alerts: [
      { title: "Atraso por falta de insumos", subtitle: "Ponte da Vila Nova", level: "attention" },
    ],
    projections: [
      "Conclusão de 4 obras até o próximo mês.",
    ],
  },
  seguranca: {
    name: "Segurança",
    icon: Shield,
    status: "urgent" as DeptStatus,
    kpis: [
      { label: "Ocorrências do dia", value: "23" },
      { label: "Tempo de resposta", value: "7 min" },
      { label: "Operações ativas", value: "3" },
    ],
    events: [
      { icon: Activity, title: "Operação Bairro Seguro em andamento", time: "Hoje, 09:40" },
    ],
    alerts: [
      { title: "Aumento de furtos", subtitle: "Região Central", level: "urgent" },
    ],
    projections: [
      "Reforço de patrulhamento pode reduzir 15% das ocorrências em 2 semanas.",
    ],
  },
  "meio-ambiente": {
    name: "Meio Ambiente",
    icon: Leaf,
    status: "ok" as DeptStatus,
    kpis: [
      { label: "Áreas preservadas", value: "78%" },
      { label: "Lixo recolhido/dia", value: "126 t" },
      { label: "Ocorrências ambientais", value: "5" },
    ],
    events: [
      { icon: Activity, title: "Plantio de 300 mudas iniciado", time: "Hoje, 07:30" },
    ],
    alerts: [
      { title: "Foco de queimadas", subtitle: "Zona Oeste", level: "attention" },
    ],
    projections: [
      "Índice de poluição tende a cair 8% com novas rotas de coleta.",
    ],
  },
} as const;

export default function DepartmentDetail() {
  const { slug } = useParams();
  const key = (slug ?? "") as keyof typeof departmentsData;
  const data = departmentsData[key];

  useEffect(() => {
    const title = data ? `${data.name} – Secretarias | BRIAN` : "Secretaria – BRIAN";
    document.title = title;
    const desc = data
      ? `KPIs, eventos, alertas e projeções da Secretaria de ${data.name}.`
      : "Tela detalhada da secretaria.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }, [data]);

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-semibold heading-institutional">Secretaria</h1>
        <p className="text-muted-foreground mt-1">Secretaria não encontrada.</p>
      </div>
    );
  }

  const Icon = data.icon;

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center">
            <Icon size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold heading-institutional">{data.name}</h1>
            <p className="text-muted-foreground">Visão completa: KPIs, eventos, alertas e projeções.</p>
          </div>
        </div>
        <Badge className={statusBadge[data.status].class}>{statusBadge[data.status].label}</Badge>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KPIs principais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.kpis.map((k) => (
                <div key={k.label} className="rounded-md border border-border p-4">
                  <div className="text-xs text-muted-foreground">{k.label}</div>
                  <div className="text-[22px] font-bold tabular-nums mt-1">{k.value}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos e ações recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.events.map((e, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                      <e.icon size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.time}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{data.name}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas ativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.alerts.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.subtitle}</div>
                  </div>
                  <Badge className={statusBadge[a.level].class}>{statusBadge[a.level].label}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projeções (IA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.projections.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{p}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => toast.message(`Mensagem enviada ao secretário de ${data.name}.`)}>Enviar mensagem</Button>
              <Button variant="secondary" onClick={() => toast.info("Reunião será agendada.")}>Agendar reunião</Button>
              <Button variant="outline" onClick={() => toast.success("Solicitação de verba iniciada.")}>Solicitar verba</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
