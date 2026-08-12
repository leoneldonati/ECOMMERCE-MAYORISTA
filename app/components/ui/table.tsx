import type { ReactNode } from "react";

// Shell de tabla (admin y escalas de precio): contenedor con scroll horizontal
// y encabezado con el look del sitio. El tbody lo arma el llamador.

export function TableShell({ headers, children }: { headers: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 text-stone-500">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-4 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
