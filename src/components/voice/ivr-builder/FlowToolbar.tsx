// Top toolbar: back navigation, inline-editable flow name + status badge, a
// live error-count badge fed by validation.ts, and the Export / Simulate /
// Validate / Publish action group (Publish is the filled primary CTA).
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileUp,
  PlayCircle,
  CheckCircle2,
  Check,
  Upload,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Save,
  Circle,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";
import type { FlowLanguage, FlowStatus, ValidationError } from "./types";

type T = ReturnType<typeof useLanguage>["t"];

// Raw flow status -> the label a non-technical user reads, rather than the
// raw enum value surfaced verbatim.
const statusLabelKey = (status: FlowStatus): Parameters<T>[0] => {
  switch (status) {
    case "published":
      return "voice.ivr_builder.toolbar.status_published";
    case "archived":
      return "voice.ivr_builder.toolbar.status_archived";
    default:
      return "voice.ivr_builder.toolbar.status_draft";
  }
};

export const LANGUAGE_LABELS: Record<FlowLanguage, string> = {
  sw: "Kiswahili",
  en: "English",
  sw_en: "Kiswahili + English",
};

interface FlowToolbarProps {
  name: string;
  status: FlowStatus;
  language: FlowLanguage;
  companyName: string;
  businessHours: string;
  errors: ValidationError[];
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveError: string | null;
  lastSavedAt: Date | null;
  isValidating: boolean;
  isPublishing: boolean;
  onRename: (name: string) => void;
  onLanguageChange: (language: FlowLanguage) => void;
  onBusinessIdentityChange: (patch: { company_name?: string; business_hours?: string }) => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onSimulate: () => void;
  onValidate: () => void;
  onPublish: () => void;
  onSelectError: (nodeId: string | null) => void;
}

export function FlowToolbar({
  name,
  status,
  language,
  companyName,
  businessHours,
  errors,
  isSaving,
  hasUnsavedChanges,
  saveError,
  lastSavedAt,
  isValidating,
  isPublishing,
  onRename,
  onLanguageChange,
  onBusinessIdentityChange,
  onSave,
  onExport,
  onImport,
  onSimulate,
  onValidate,
  onPublish,
  onSelectError,
}: FlowToolbarProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [draftName, setDraftName] = useState(name);
  const [editingName, setEditingName] = useState(false);
  const [errorPopoverOpen, setErrorPopoverOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [draftCompany, setDraftCompany] = useState(companyName);
  const [draftHours, setDraftHours] = useState(businessHours);

  // Re-seed the draft only while the popover is closed, so a reload landing
  // mid-edit can't yank the field out from under whoever is typing in it.
  useEffect(() => {
    if (!businessOpen) {
      setDraftCompany(companyName);
      setDraftHours(businessHours);
    }
  }, [companyName, businessHours, businessOpen]);

  useEffect(() => {
    if (!editingName) setDraftName(name);
  }, [name, editingName]);

  const commitName = () => {
    setEditingName(false);
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    else setDraftName(name);
  };

  return (
    <div className="flex h-auto min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-2 py-2 sm:h-14 sm:flex-nowrap sm:px-3 sm:py-0">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/voice/ivr")} aria-label={t("voice.ivr_builder.toolbar.back_aria")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {editingName ? (
          <Input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") {
                setDraftName(name);
                setEditingName(false);
              }
            }}
            className="h-8 min-w-0 flex-1 text-sm font-semibold sm:max-w-[220px] sm:flex-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left text-sm font-semibold text-foreground hover:bg-accent sm:max-w-[220px] sm:flex-none"
            title={t("voice.ivr_builder.toolbar.rename_title")}
          >
            {name || t("voice.ivr_builder.toolbar.untitled_flow")}
          </button>
        )}

        <Badge variant={status === "published" ? "default" : "outline"} className="shrink-0 capitalize">
          {t(statusLabelKey(status))}
        </Badge>

        <Select value={language} onValueChange={(v) => onLanguageChange(v as FlowLanguage)}>
          <SelectTrigger className="h-7 w-auto shrink-0 gap-1 px-2 text-xs">
            <SelectValue>{LANGUAGE_LABELS[language]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LANGUAGE_LABELS) as FlowLanguage[]).map((code) => (
              <SelectItem key={code} value={code}>
                {LANGUAGE_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover
          open={businessOpen}
          onOpenChange={(open) => {
            setBusinessOpen(open);
            if (!open) {
              // Commit on close rather than on every keystroke — one PATCH
              // per edit instead of one per letter typed.
              const patch: { company_name?: string; business_hours?: string } = {};
              if (draftCompany.trim() !== companyName) patch.company_name = draftCompany.trim();
              if (draftHours.trim() !== businessHours) patch.business_hours = draftHours.trim();
              if (Object.keys(patch).length > 0) onBusinessIdentityChange(patch);
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 shrink items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-accent"
              title={t("voice.ivr_builder.toolbar.business_button_title")}
            >
              <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="max-w-[110px] truncate">{companyName || t("voice.ivr_builder.toolbar.business_name_fallback")}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 max-w-[90vw] space-y-3">
            <div className="space-y-1">
              <Label htmlFor="flow-company-name" className="text-xs">
                {t("voice.ivr_builder.toolbar.business_name_label")}
              </Label>
              <Input
                id="flow-company-name"
                value={draftCompany}
                placeholder={t("voice.ivr_builder.toolbar.business_name_placeholder")}
                onChange={(e) => setDraftCompany(e.target.value)}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                {t("voice.ivr_builder.toolbar.business_name_help")}
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="flow-business-hours" className="text-xs">
                {t("voice.ivr_builder.toolbar.business_hours_label")}
              </Label>
              <Input
                id="flow-business-hours"
                value={draftHours}
                placeholder={t("voice.ivr_builder.toolbar.business_hours_placeholder")}
                onChange={(e) => setDraftHours(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                {t("voice.ivr_builder.toolbar.vars_help_intro")}{" "}
                <code className="rounded bg-background px-1">{"{company_name}"}</code>,{" "}
                <code className="rounded bg-background px-1">{"{customer_name}"}</code>,{" "}
                <code className="rounded bg-background px-1">{"{agent_name}"}</code> {t("voice.ivr_builder.toolbar.vars_help_or")}{" "}
                <code className="rounded bg-background px-1">{"{business_hours}"}</code>
                {t("voice.ivr_builder.toolbar.vars_help_example", { name: companyName || "SENDA" })}
              </p>
            </div>
          </PopoverContent>
        </Popover>

        {errors.length > 0 && (
          <Popover open={errorPopoverOpen} onOpenChange={setErrorPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex shrink-0 items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive"
                aria-label={t("voice.ivr_builder.toolbar.errors_badge_aria", { count: errors.length })}
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.length}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 max-w-[90vw] p-0">
              <div className="border-b border-border px-3 py-2 text-xs font-semibold text-foreground">
                {t("voice.ivr_builder.toolbar.errors_popover_header", { count: errors.length })}
              </div>
              <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                {errors.map((err, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-accent"
                      onClick={() => {
                        onSelectError(err.node_id);
                        setErrorPopoverOpen(false);
                      }}
                    >
                      {err.message}
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        )}

        {saveError ? (
          <button
            type="button"
            onClick={onSave}
            className="flex shrink-0 items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive"
            title={saveError}
          >
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>{t("voice.ivr_builder.toolbar.save_failed")}</span>
          </button>
        ) : isSaving ? (
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="hidden sm:inline">{t("voice.ivr_builder.toolbar.saving")}</span>
          </span>
        ) : hasUnsavedChanges ? (
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
            <Circle className="h-2 w-2 shrink-0 fill-current" />
            <span className="hidden sm:inline">{t("voice.ivr_builder.toolbar.unsaved_changes")}</span>
          </span>
        ) : (
          lastSavedAt && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
              <Check className="h-3 w-3 shrink-0 text-green-600" />
              <span className="hidden sm:inline">
                {t("voice.ivr_builder.toolbar.saved_at", {
                  time: lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                })}
              </span>
            </span>
          )
        )}
      </div>

      <div className="flex w-full shrink-0 items-center justify-end gap-1.5 sm:w-auto sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 px-2 sm:px-3"
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin sm:mr-1.5" /> : <Save className="h-3.5 w-3.5 sm:mr-1.5" />}
          <span className="hidden sm:inline">{t("voice.ivr_builder.toolbar.save")}</span>
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 px-2 sm:px-3" onClick={onImport}>
          <FileUp className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">{t("voice.ivr_builder.toolbar.import")}</span>
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 px-2 sm:px-3" onClick={onExport}>
          <Download className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">{t("voice.ivr_builder.toolbar.export")}</span>
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 px-2 sm:px-3" onClick={onSimulate}>
          <PlayCircle className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">{t("voice.ivr_builder.toolbar.simulate")}</span>
        </Button>
        <Button variant="outline" size="sm" className="shrink-0 px-2 sm:px-3" onClick={onValidate} disabled={isValidating}>
          {isValidating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin sm:mr-1.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 sm:mr-1.5" />
          )}
          <span className="hidden sm:inline">{t("voice.ivr_builder.toolbar.validate")}</span>
        </Button>
        <Button size="sm" className="shrink-0 px-2 sm:px-3" onClick={onPublish} disabled={errors.length > 0 || isPublishing}>
          {isPublishing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin sm:mr-1.5" />
          ) : (
            <Upload className="h-3.5 w-3.5 sm:mr-1.5" />
          )}
          <span className="hidden sm:inline">{t("voice.ivr_builder.toolbar.publish")}</span>
        </Button>
      </div>
    </div>
  );
}
