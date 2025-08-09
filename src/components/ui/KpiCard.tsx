import { Card } from "@/components/ui/card"
import { Users } from "lucide-react"

export function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-primary-soft flex items-center justify-center text-primary">
        <Users size={18}/>
      </div>
      <div>
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-[28px] font-bold tabular-nums leading-none mt-1">{value}</div>
      </div>
    </Card>
  )
}
