import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, Activity, AlertTriangle, CalendarClock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function DepartmentDetail() {
  const { slug } = useParams();
  const isSaude = slug === "saude";

  useEffect(() => {
    const title = isSaude ? "Saúde – Secretarias | BRIAN" : "Secretaria – Em construção | BRIAN";
    document.title = title;
    const desc = isSaude
      ? "KPIs, eventos, alertas e projeções da Secretaria de Saúde."
      : "Tela detalhada será disponibilizada em breve.";
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
  }, [isSaude]);

  if (!isSaude) {
    return (
      <div>
        <h1 className="text-2xl font-semibold heading-institutional">Secretaria</h1>
        <p className="text-muted-foreground mt-1">Tela detalhada em construção para {slug}.</p>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center">
            <Stethoscope size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold heading-institutional">Saúde</h1>
            <p className="text-muted-foreground">Visão completa: KPIs, eventos, alertas e projeções.</p>
          </div>
        </div>
        <Badge className="bg-warning text-foreground">Atenção</Badge>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KPIs principais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Ocupação hospitalar", value: "82%" },
                { label: "Tempo médio de atendimento", value: "34 min" },
                { label: "Estoque de medicamentos", value: "74%" },
                { label: "Casos monitorados", value: "126" },
                { label: "Fila de exames", value: "342" },
              ].map((k) => (
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
              {[
                { icon: Activity, title: "Pico de atendimento em UPA Central", time: "Hoje, 10:20" },
                { icon: AlertTriangle, title: "Estoque baixo de antibióticos", time: "Ontem, 17:40" },
                { icon: CalendarClock, title: "Mutirão de exames agendado", time: "Ontem, 09:00" },
              ].map((e, idx) => (
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
                  <Badge variant="outline" className="text-xs">Saúde</Badge>
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
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <div className="text-sm font-medium">Unidade sem médico plantonista</div>
                  <div className="text-xs text-muted-foreground">UPA Zona Norte</div>
                </div>
                <Badge className="bg-destructive text-white">Urgente</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <div className="text-sm font-medium">Fila de exames acima da média</div>
                  <div className="text-xs text-muted-foreground">Ortopedia</div>
                </div>
                <Badge className="bg-warning">Atenção</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projeções (IA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">Demanda por atendimentos deve subir 12% nas próximas 2 semanas.</p>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">Reposição de antibióticos necessária em 5 dias para evitar rupturas.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => toast.message("Mensagem enviada ao secretário de Saúde.")}>Enviar mensagem</Button>
              <Button variant="secondary" onClick={() => toast.info("Reunião será agendada.")}>Agendar reunião</Button>
              <Button variant="outline" onClick={() => toast.success("Solicitação de verba iniciada.")}>Solicitar verba</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
