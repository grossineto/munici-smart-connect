import DashboardLayout from "@/layouts/DashboardLayout";
import { DepartmentCard } from "@/components/DepartmentCard";
import { Building2, Stethoscope, BookOpen, Hammer, Shield, Leaf } from "lucide-react";
import { useEffect } from "react";

const departments = [
  {
    name: "Saúde",
    slug: "saude",
    Icon: Stethoscope,
    status: "attention" as const,
    kpis: [
      { label: "Ocupação hospitalar", value: "82%" },
      { label: "Tempo médio de atendimento", value: "34 min" },
      { label: "Estoque de medicamentos", value: "74%" },
      { label: "Casos monitorados", value: "126" },
      { label: "Fila de exames", value: "342" },
    ],
  },
  {
    name: "Educação",
    slug: "educacao",
    Icon: BookOpen,
    status: "ok" as const,
    kpis: [
      { label: "Presença escolar", value: "94%" },
      { label: "Obras em escolas", value: "6" },
      { label: "Merenda disponível", value: "98%" },
    ],
  },
  {
    name: "Obras",
    slug: "obras",
    Icon: Hammer,
    status: "attention" as const,
    kpis: [
      { label: "Andamento médio", value: "67%" },
      { label: "Obras paralisadas", value: "2" },
      { label: "Emergências", value: "1" },
    ],
  },
  {
    name: "Segurança",
    slug: "seguranca",
    Icon: Shield,
    status: "urgent" as const,
    kpis: [
      { label: "Ocorrências do dia", value: "23" },
      { label: "Tempo de resposta", value: "7 min" },
      { label: "Operações ativas", value: "3" },
    ],
  },
  {
    name: "Meio Ambiente",
    slug: "meio-ambiente",
    Icon: Leaf,
    status: "ok" as const,
    kpis: [
      { label: "Áreas preservadas", value: "78%" },
      { label: "Lixo recolhido/dia", value: "126 t" },
      { label: "Ocorrências ambientais", value: "5" },
    ],
  },
];

export default function DepartmentsPage() {
  useEffect(() => {
    document.title = "Secretarias Municipais – BRIAN";
    const desc = "Visão estratégica e acionável das Secretarias Municipais.";
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
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold heading-institutional">Secretarias Municipais</h1>
        <p className="text-muted-foreground mt-1">Acompanhe KPIs, alertas e ações de cada secretaria da cidade.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((d) => (
          <DepartmentCard key={d.slug} {...d} />
        ))}
      </section>
    </div>
  );
}
