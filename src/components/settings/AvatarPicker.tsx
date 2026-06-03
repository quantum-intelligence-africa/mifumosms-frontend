import { Check } from "lucide-react";
import { useUserAvatar } from "@/hooks/useUserAvatar";

export function AvatarPicker() {
  const { avatar, setAvatar, options } = useUserAvatar();

  return (
    <div>
      <p className="text-xs text-foreground/60 dark:text-foreground/55 mb-3">
        Choose an avatar — it shows up on your dashboard and across the app.
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
        {options.map((src) => {
          const selected = src === avatar;
          return (
            <button
              key={src}
              type="button"
              onClick={() => setAvatar(src)}
              aria-pressed={selected}
              aria-label={`Use avatar ${src.split("/").pop()}`}
              className={[
                "relative aspect-square rounded-2xl overflow-hidden",
                "transition-all duration-150 active:scale-95",
                selected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-card dark:ring-offset-background"
                  : "ring-1 ring-border/60 dark:ring-border/40 hover:ring-border dark:hover:ring-border/60",
              ].join(" ")}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover bg-muted"
                loading="lazy"
              />
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
