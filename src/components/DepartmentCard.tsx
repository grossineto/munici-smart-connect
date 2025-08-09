import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type DepartmentKpi = { label: string; value: string };
export type DepartmentStatus = "ok" | "attention" | "urgent";

export interface DepartmentCardProps {
  name: string;
  slug: string;
  Icon: LucideIcon;
  status: DepartmentStatus;
  kpis: DepartmentKpi[];
}

const statusColor = {
  ok: "bg-success",
  attention: "bg-warning",
  urgent: "bg-destructive",
} as const;

export function DepartmentCard({ name, slug, Icon, status, kpis }: DepartmentCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-5 hover:shadow-cardHover transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center">
            <Icon size={18} />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold leading-tight">{name}</h3>
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">Secretaria</Badge>
            </div>
          </div>
        </div>
        <span className={cn("h-2.5 w-2.5 rounded-full mt-1.5", statusColor[status])} aria-label={`Status: ${status}`}></span>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.slice(0,5).map((kpi) => (
          <div key={kpi.label} className="rounded-md border border-border p-3 bg-surface">
            <div className="text-xs text-muted-foreground">{kpi.label}</div>
            <div className="text-[18px] font-semibold mt-1 tabular-nums">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => navigate(`/departments/${slug}`)}>Ver detalhes</Button>
        <Button size="sm" variant="secondary" onClick={() => toast.info(`Acionando secretário de ${name}...`, { duration: 1800 })}>Acionar secretário</Button>
        <Button size="sm" variant="outline" onClick={() => toast.success(`Relatório de ${name} será gerado em breve.`, { duration: 1800 })}>Gerar relatório</Button>
      </div>
    </Card>
  );
}
