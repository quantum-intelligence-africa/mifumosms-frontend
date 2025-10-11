import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  description?: string;
}

export function MetricCard({
  title,
  value,
  change: _change,
  changeType: _changeType = "neutral",
  icon: Icon,
  description,
}: MetricCardProps) {
  return (
    <Card className="p-3 lg:p-6 glass hover:shadow-lg transition-smooth border-0">
      <div className="flex flex-col items-center text-center">
        <div className="p-1.5 lg:p-3 rounded-lg lg:rounded-xl bg-primary/10 flex-shrink-0 mb-2">
          <Icon className="w-3 h-3 lg:w-5 lg:h-5 text-primary" />
        </div>
        <p className="text-xs lg:text-sm font-medium text-text-subtle mb-1">{title}</p>
        <div className="flex items-baseline gap-1 lg:gap-2">
          <h3 className="text-sm lg:text-2xl font-bold text-foreground">{value}</h3>
        </div>
        {description && (
          <p className="text-xs text-text-subtle mt-1">{description}</p>
        )}
      </div>
    </Card>
  );
}
