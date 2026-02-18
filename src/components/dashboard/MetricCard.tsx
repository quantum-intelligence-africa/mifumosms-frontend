import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: number;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  isEmpty = false,
  emptyMessage = "No data yet",
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState<string | number>("0");

  // Animate number counting effect
  useEffect(() => {
    if (typeof value === "number") {
      const duration = 1000;
      const steps = 20;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value.toLocaleString());
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current).toLocaleString());
        }
      }, duration / steps);
      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  // Empty state rendering - only show if explicitly set to true
  if (isEmpty) {
    return (
      <Card className="p-3 sm:p-4 lg:p-5 glass hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-border-subtle group min-h-[100px] sm:min-h-[110px]">
        <div className="flex items-center gap-3 h-full">
          {/* Icon on the left */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-muted/50 flex-shrink-0">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50" />
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <p className="text-[10px] sm:text-[11px] lg:text-xs font-medium text-text-subtle uppercase tracking-wide mb-1 truncate">{title}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-3 sm:p-4 lg:p-5 glass hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-border-subtle group min-h-[100px] sm:min-h-[110px]">
        <div className="flex items-center gap-3 sm:gap-4 h-full">
          {/* Icon on the left */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 group-hover:scale-110 transition-transform">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>

          {/* Main content on the right */}
          <div className="flex-1 flex flex-col min-w-0">
            <p className="text-[10px] sm:text-[11px] lg:text-xs font-medium text-text-subtle uppercase tracking-wide mb-0.5 sm:mb-1 truncate">{title}</p>
            <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mb-0.5 sm:mb-1 tracking-tight font-mono">
              {displayValue}
            </h3>

            {description && (
              <p className="text-[10px] sm:text-[11px] lg:text-xs text-text-subtle leading-relaxed truncate">{description}</p>
            )}

            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-[10px] sm:text-xs ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                <span>{trend >= 0 ? '↑' : '↓'}</span>
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
