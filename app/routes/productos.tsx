import { Outlet } from "react-router";
import type { Route } from "./+types/productos";

// Layout de /productos: agrupa el listado (productos._index) y el detalle
// (productos.$slug) bajo la misma ruta. No renderiza contenido propio.

export function meta({}: Route.MetaArgs) {
  return [{ title: "Catálogo — Despensa Online" }];
}

export default function ProductosLayout() {
  return <Outlet />;
}