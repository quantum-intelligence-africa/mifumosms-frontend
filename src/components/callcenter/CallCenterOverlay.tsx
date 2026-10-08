import { useCallCenter } from "@/contexts/CallCenterContext";
import { ActiveCallPanel } from "./ActiveCallPanel";
import { IncomingCallModal } from "./IncomingCallModal";
import { WrapUpDialog } from "./WrapUpDialog";

/** Everything that must appear over any page: ringing, active call, wrap-up.
 *  Renders nothing for people who can't take calls, so it is safe to mount for everyone. */
export function CallCenterOverlay() {
  const { enabled, isAgent } = useCallCenter();
  if (!enabled || !isAgent) return null;
  return (
    <>
      <IncomingCallModal />
      <ActiveCallPanel />
      <WrapUpDialog />
    </>
  );
}
