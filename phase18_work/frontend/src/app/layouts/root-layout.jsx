import { Outlet } from "react-router-dom";

import { SkipLink } from "@/components/common/skip-link";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";

export function RootLayout() {
  useScrollToTop();

  return (
    <>
      <SkipLink />
      <Outlet />
    </>
  );
}
