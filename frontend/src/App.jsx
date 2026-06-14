import { RouterProvider } from "react-router-dom";

import { AppProviders } from "@/app/providers/app-providers";
import { router } from "@/app/router/routes";
import { RouteLoading } from "@/components/common/route-loading";

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} fallbackElement={<RouteLoading />} />
    </AppProviders>
  );
}
