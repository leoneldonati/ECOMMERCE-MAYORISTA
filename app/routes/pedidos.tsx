import { Outlet } from "react-router";

export default function PedidosLayout() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Outlet />
    </div>
  );
}
