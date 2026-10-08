import { Skeleton } from "@/components/ui/skeleton";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useAuth } from "@/contexts/AuthContext";
import { isCallCenterSupervisor } from "@/utils/roleUtils";
import { PageFrame } from "@/components/callcenter/PageFrame";
import Workspace from "./Workspace";
import Overview from "./Overview";

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
  return <Overview />;
}
