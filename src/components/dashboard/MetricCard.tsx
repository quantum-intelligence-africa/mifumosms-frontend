import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
}: MetricCardProps) {

  return (
    <Card className="p-3 lg:p-6 glass hover:shadow-lg transition-smooth border-0">
      <div className="flex flex-col h-full">
        {/* Header with title */}
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs lg:text-sm font-medium text-text-subtle">{title}</p>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 lg:p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Icon className="w-3 h-3 lg:w-4 lg:h-4 text-primary" />
            </div>
            <h3 className="text-lg lg:text-2xl xl:text-3xl font-bold text-foreground">
              {value}
            </h3>
          </div>

          {description && (
            <p className="text-xs text-text-subtle">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
