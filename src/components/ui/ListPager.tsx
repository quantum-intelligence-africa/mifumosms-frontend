import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";

/** Rows-per-page choices every list offers. The API accepts up to 1000 per request. */
export const PAGE_SIZE_CHOICES = [20, 50, 100, 200, 500, 1000];

/**
 * Page size that is remembered per list (in this browser only), so a user who prefers 500 rows
 * does not have to pick it again on every visit. Storage trouble just means the default is used.
 */
export function usePageSize(listKey: string, fallback = 20): [number, (size: number) => void] {
  const storageKey = `senda.pageSize.${listKey}`;
  const [size, setSizeState] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey));
      return PAGE_SIZE_CHOICES.includes(saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  });
  const setSize = useCallback(
    (next: number) => {
      setSizeState(next);
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        /* private mode: keep it for this visit only */
      }
    },
    [storageKey],
  );
  return [size, setSize];
}

/** Just the "rows per page" choice, for lists that have their own previous/next or load-more controls. */
export function PageSizeSelect({ value, onChange, disabled = false }: { value: number; onChange: (size: number) => void; disabled?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{t("sms.common.rows_per_page")}</span>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))} disabled={disabled}>
        <SelectTrigger className="h-8 w-[80px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_CHOICES.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface ListPagerProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Previous / next with "rows per page" (up to 1000) and a "from–to of total" line. Stacks on a phone so
 * every control stays big enough to tap; the rows-per-page picker shows even when there is only one page,
 * so a user can always raise or lower it.
 */
export function ListPager({ page, pageSize, total, onPageChange, onPageSizeChange, isLoading = false, className = "" }: ListPagerProps) {
  const { t } = useLanguage();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  if (total === 0) return null;

  return (
    <div className={`mt-4 flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <span className="text-xs text-text-subtle">{t("sms.common.showing_range", { start, end, total })}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-subtle">{t("sms.common.rows_per_page")}</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))} disabled={isLoading}>
            <SelectTrigger className="h-9 w-[84px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_CHOICES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button variant="outline" size="sm" className="h-9 flex-1 text-xs sm:flex-none" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1 || isLoading}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("sms.common.previous")}
          </Button>
          <span className="whitespace-nowrap px-1 text-xs text-text-subtle">{t("sms.common.page_of", { current: page, total: totalPages })}</span>
          <Button variant="outline" size="sm" className="h-9 flex-1 text-xs sm:flex-none" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages || isLoading}>
            {t("sms.common.next")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
