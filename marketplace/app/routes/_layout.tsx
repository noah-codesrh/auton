import { Outlet } from "react-router";
import { AppLayout } from "../components/app-layout";

export default function MarketplaceLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
