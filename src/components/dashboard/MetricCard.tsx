import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const getChangeColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-green-600 bg-green-50 border-green-200";
      case "negative":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <Card className="p-3 lg:p-6 glass hover:shadow-lg transition-smooth border-0">
      <div className="flex flex-col h-full">
        {/* Header with title and change indicator */}
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs lg:text-sm font-medium text-text-subtle">{title}</p>
          {change && (
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 ${getChangeColor(changeType)}`}
            >
              {change}
            </Badge>
          )}
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
