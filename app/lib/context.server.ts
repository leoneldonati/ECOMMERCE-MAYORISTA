import { createContext } from "react-router";
import type { PublicUser } from "~/db/types";

// Contexto de middleware: transporta el usuario autenticado hacia
// loaders/actions de rutas protegidas.
export const userContext = createContext<PublicUser | null>(null);
