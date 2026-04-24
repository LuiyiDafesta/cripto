import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { TopTicker } from "./TopTicker";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAlertEngine } from "@/hooks/useAlertEngine";

export const AppLayout = () => {
  const { user } = useAuth();
  const sync = useSupabaseSync(user?.id);

  // Run the alert evaluation engine globally
  useAlertEngine({ syncTriggerAlert: sync.syncTriggerAlert });

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopTicker />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 min-h-0 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
