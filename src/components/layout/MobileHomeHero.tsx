import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MoreVertical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { MobileOverflowMenu } from "@/components/layout/MobileOverflowMenu";

interface HeroMetricData {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

interface MobileHomeHeroProps {
  metricCards: HeroMetricData[];
}

function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function MobileHomeHero({ metricCards }: MobileHomeHeroProps) {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { avatar } = useUserAvatar();
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Tell global CSS to drop the safe-area-top padding on Home so this hero
  // can extend behind the notch with its own padding-top.
  useEffect(() => {
    document.body.classList.add("home-page");
    return () => {
      document.body.classList.remove("home-page");
    };
  }, []);

  // Refresh the greeting every 5 minutes so it updates as the day rolls over
  // without the user reloading the page.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const greeting = useMemo(() => getTimeGreeting(now), [now]);

  const firstName = user?.first_name || user?.full_name?.split(" ")[0] || "there";
  const fullName =
    user?.full_name ||
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    "User";

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      <div
        className={[
          "md:hidden bg-primary text-primary-foreground",
          "rounded-b-[28px]",
          "shadow-[0_4px_12px_rgba(10,92,219,0.15)]",
        ].join(" ")}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* Header row */}
        <div className="px-4 pt-3 pb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/settings")}
            aria-label="Profile"
            className="flex-shrink-0 active:scale-95 transition-transform"
          >
            <Avatar className="h-14 w-14 ring-2 ring-white/30 shadow-md">
              <AvatarImage src={avatar} alt={fullName} className="object-cover" />
              <AvatarFallback className="text-base font-bold bg-gradient-to-br from-white/95 to-white/80 text-primary">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium text-primary-foreground/85 leading-tight tracking-tight">
              {greeting}
            </p>
            <h1 className="text-[19px] font-bold text-primary-foreground leading-tight truncate tracking-tight mt-0.5">
              {isLoading ? "…" : firstName}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate("/notifications")}
            aria-label="Notifications"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full text-primary-foreground active:bg-white/15 transition-colors"
          >
            <Bell className="w-[20px] h-[20px]" strokeWidth={2.2} />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="More options"
            className="w-10 h-10 -mr-1 inline-flex items-center justify-center rounded-full text-primary-foreground active:bg-white/15 transition-colors"
          >
            <MoreVertical className="w-[22px] h-[22px]" strokeWidth={2.4} />
          </button>
        </div>

        {/* Hero metric cards */}
        {metricCards.length > 0 && (
          <div className="px-3 pb-5">
            <div className="grid grid-cols-2 gap-2.5">
              {metricCards.map((card) => (
                <HeroMetric key={card.title} {...card} />
              ))}
            </div>
          </div>
        )}
      </div>

      <MobileOverflowMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function HeroMetric({ title, value, description, icon: Icon }: HeroMetricData) {
  return (
    <div className="bg-white/15 border border-white/15 rounded-2xl p-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-white/90" strokeWidth={2.2} />
        <span className="text-[11px] font-medium text-white/85 leading-tight tracking-tight line-clamp-1">
          {title}
        </span>
      </div>
      <p className="text-xl font-bold text-white leading-none tabular-nums tracking-tight">
        {value}
      </p>
      <p className="text-[10px] text-white/70 leading-snug mt-1 line-clamp-1 font-medium">
        {description}
      </p>
    </div>
  );
}
