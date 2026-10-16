import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useAuth } from "@/contexts/AuthContext";
import { isCallCenterSupervisor } from "@/utils/roleUtils";
import { PageFrame } from "@/components/callcenter/PageFrame";
import Workspace from "./Workspace";

/** Agents land on their workspace; supervisors/admins without an agent profile land on the live board. */
export default function Home() {
  const { user } = useAuth();
  const { isAgent, workspaceReady } = useCallCenter();

  if (!workspaceReady) {
    return (
      <PageFrame title="">
        <Skeleton className="h-32" />
      </PageFrame>
    );
  }
  if (isAgent || !isCallCenterSupervisor(user)) return <Workspace />;
  // Owners, admins and supervisors without an agent profile use the dashboard: it shows the live status and the same numbers.
  return <Navigate to="/dashboard" replace />;
}
