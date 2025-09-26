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
  change,
  changeType = "neutral",
  icon: Icon,
  description,
}: MetricCardProps) {
  const changeColors = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-text-subtle",
  };

  return (
    <Card className="p-6 glass hover:shadow-lg transition-smooth border-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-subtle mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-foreground">{value}</h3>
            {change && (
              <span className={`text-sm font-medium ${changeColors[changeType]}`}>
                {change}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-text-subtle mt-1">{description}</p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}