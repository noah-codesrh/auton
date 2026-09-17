import { Outlet, useLocation } from "react-router";
import { Header } from "./header";

function headerVariant(pathname: string): "light" | "dark" {
  return pathname === "/staking" ? "dark" : "light";
}

export function AppLayout() {
  const { pathname } = useLocation();
  const variant = headerVariant(pathname);
  const isHome = pathname === "/";

  return (
    <>
      <Header variant={variant} />
      <div className={isHome ? undefined : "pt-24"}>
        <Outlet />
      </div>
    </>
  );
}
