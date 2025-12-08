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
    <Card className="p-4 lg:p-5 glass hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-border-subtle group">
      <div className="flex items-center gap-4 h-full">
        {/* Icon on the left */}
        <div className="p-2 lg:p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 group-hover:scale-110 transition-transform">
          <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
        </div>

        {/* Main content on the right */}
        <div className="flex-1 flex flex-col min-w-0">
          <p className="text-[11px] lg:text-xs font-medium text-text-subtle uppercase tracking-wide mb-1">{title}</p>
          <h3 className="text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mb-1 tracking-tight">
            {value}
          </h3>

          {description && (
            <p className="text-[11px] lg:text-xs text-text-subtle leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
