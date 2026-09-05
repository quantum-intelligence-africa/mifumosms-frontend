// One dialer for the whole app. The "Piga simu" dialog is mounted once, here,
// above the router, so it can be opened from the sidebar (or anywhere else)
// and pops over whatever page is showing — and an in-progress browser call is
// not torn down by navigating between pages.
//
// Pages that list calls or recordings can refresh themselves when a call ends
// by listening for the "voice-call-ended" window event.
import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Lazy: the dialog pulls in the Africa's Talking WebRTC SDK, which nobody
// needs until they actually press "Piga simu".
const PlaceCallDialog = lazy(() =>
  import("@/components/voice/PlaceCallDialog").then((m) => ({ default: m.PlaceCallDialog })),
);

export const CALL_ENDED_EVENT = "voice-call-ended";

interface DialerContextValue {
  /** Open the dialer, optionally with a number already typed in. */
  openDialer: (number?: string) => void;
  closeDialer: () => void;
  isOpen: boolean;
}

const DialerContext = createContext<DialerContextValue | undefined>(undefined);

export function DialerProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [initialNumber, setInitialNumber] = useState("");

  const openDialer = useCallback((number?: string) => {
    setInitialNumber(number ?? "");
    setOpen(true);
  }, []);
  const closeDialer = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ openDialer, closeDialer, isOpen: open }), [openDialer, closeDialer, open]);

  return (
    <DialerContext.Provider value={value}>
      {children}
      {isAuthenticated && (
        <Suspense fallback={null}>
          <PlaceCallDialog
            open={open}
            onOpenChange={setOpen}
            initialNumber={initialNumber}
            defaultAgentNumber={user?.phone_number ?? ""}
            onCallEnded={() => window.dispatchEvent(new CustomEvent(CALL_ENDED_EVENT))}
          />
        </Suspense>
      )}
    </DialerContext.Provider>
  );
}

export function useDialer(): DialerContextValue {
  const ctx = useContext(DialerContext);
  if (!ctx) throw new Error("useDialer must be used within DialerProvider");
  return ctx;
}
