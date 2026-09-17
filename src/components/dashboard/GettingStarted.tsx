import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Hash,
  ShieldCheck,
  Smartphone,
  UserCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserAvatar, AVATAR_OPTIONS } from "@/hooks/useUserAvatar";
import { OnboardingStatus, RecommendationCard } from "@/hooks/useSendaOnboarding";
import { useAuth } from "@/contexts/AuthContext";
import { hasSmsAccess } from "@/utils/roleUtils";
import { useLanguage } from "@/hooks/useLanguage";

interface GettingStartedProps {
  status: OnboardingStatus | null;
  recommendations: RecommendationCard[];
  firstName?: string;
  approvedSenderIds: number;
  currentCredits: number;
}

type StepKey = "email_verified" | "profile_completed" | "contacts_imported" | "sender_id_requested";

interface StepDef {
  key: StepKey;
  titleKey: "dashboard.getting_started.step_email_title" | "dashboard.getting_started.step_profile_title" | "dashboard.getting_started.step_contacts_title" | "dashboard.getting_started.step_sender_id_title";
  subtitleKey: "dashboard.getting_started.step_email_subtitle" | "dashboard.getting_started.step_profile_subtitle" | "dashboard.getting_started.step_contacts_subtitle" | "dashboard.getting_started.step_sender_id_subtitle";
  required: boolean;
  icon: typeof Hash;
}

const STEPS: StepDef[] = [
  {
    key: "email_verified",
    titleKey: "dashboard.getting_started.step_email_title",
    subtitleKey: "dashboard.getting_started.step_email_subtitle",
    required: true,
    icon: ShieldCheck,
  },
  {
    key: "profile_completed",
    titleKey: "dashboard.getting_started.step_profile_title",
    subtitleKey: "dashboard.getting_started.step_profile_subtitle",
    required: true,
    icon: UserCircle,
  },
  {
    key: "contacts_imported",
    titleKey: "dashboard.getting_started.step_contacts_title",
    subtitleKey: "dashboard.getting_started.step_contacts_subtitle",
    required: false,
    icon: Users,
  },
  {
    key: "sender_id_requested",
    titleKey: "dashboard.getting_started.step_sender_id_title",
    subtitleKey: "dashboard.getting_started.step_sender_id_subtitle",
    required: true,
    icon: Hash,
  },
];

export function GettingStarted({
  status,
  firstName,
}: GettingStartedProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { avatar, setAvatar } = useUserAvatar();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Sender ID is purely an SMS/messaging concept — skip that step entirely
  // for a user who only has IVR access (no SMS access to request one for).
  const steps = useMemo(
    () => (hasSmsAccess(user) ? STEPS : STEPS.filter((s) => s.key !== "sender_id_requested")),
    [user]
  );

  // If the user is on the dashboard, they've already passed the registration
  // OTP gate — mark account verification done. Prefer the profile flags so
  // the UI also reflects the explicit backend state.
  const isAccountVerified = !!(user?.is_verified || user?.phone_verified) || !!user;

  // Local "skipped" set so optional steps don't reappear in this session.
  const [skipped, setSkipped] = useState<Set<StepKey>>(new Set());

  // Track whether the user has actively picked an avatar in this session.
  // (The hook always returns a default avatar, so we can't infer "picked" from value alone.)
  const [profilePicked, setProfilePicked] = useState(false);

  const handlePickAvatar = (path: string) => {
    setAvatar(path);
    setProfilePicked(true);
  };

  // Read completion state from Senda status; account verification is taken from
  // the auth profile (is_verified / phone_verified) — registering already required OTP.
  const completion = useMemo(() => {
    const map: Record<StepKey, boolean> = {
      email_verified: isAccountVerified,
      profile_completed: false,
      contacts_imported: false,
      sender_id_requested: false,
    };
    status?.steps?.forEach((s) => {
      if (s.key in map) map[s.key as StepKey] = !!s.completed;
    });
    // The auth profile is the source of truth for verification — never let the
    // Senda payload downgrade a verified user back to "unverified".
    if (isAccountVerified) map.email_verified = true;
    // Mark profile complete once the user picks an avatar in this wizard session.
    if (profilePicked) map.profile_completed = true;
    return map;
  }, [status, profilePicked, isAccountVerified]);

  // Resolve the current step: first non-completed, non-skipped step.
  const firstUnfinishedIndex = useMemo(() => {
    const idx = steps.findIndex((s) => !completion[s.key] && !skipped.has(s.key));
    return idx === -1 ? steps.length - 1 : idx;
  }, [steps, completion, skipped]);

  const [currentIndex, setCurrentIndex] = useState(firstUnfinishedIndex);

  // Keep the wizard pointing at the next pending step as completion changes.
  useEffect(() => {
    setCurrentIndex(firstUnfinishedIndex);
  }, [firstUnfinishedIndex]);

  const totalSteps = steps.length;
  const doneCount = steps.filter((s) => completion[s.key]).length;
  const percentage = Math.round((doneCount / totalSteps) * 100);
  const currentStep = steps[currentIndex];

  const goNext = () => {
    if (currentIndex < totalSteps - 1) setCurrentIndex(currentIndex + 1);
  };
  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };
  const skipCurrent = () => {
    setSkipped((s) => new Set(s).add(currentStep.key));
    goNext();
  };

  return (
    <div className="space-y-3">
      {/* Welcome + progress */}
      <header className="rounded-2xl border border-primary/20 dark:border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card dark:from-primary/15 dark:via-card dark:to-card shadow-sm p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wider uppercase text-primary">
              {firstName ? t("dashboard.getting_started.welcome_named", { name: firstName }) : t("dashboard.getting_started.welcome")}
            </p>
            <h2 className="text-[16px] sm:text-lg font-bold text-foreground leading-tight mt-0.5">
              {t("dashboard.getting_started.header_title")}
            </h2>
            <p className="text-[12px] text-foreground/65 dark:text-foreground/60 leading-snug mt-0.5">
              {doneCount === totalSteps
                ? t("dashboard.getting_started.all_set")
                : t("dashboard.getting_started.progress_summary", { done: doneCount, total: totalSteps })}
            </p>
          </div>
          <span className="flex-shrink-0 text-[16px] font-bold text-primary tabular-nums">
            {percentage}%
          </span>
        </div>
        <Progress value={percentage} className="h-1.5 mt-2.5" />

        {/* Step indicator */}
        <ol className={`mt-3 grid gap-2 ${steps.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
          {steps.map((s, idx) => {
            const done = completion[s.key];
            const active = idx === currentIndex;
            const skip = skipped.has(s.key);
            return (
              <li key={s.key} className="flex flex-col items-center min-w-0 text-center">
                <button
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={[
                    "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/15 dark:ring-primary/25"
                        : skip
                          ? "bg-muted/60 text-foreground/40"
                          : "bg-muted/60 text-foreground/50",
                  ].join(" ")}
                  aria-label={t("dashboard.getting_started.step_aria", { step: idx + 1, title: t(s.titleKey) })}
                >
                  {done ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <span className="text-[12px] font-bold">{idx + 1}</span>
                  )}
                </button>
                <span
                  className={[
                    "mt-1 text-[10px] font-semibold leading-tight truncate w-full",
                    active ? "text-primary" : done ? "text-emerald-600 dark:text-emerald-400" : "text-foreground/55",
                  ].join(" ")}
                >
                  {s.key === "email_verified"
                    ? t("dashboard.getting_started.chip_account")
                    : s.key === "profile_completed"
                      ? t("dashboard.getting_started.chip_profile")
                      : s.key === "contacts_imported"
                        ? t("dashboard.getting_started.chip_contacts")
                        : t("dashboard.getting_started.chip_sender_id")}
                </span>
              </li>
            );
          })}
        </ol>
      </header>

      {/* Active step card */}
      <section className="rounded-2xl border border-border dark:border-border/60 bg-card dark:bg-card shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Step header */}
        <div className="px-4 sm:px-5 pt-3 pb-2.5 border-b border-border/60 dark:border-border/30">
          <div className="flex items-center gap-2 text-[10.5px] font-bold tracking-wider uppercase">
            <span className="text-primary">
              {t("dashboard.getting_started.step_of", { current: currentIndex + 1, total: totalSteps })}
            </span>
            <span
              className={[
                "px-1.5 py-0.5 rounded-full text-[9.5px]",
                currentStep.required
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-foreground/55",
              ].join(" ")}
            >
              {currentStep.required ? t("common.required") : t("common.optional")}
            </span>
          </div>
          <div className="flex items-start gap-2.5 mt-1.5">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
              <currentStep.icon className="w-[18px] h-[18px] text-primary" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-foreground leading-tight">
                {t(currentStep.titleKey)}
              </h3>
              <p className="text-[12px] text-foreground/60 dark:text-foreground/55 leading-snug mt-0.5">
                {t(currentStep.subtitleKey)}
              </p>
            </div>
          </div>
        </div>

        {/* Step body */}
        <div className="px-4 sm:px-5 py-3">
          {currentStep.key === "email_verified" && (
            <EmailVerifiedBody />
          )}
          {currentStep.key === "profile_completed" && (
            <ProfileBody avatar={avatar} onPick={handlePickAvatar} hasPicked={profilePicked} />
          )}
          {currentStep.key === "contacts_imported" && (
            <ContactsBody isMobile={isMobile} navigate={navigate} />
          )}
          {currentStep.key === "sender_id_requested" && (
            <SenderIdBody navigate={navigate} />
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-border/60 dark:border-border/30 flex items-center gap-2 bg-muted/30 dark:bg-muted/15">
          {currentIndex > 0 ? (
            <Button
              variant="ghost"
              onClick={goPrev}
              className="h-9 px-3 text-[12.5px] font-semibold text-foreground/65"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("common.back")}
            </Button>
          ) : (
            <div />
          )}
          <div className="ml-auto flex items-center gap-2">
            {!currentStep.required && currentIndex < totalSteps - 1 && (
              <Button
                variant="ghost"
                onClick={skipCurrent}
                className="h-9 px-3 text-[12.5px] font-semibold text-foreground/65"
              >
                {t("common.skip")}
              </Button>
            )}
            {currentIndex < totalSteps - 1 ? (
              <Button
                onClick={goNext}
                disabled={
                  // Profile step requires an active avatar pick before continue.
                  currentStep.key === "profile_completed" && !profilePicked
                }
                className="h-9 px-4 rounded-xl text-[12.5px] font-semibold shadow-sm"
              >
                {t("common.continue")}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : currentStep.key === "sender_id_requested" ? (
              <Button
                onClick={() => navigate("/sms/sender-names?action=request")}
                className="h-9 px-4 rounded-xl text-[12.5px] font-semibold shadow-md"
              >
                {t("dashboard.getting_started.request_sender_id_button")}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <span className="text-[12.5px] font-semibold text-foreground/50 px-2">{t("dashboard.getting_started.all_set_short")}</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/** Step 1 — account already verified at registration via the OTP. */
function EmailVerifiedBody() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 dark:border-emerald-500/40 px-3.5 py-2.5">
      <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
        <Check className="w-5 h-5" strokeWidth={3} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-foreground">{t("dashboard.getting_started.account_verified_title")}</p>
        <p className="text-[11.5px] text-foreground/60 leading-snug">
          {t("dashboard.getting_started.account_verified_desc")}
        </p>
      </div>
    </div>
  );
}

/** Step 2 — avatar picker. */
function ProfileBody({
  avatar,
  onPick,
  hasPicked,
}: {
  avatar: string;
  onPick: (path: string) => void;
  hasPicked: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <p className="text-[12px] text-foreground/65 dark:text-foreground/60 mb-2.5">
        {hasPicked
          ? t("dashboard.getting_started.profile_picked_desc")
          : t("dashboard.getting_started.profile_pick_desc")}
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
        {AVATAR_OPTIONS.map((src) => {
          const selected = src === avatar;
          return (
            <button
              key={src}
              type="button"
              onClick={() => onPick(src)}
              aria-pressed={selected}
              className={[
                "relative aspect-square rounded-2xl overflow-hidden transition-all active:scale-95",
                selected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-card dark:ring-offset-background"
                  : "ring-1 ring-border/60 dark:ring-border/40 hover:ring-border dark:hover:ring-border/60",
              ].join(" ")}
            >
              <img src={src} alt="" className="w-full h-full object-cover bg-muted" loading="lazy" />
              {selected && (
                <span className="absolute inset-0 flex items-end justify-end p-1.5 bg-primary/15">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Step 3 — contacts import (optional). */
function ContactsBody({
  isMobile,
  navigate,
}: {
  isMobile: boolean;
  navigate: (path: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      <p className="text-[12px] text-foreground/65 dark:text-foreground/60">
        {t("dashboard.getting_started.contacts_intro")}
      </p>

      {isMobile ? (
        <button
          type="button"
          onClick={() => navigate("/messaging/contacts?action=import")}
          className="w-full flex items-center gap-3 rounded-2xl border border-primary/20 dark:border-primary/30 bg-primary/[0.04] dark:bg-primary/10 px-3.5 py-2.5 text-left active:scale-[0.99] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 dark:bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground leading-tight">{t("dashboard.getting_started.import_from_phone_title")}</p>
            <p className="text-[11.5px] text-foreground/55 leading-snug mt-0.5">
              {t("dashboard.getting_started.import_from_phone_desc")}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground/40 flex-shrink-0" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => navigate("/messaging/contacts?action=create")}
          className="w-full flex items-center gap-3 rounded-2xl border border-primary/20 dark:border-primary/30 bg-primary/[0.04] dark:bg-primary/10 px-3.5 py-2.5 text-left active:scale-[0.99] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 dark:bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground leading-tight">{t("dashboard.getting_started.add_manually_title")}</p>
            <p className="text-[11.5px] text-foreground/55 leading-snug mt-0.5">
              {t("dashboard.getting_started.add_manually_desc")}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground/40 flex-shrink-0" />
        </button>
      )}

      <p className="text-[11px] text-foreground/50 dark:text-foreground/45 leading-snug">
        {t("dashboard.getting_started.contacts_skip_note")}
      </p>
    </div>
  );
}

/** Step 4 — Sender ID request (required). */
function SenderIdBody({ navigate }: { navigate: (path: string) => void }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2.5">
      <div className="rounded-xl bg-primary/[0.04] dark:bg-primary/10 border border-primary/15 dark:border-primary/25 p-3">
        <h4 className="text-[12px] font-bold tracking-wider uppercase text-primary mb-1.5">
          {t("dashboard.getting_started.why_matters_title")}
        </h4>
        <ul className="text-[12px] text-foreground/70 dark:text-foreground/65 leading-snug space-y-1">
          <li className="flex gap-1.5"><span className="text-primary">•</span> {t("dashboard.getting_started.why_matters_1")}</li>
          <li className="flex gap-1.5"><span className="text-primary">•</span> {t("dashboard.getting_started.why_matters_2")}</li>
          <li className="flex gap-1.5"><span className="text-primary">•</span> {t("dashboard.getting_started.why_matters_3")}</li>
        </ul>
      </div>
      <Button
        onClick={() => navigate("/sms/sender-names?action=request")}
        className="w-full h-11 rounded-2xl text-[14px] font-semibold shadow-md"
      >
        <Hash className="w-4 h-4 mr-2" strokeWidth={2.4} />
        {t("dashboard.getting_started.request_sender_id_now_button")}
      </Button>
      <p className="text-[11px] text-foreground/50 dark:text-foreground/45 text-center leading-snug">
        {t("dashboard.getting_started.sender_id_submitted_note")}
      </p>
    </div>
  );
}
