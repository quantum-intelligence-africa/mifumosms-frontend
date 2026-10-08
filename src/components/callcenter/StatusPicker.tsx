import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { SELF_STATUSES } from "@/services/callCenterApi";
import { StatusDot, StatusLabel } from "./StatusDot";

/** The agent's own availability control. "Busy" is deliberately absent: it is
 *  set by an actual call, so nobody can claim to be on one. */
export function StatusPicker() {
  const { status, setStatus } = useCallCenter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const onCall = status === "busy";

  const choose = async (next: (typeof SELF_STATUSES)[number]) => {
    if (next === status) return;
    setSaving(true);
    const error = await setStatus(next);
    setSaving(false);
    if (error) toast({ title: t("cc.status.change_failed"), description: error, variant: "destructive" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={saving || onCall} className="h-10 gap-2" aria-label={t("cc.status.picker_aria")}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <StatusLabel status={status} />}
          {!onCall && <ChevronDown className="h-4 w-4 opacity-60" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {SELF_STATUSES.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => choose(s)} className="gap-2">
            <StatusDot status={s} />
            {t(`cc.status.${s}` as const)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
