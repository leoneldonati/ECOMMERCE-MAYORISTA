import { Outlet } from "react-router";

import { Page } from "~/components/ui/page";

export default function PedidosLayout() {
  return (
    <Page size="lg">
      <Outlet />
    </Page>
  );
}
