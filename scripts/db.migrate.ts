import { getDb } from "../app/db/client.server";

// CLI: npm run db:migrate
// Abrir la conexión aplica automáticamente las migraciones pendientes.
const db = getDb();
console.log("Migraciones al día.");
db.close();
