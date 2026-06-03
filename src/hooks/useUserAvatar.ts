import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const DEFAULT_AVATAR = "/avatar/avatar11.avif";

export const AVATAR_OPTIONS: string[] = [
  "/avatar/avatar11.avif",
  "/avatar/avataaars_5.png",
  "/avatar/avatar0.jpg",
  "/avatar/avatar4.jpg",
  "/avatar/avatar5.jpg",
  "/avatar/avatar6.avif",
  "/avatar/avatar7.avif",
  "/avatar/avatar8.avif",
  "/avatar/avatar9.jpg",
  "/avatar/black-avatar-3025348_960_720.png",
];

const STORAGE_PREFIX = "senda_user_avatar";
const CHANGE_EVENT = "senda-avatar-changed";

function storageKey(userId?: string): string {
  return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

function readAvatar(userId?: string): string {
  if (typeof window === "undefined") return DEFAULT_AVATAR;
  try {
    // Prefer the user-scoped value; fall back to the legacy global key so
    // anyone who already picked an avatar before this change keeps their choice.
    const scoped = localStorage.getItem(storageKey(userId));
    if (scoped) return scoped;
    if (userId) {
      const legacy = localStorage.getItem(STORAGE_PREFIX);
      if (legacy) return legacy;
    }
    return DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}

interface AvatarChangeDetail {
  path: string;
  userId?: string;
}

/**
 * Frontend-only avatar selection persisted per-user in localStorage.
 * The chosen avatar sticks for that user across reloads, browser restarts
 * and tab switches, and only changes when the user picks a different one.
 */
export function useUserAvatar() {
  const { user } = useAuth();
  const userId = user?.id ? String(user.id) : undefined;

  const [avatar, setAvatarState] = useState<string>(() => readAvatar(userId));

  // Re-sync when the auth user changes (login, logout, account switch).
  useEffect(() => {
    setAvatarState(readAvatar(userId));
  }, [userId]);

  const setAvatar = useCallback(
    (path: string) => {
      try {
        localStorage.setItem(storageKey(userId), path);
      } catch {
        /* ignore — quota or private mode */
      }
      setAvatarState(path);
      window.dispatchEvent(
        new CustomEvent<AvatarChangeDetail>(CHANGE_EVENT, {
          detail: { path, userId },
        }),
      );
    },
    [userId],
  );

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<AvatarChangeDetail>).detail;
      if (!detail) return;
      // Only react to events meant for the current user (or untargeted).
      if (detail.userId && detail.userId !== userId) return;
      setAvatarState(detail.path);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(userId)) {
        setAvatarState(readAvatar(userId));
      }
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [userId]);

  return { avatar, setAvatar, options: AVATAR_OPTIONS };
}
