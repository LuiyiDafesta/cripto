import { useParams } from "react-router-dom";
import Dashboard from "./Dashboard"; // El Dashboard actual (Crypto)
import { ArgentinaDashboard } from "./ArgentinaDashboard";
import { UsDashboard } from "./UsDashboard";

export const MarketDashboardWrapper = () => {
  const { market } = useParams();

  if (market === "argentina") return <ArgentinaDashboard />;
  if (market === "us") return <UsDashboard />;
  
  return <Dashboard />;
};
