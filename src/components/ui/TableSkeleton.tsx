import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showCard?: boolean;
}

export function TableSkeleton({ columns = 5, rows = 5, showCard = true }: TableSkeletonProps) {
  const content = (
    <Table>
      <TableHeader>
        <TableRow className="border-border-subtle">
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} className="border-border-subtle">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton 
                  className="h-4" 
                  style={{ 
                    width: `${60 + Math.random() * 40}%`,
                    animationDelay: `${rowIndex * 100 + colIndex * 50}ms` 
                  }} 
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (showCard) {
    return (
      <Card className="glass overflow-hidden">
        {content}
      </Card>
    );
  }

  return content;
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 4 }: CardSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card 
          key={index} 
          className="glass p-4 sm:p-6 animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface MobileCardListSkeletonProps {
  count?: number;
}

export function MobileCardListSkeleton({ count = 5 }: MobileCardListSkeletonProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card 
          key={index} 
          className="glass p-4 sm:p-6"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex flex-col space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="glass p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-12" />
        </div>
      </div>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Table Skeleton */}
      <TableSkeleton rows={5} columns={5} />
    </div>
  );
}
